-- Add new trend analysis fields to analysis_products table
ALTER TABLE analysis_products 
  ADD COLUMN IF NOT EXISTS trend_status TEXT,
  ADD COLUMN IF NOT EXISTS trend_level TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS related_trend TEXT,
  ADD COLUMN IF NOT EXISTS current_usage TEXT,
  ADD COLUMN IF NOT EXISTS recommendation TEXT;