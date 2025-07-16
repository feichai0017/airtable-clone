-- JSONB Performance Indexes
-- Execute after initial migration for optimal query performance

-- GIN index for JSONB data column
CREATE INDEX CONCURRENTLY idx_rows_data_gin ON "Row" USING gin(data);

-- Text search index for cross-column searches
CREATE INDEX CONCURRENTLY idx_rows_data_text_search ON "Row" USING gin((data::text) gin_trgm_ops);

-- Composite index for table-specific queries
CREATE INDEX CONCURRENTLY idx_rows_table_data ON "Row" USING gin("tableId", data);

-- Enable trigram extension (requires superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm; 