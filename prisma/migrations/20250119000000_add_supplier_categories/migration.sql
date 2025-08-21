-- Add categories and categoriesDetectedAt columns to suppliers table
ALTER TABLE suppliers ADD COLUMN categories TEXT;
ALTER TABLE suppliers ADD COLUMN categoriesDetectedAt DATETIME;
