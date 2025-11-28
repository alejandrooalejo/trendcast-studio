-- Add production cost estimation field to analysis_products
ALTER TABLE analysis_products 
ADD COLUMN estimated_production_cost DECIMAL(10,2);