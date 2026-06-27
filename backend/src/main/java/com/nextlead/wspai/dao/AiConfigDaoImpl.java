package com.nextlead.wspai.dao;

import com.nextlead.wspai.model.ShippingCoverage;
import com.nextlead.wspai.model.AiProductConfig;
import com.nextlead.wspai.model.AiKnowledgeBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AiConfigDaoImpl implements AiConfigDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public AiConfigDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<ShippingCoverage> shippingRowMapper = (rs, rowNum) -> {
        ShippingCoverage cov = new ShippingCoverage();
        cov.setId(rs.getInt("id"));
        cov.setDistrictName(rs.getString("district_name"));
        cov.setDeliveryFee(rs.getBigDecimal("delivery_fee"));
        cov.setMinOrderAmount(rs.getBigDecimal("min_order_amount"));
        cov.setIsActive(rs.getBoolean("is_active"));
        cov.setAliases(rs.getString("aliases"));
        return cov;
    };

    private final RowMapper<AiProductConfig> aiProductRowMapper = (rs, rowNum) -> {
        AiProductConfig cfg = new AiProductConfig();
        cfg.setId(rs.getObject("id") != null ? rs.getInt("id") : null);
        cfg.setProductoId(rs.getInt("producto_id"));
        cfg.setAiEnabled(rs.getObject("ai_enabled") != null ? rs.getBoolean("ai_enabled") : false);
        cfg.setSearchKeywords(rs.getString("search_keywords"));
        cfg.setCustomAiDescription(rs.getString("custom_ai_description"));
        cfg.setIntent(rs.getString("intent"));
        cfg.setPriority(rs.getObject("priority") != null ? rs.getInt("priority") : 100);
        cfg.setMediaIdWhatsapp(rs.getString("media_id_whatsapp"));
        cfg.setImageCaption(rs.getString("image_caption"));
        cfg.setProductCode(rs.getString("codigo"));
        cfg.setProductName(rs.getString("nombre"));
        cfg.setProductPrice(rs.getString("precio_venta"));
        cfg.setProductImage(rs.getString("imagen"));
        return cfg;
    };

    private final RowMapper<AiKnowledgeBase> kbRowMapper = (rs, rowNum) -> {
        AiKnowledgeBase kb = new AiKnowledgeBase();
        kb.setId(rs.getInt("id"));
        kb.setCategory(rs.getString("category"));
        kb.setKeywords(rs.getString("keywords"));
        kb.setAnswer(rs.getString("answer"));
        kb.setAttachmentUrl(rs.getString("attachment_url"));
        kb.setAttachmentType(rs.getString("attachment_type"));
        kb.setIntent(rs.getString("intent"));
        kb.setActive(rs.getObject("active") != null ? rs.getBoolean("active") : true);
        kb.setPriority(rs.getObject("priority") != null ? rs.getInt("priority") : 100);
        kb.setMediaIdWhatsapp(rs.getString("media_id_whatsapp"));
        kb.setMediaCaption(rs.getString("media_caption"));
        return kb;
    };

    // ==========================================
    // Shipping Coverage Implementation
    // ==========================================
    @Override
    public List<ShippingCoverage> getAllShippingCoverage() {
        String sql = "SELECT id, district_name, delivery_fee, min_order_amount, is_active, aliases " +
                     "FROM shipping_coverage ORDER BY district_name ASC";
        return jdbcTemplate.query(sql, shippingRowMapper);
    }

    @Override
    public void saveShippingCoverage(ShippingCoverage coverage) {
        if (coverage.getId() == null) {
            String sql = "INSERT INTO shipping_coverage (district_name, delivery_fee, min_order_amount, is_active, aliases) " +
                         "VALUES (?, ?, ?, ?, ?) ON CONFLICT (district_name) DO UPDATE SET " +
                         "delivery_fee = EXCLUDED.delivery_fee, min_order_amount = EXCLUDED.min_order_amount, " +
                         "is_active = EXCLUDED.is_active, aliases = EXCLUDED.aliases";
            jdbcTemplate.update(sql, coverage.getDistrictName(), coverage.getDeliveryFee(), coverage.getMinOrderAmount(),
                    coverage.getIsActive(), coverage.getAliases());
        } else {
            String sql = "UPDATE shipping_coverage SET district_name = ?, delivery_fee = ?, min_order_amount = ?, " +
                         "is_active = ?, aliases = ? WHERE id = ?";
            jdbcTemplate.update(sql, coverage.getDistrictName(), coverage.getDeliveryFee(), coverage.getMinOrderAmount(),
                    coverage.getIsActive(), coverage.getAliases(), coverage.getId());
        }
    }

    @Override
    public void deleteShippingCoverage(Integer id) {
        String sql = "DELETE FROM shipping_coverage WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    // ==========================================
    // AI Products Config Implementation
    // ==========================================
    @Override
    public List<AiProductConfig> getAllAiProductsConfig() {
        // Importante: por seguridad comercial, si no existe config de IA el producto queda desactivado para IA.
        String sql = "SELECT a.id, p.id AS producto_id, COALESCE(a.ai_enabled, FALSE) AS ai_enabled, " +
                     "COALESCE(a.search_keywords, p.nombre) AS search_keywords, a.custom_ai_description, " +
                     "a.intent, COALESCE(a.priority, 100) AS priority, a.media_id_whatsapp, a.image_caption, " +
                     "p.codigo, p.nombre, p.precio_venta, p.imagen " +
                     "FROM productos p LEFT JOIN ai_products_config a ON p.id = a.producto_id " +
                     "WHERE p.activo = TRUE ORDER BY COALESCE(a.priority, 100), p.nombre ASC";
        return jdbcTemplate.query(sql, aiProductRowMapper);
    }

    @Override
    public void saveAiProductConfig(AiProductConfig config) {
        String sql = "INSERT INTO ai_products_config (producto_id, ai_enabled, search_keywords, custom_ai_description, " +
                     "intent, priority, media_id_whatsapp, image_caption) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (producto_id) DO UPDATE SET " +
                     "ai_enabled = EXCLUDED.ai_enabled, search_keywords = EXCLUDED.search_keywords, " +
                     "custom_ai_description = EXCLUDED.custom_ai_description, intent = EXCLUDED.intent, " +
                     "priority = EXCLUDED.priority, media_id_whatsapp = EXCLUDED.media_id_whatsapp, " +
                     "image_caption = EXCLUDED.image_caption";
        Integer priority = config.getPriority() != null ? config.getPriority() : 100;
        jdbcTemplate.update(sql, config.getProductoId(), config.getAiEnabled(), config.getSearchKeywords(),
                config.getCustomAiDescription(), config.getIntent(), priority,
                config.getMediaIdWhatsapp(), config.getImageCaption());
    }

    // ==========================================
    // AI Knowledge Base Implementation
    // ==========================================
    @Override
    public List<AiKnowledgeBase> getAllAiKnowledgeBase() {
        String sql = "SELECT id, category, keywords, answer, attachment_url, attachment_type, intent, active, " +
                     "COALESCE(priority, 100) AS priority, media_id_whatsapp, media_caption " +
                     "FROM ai_knowledge_base WHERE COALESCE(active, TRUE) = TRUE ORDER BY COALESCE(priority, 100), id DESC";
        return jdbcTemplate.query(sql, kbRowMapper);
    }

    @Override
    public void saveAiKnowledgeBase(AiKnowledgeBase kb) {
        if (kb.getId() == null) {
            String sql = "INSERT INTO ai_knowledge_base (category, keywords, answer, attachment_url, attachment_type, " +
                         "intent, active, priority, media_id_whatsapp, media_caption) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            Boolean active = kb.getActive() != null ? kb.getActive() : true;
            Integer priority = kb.getPriority() != null ? kb.getPriority() : 100;
            jdbcTemplate.update(sql, kb.getCategory(), kb.getKeywords(), kb.getAnswer(), kb.getAttachmentUrl(),
                    kb.getAttachmentType(), kb.getIntent(), active, priority,
                    kb.getMediaIdWhatsapp(), kb.getMediaCaption());
        } else {
            String sql = "UPDATE ai_knowledge_base SET category = ?, keywords = ?, answer = ?, attachment_url = ?, " +
                         "attachment_type = ?, intent = ?, active = ?, priority = ?, media_id_whatsapp = ?, " +
                         "media_caption = ? WHERE id = ?";
            Boolean active = kb.getActive() != null ? kb.getActive() : true;
            Integer priority = kb.getPriority() != null ? kb.getPriority() : 100;
            jdbcTemplate.update(sql, kb.getCategory(), kb.getKeywords(), kb.getAnswer(), kb.getAttachmentUrl(),
                    kb.getAttachmentType(), kb.getIntent(), active, priority,
                    kb.getMediaIdWhatsapp(), kb.getMediaCaption(), kb.getId());
        }
    }

    @Override
    public void deleteAiKnowledgeBase(Integer id) {
        String sql = "DELETE FROM ai_knowledge_base WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
