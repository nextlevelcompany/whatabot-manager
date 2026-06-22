package com.nextlead.dao;

import com.nextlead.models.ShippingCoverage;
import com.nextlead.models.AiProductConfig;
import com.nextlead.models.AiKnowledgeBase;
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
