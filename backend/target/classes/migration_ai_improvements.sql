-- Agregar columnas a la tabla ai_products_config si no existen
ALTER TABLE ai_products_config ADD COLUMN IF NOT EXISTS intent VARCHAR(100);
ALTER TABLE ai_products_config ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100;
ALTER TABLE ai_products_config ADD COLUMN IF NOT EXISTS media_id_whatsapp VARCHAR(200);
ALTER TABLE ai_products_config ADD COLUMN IF NOT EXISTS image_caption TEXT;

-- Agregar columnas a la tabla ai_knowledge_base si no existen
ALTER TABLE ai_knowledge_base ADD COLUMN IF NOT EXISTS intent VARCHAR(100);
ALTER TABLE ai_knowledge_base ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE ai_knowledge_base ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100;
ALTER TABLE ai_knowledge_base ADD COLUMN IF NOT EXISTS media_id_whatsapp VARCHAR(200);
ALTER TABLE ai_knowledge_base ADD COLUMN IF NOT EXISTS media_caption TEXT;

-- Agregar columnas a la tabla shipping_coverage si no existen
ALTER TABLE shipping_coverage ADD COLUMN IF NOT EXISTS aliases TEXT;
