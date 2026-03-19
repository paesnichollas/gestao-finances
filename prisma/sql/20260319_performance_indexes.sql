-- Indices operacionais sem downtime (PostgreSQL)
-- Executar com:
-- pnpm prisma db execute --file prisma/sql/20260319_performance_indexes.sql --schema prisma/schema.prisma

CREATE INDEX CONCURRENTLY IF NOT EXISTS "revenues_date_idx" ON "revenues" ("date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "expenses_date_idx" ON "expenses" ("date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "partners_isActive_name_idx" ON "partners" ("isActive", "name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "expense_payments_expenseId_idx" ON "expense_payments" ("expenseId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "expense_payments_partnerId_idx" ON "expense_payments" ("partnerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "settlements_createdAt_idx" ON "settlements" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "settlement_partner_summaries_settlementId_idx" ON "settlement_partner_summaries" ("settlementId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "settlement_partner_summaries_partnerId_idx" ON "settlement_partner_summaries" ("partnerId");
