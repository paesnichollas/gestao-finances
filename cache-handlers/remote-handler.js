/* eslint-disable @typescript-eslint/no-require-imports */
const { Redis } = require('@upstash/redis')

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
const hasRemoteConfig = Boolean(redisUrl && redisToken)

const cachePrefix = 'next:cache:remote:'
const tagsKey = 'next:cache:remote:tags:invalidations'

const fallbackStore = new Map()
const fallbackTagInvalidations = new Map()
const pendingSets = new Map()

const debug = process.env.NEXT_PRIVATE_DEBUG_CACHE
  ? console.debug.bind(console, 'RemoteCacheHandler:')
  : undefined

const redis = hasRemoteConfig
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

function toStorageKey(cacheKey) {
  return `${cachePrefix}${cacheKey}`
}

async function streamToBase64(stream) {
  const reader = stream.getReader()
  const chunks = []
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) {
        break
      }
      chunks.push(Buffer.from(chunk.value))
    }
  } finally {
    reader.releaseLock()
  }

  return Buffer.concat(chunks).toString('base64')
}

function base64ToStream(base64Payload) {
  const payload = Buffer.from(base64Payload, 'base64')
  return new ReadableStream({
    start(controller) {
      controller.enqueue(payload)
      controller.close()
    },
  })
}

function toCacheEntry(stored) {
  return {
    value: base64ToStream(stored.payload),
    tags: Array.isArray(stored.tags) ? stored.tags : [],
    stale: Number(stored.stale ?? 0),
    timestamp: Number(stored.timestamp ?? 0),
    expire: Number(stored.expire ?? 0),
    revalidate: Number(stored.revalidate ?? 0),
  }
}

function getFallbackTagExpiration(tags) {
  let maxExpiration = 0
  for (const tag of tags) {
    const value = fallbackTagInvalidations.get(tag) ?? 0
    if (value > maxExpiration) {
      maxExpiration = value
    }
  }
  return maxExpiration
}

async function getRemoteTagExpiration(tags) {
  if (!redis || tags.length === 0) {
    return 0
  }

  const results = await Promise.all(
    tags.map((tag) => redis.hget(tagsKey, tag)),
  )

  let maxExpiration = 0
  for (const result of results) {
    const numeric = Number(result ?? 0)
    if (numeric > maxExpiration) {
      maxExpiration = numeric
    }
  }

  return maxExpiration
}

module.exports = {
  async get(cacheKey) {
    const pendingPromise = pendingSets.get(cacheKey)
    if (pendingPromise) {
      await pendingPromise
    }

    const now = Date.now()
    const storageKey = toStorageKey(cacheKey)

    if (!redis) {
      const stored = fallbackStore.get(storageKey)
      if (!stored) {
        return undefined
      }

      if (now > stored.timestamp + stored.revalidate * 1000) {
        fallbackStore.delete(storageKey)
        return undefined
      }

      const tagExpiration = getFallbackTagExpiration(stored.tags)
      if (tagExpiration && stored.timestamp <= tagExpiration) {
        fallbackStore.delete(storageKey)
        return undefined
      }

      return toCacheEntry(stored)
    }

    try {
      const stored = await redis.get(storageKey)
      if (!stored) {
        return undefined
      }

      if (now > stored.timestamp + stored.revalidate * 1000) {
        await redis.del(storageKey)
        return undefined
      }

      const tagExpiration = await getRemoteTagExpiration(stored.tags ?? [])
      if (tagExpiration && stored.timestamp <= tagExpiration) {
        await redis.del(storageKey)
        return undefined
      }

      return toCacheEntry(stored)
    } catch (error) {
      debug?.('get failed, returning miss', cacheKey, error)
      return undefined
    }
  },

  async set(cacheKey, pendingEntry) {
    let resolvePending = () => {}
    const pendingPromise = new Promise((resolve) => {
      resolvePending = resolve
    })
    pendingSets.set(cacheKey, pendingPromise)

    try {
      const entry = await pendingEntry
      const payload = await streamToBase64(entry.value)
      const stored = {
        payload,
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      }

      const storageKey = toStorageKey(cacheKey)

      if (!redis) {
        fallbackStore.set(storageKey, stored)
        return
      }

      const ttlSeconds = Number.isFinite(entry.expire) && entry.expire > 0
        ? entry.expire
        : undefined

      if (ttlSeconds) {
        await redis.set(storageKey, stored, { ex: ttlSeconds })
      } else {
        await redis.set(storageKey, stored)
      }
    } catch (error) {
      debug?.('set failed, skipping cache write', cacheKey, error)
    } finally {
      resolvePending()
      pendingSets.delete(cacheKey)
    }
  },

  async refreshTags() {
    // No-op. Tags are read directly from Redis on demand.
  },

  async getExpiration(tags) {
    if (!tags.length) {
      return 0
    }

    if (!redis) {
      return getFallbackTagExpiration(tags)
    }

    try {
      return await getRemoteTagExpiration(tags)
    } catch (error) {
      debug?.('getExpiration failed, returning 0', tags, error)
      return 0
    }
  },

  async updateTags(tags, durations) {
    if (!tags.length) {
      return
    }

    const now = Date.now()
    const expiration = durations?.expire
      ? now + durations.expire * 1000
      : now

    if (!redis) {
      for (const tag of tags) {
        fallbackTagInvalidations.set(tag, expiration)
      }
      return
    }

    try {
      await redis.hset(
        tagsKey,
        Object.fromEntries(tags.map((tag) => [tag, expiration])),
      )
    } catch (error) {
      debug?.('updateTags failed, cache may remain stale', tags, error)
    }
  },
}
