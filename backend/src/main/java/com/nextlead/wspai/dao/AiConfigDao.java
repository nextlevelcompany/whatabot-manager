package com.nextlead.wspai.dao;

import com.nextlead.wspai.model.ShippingCoverage;
import com.nextlead.wspai.model.AiProductConfig;
import com.nextlead.wspai.model.AiKnowledgeBase;
import java.util.List;

public interface AiConfigDao {
    // Shipping Coverage
    List<ShippingCoverage> getAllShippingCoverage();
    void saveShippingCoverage(ShippingCoverage coverage);
    void deleteShippingCoverage(Integer id);

    // AI Products Config
    List<AiProductConfig> getAllAiProductsConfig();
    void saveAiProductConfig(AiProductConfig config);

    // AI Knowledge Base (FAQs)
    List<AiKnowledgeBase> getAllAiKnowledgeBase();
    void saveAiKnowledgeBase(AiKnowledgeBase kb);
    void deleteAiKnowledgeBase(Integer id);
}
