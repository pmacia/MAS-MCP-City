# Dataset Card — Wi-Fi Association Dataset

**Version:** 1.0  
**Date:** 2025-10-31  
**Maintainer:** MAS-MCP City Project (University of Alicante Consortium)  
**License:** CC BY-NC 4.0  
**Repository:** [https://github.com/pmacia/MAS-MCP-City](https://github.com/pmacia/MAS-MCP-City)  
**Related Publication:**  
F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni, *MAS-MCP City…*, *FGCS*, 2025.  
DOI: [10.5281/zenodo.TODO](https://doi.org/10.5281/zenodo.TODO)

---

## 1️⃣ Dataset Summary

| Field | Description |
|-------|--------------|
| **Name** | Wi-Fi Association Dataset |
| **Domain** | Occupancy proxy (network telemetry) |
| **Scope** | Two campuses, aggregated by AP/SSID per 5-min interval |
| **Time span** | 90 + 21 days (aligned with CO₂ dataset) |
| **Sampling interval** | 5 min |
| **Total records** | ~500,000 |
| **Format** | CSV / JSON |
| **Used by** | Occupancy estimation (Sections 5–8, Fig. 7C) |

---

## 2️⃣ Description and Context

Anonymized counts of station–AP associations aggregated by access point and SSID.  
Serves as a proxy for room occupancy and complements CO₂ and booking data.  
Ingested via the `ngsi_query` MCP tool with scope `ngsi`, producing contextual occupancy states.

---

## 3️⃣ Data Fields and Schema

| Field | Type | Unit / Example | Description |
|--------|------|----------------|--------------|
| `timestamp` | ISO 8601 | `2025-10-31T09:05:00Z` | Aggregation window |
| `ap_id` | string | `AP-A1-101` | Access point identifier |
| `ssid` | string | `"CampusUA"` | Network SSID |
| `associations` | integer | `23` | Number of connected devices |
| `building_id` | string | `urn:ngsi-ld:Building:ES-UA:A1` | Linked NGSI-LD entity |

---

## 4️⃣ Metrics Derived in the Paper

| Metric | Definition | Reported Change |
|---------|-------------|----------------|
| **Occupancy MAE** | Mean Absolute Error vs ground-truth occupancy | −14 % |
| **F1 Score** | Occupancy detection F1 | +0.08 |

---

## 5️⃣ Provenance and Processing

- **Source:** Campus Wi-Fi infrastructure logs (aggregated)  
- **Anonymization:** MAC addresses hashed, counts only  
- **Preprocessing:** 5-min aggregation, SSID filtering, NGSI-LD linkage  
- **Validation:** cross-check with room booking occupancy  
- **Storage:** `/fixtures/ngsi/`

---

## 6️⃣ Privacy and Ethics

- No personal identifiers retained; all MACs are hashed.  
- Aggregation window ensures k-anonymity.  
- Covered by [`doc/DPIA.md`](DPIA.md) (GDPR low-risk).

---

## 7️⃣ Schema Reference

```json
{
  "timestamp": "2025-10-31T09:05:00Z",
  "ap_id": "AP-A1-101",
  "ssid": "CampusUA",
  "associations": 23,
  "building_id": "urn:ngsi-ld:Building:ES-UA:A1"
}
```

---

## 8️⃣ Usage and Reproducibility

Use alongside CO₂ and booking fixtures to reproduce occupancy analytics (Sections 7–8).

---

## 9️⃣ Citation

> F. Maciá-Pérez et al., *MAS-MCP City*, *Future Generation Computer Systems*, 2025.
> DOI: [10.5281/zenodo.TODO](https://doi.org/10.5281/zenodo.TODO)
