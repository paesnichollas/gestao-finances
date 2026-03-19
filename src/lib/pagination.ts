export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

export interface PaginationInput {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function normalizePagination(input: PaginationInput = {}) {
  const rawPage = Number(input.page ?? 1)
  const rawPageSize = Number(input.pageSize ?? DEFAULT_PAGE_SIZE)

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize)
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

function extractFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function parsePaginationSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): { page: number; pageSize: number } {
  const page = Number(extractFirst(searchParams.page))
  const pageSize = Number(extractFirst(searchParams.pageSize))
  const normalized = normalizePagination({ page, pageSize })
  return {
    page: normalized.page,
    pageSize: normalized.pageSize,
  }
}
