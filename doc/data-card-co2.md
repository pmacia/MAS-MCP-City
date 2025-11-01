# Dataset Card — CO₂ LoRa/LoRaWAN Dataset

**Version:** 1.0  
**Date:** 2025-10-31  
**Maintainer:** MAS-MCP City Project (University of Alicante Consortium)  
**License:** CC BY-NC 4.0  
**Repository:** [https://github.com/pmacia/MAS-MCP-City](https://github.com/pmacia/MAS-MCP-City)  
**Related Publication:**  
F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni, *MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings for traceable SmartCampus IAQ and occupancy analytics*, *Future Generation Computer Systems*, 2025.  
DOI: [10.5281/zenodo.17500006](https://doi.org/10.5281/zenodo.17500006)

---

## 1️⃣ Dataset Summary

| Field | Description |
|-------|--------------|
| **Name** | CO₂ LoRa/LoRaWAN Dataset |
| **Domain** | Indoor Air Quality (IAQ) monitoring |
| **Scope** | Two SmartCampus sites, 41 buildings, 612 rooms |
| **Time span** | 90 + 21 days of operation |
| **Sampling interval** | 10–15 min |
| **Total records** | ~240,000 observations |
| **Format** | JSON (OGC SensorThings Observations) |
| **Used by** | IAQ metrics (Sections 5–8, Fig. 7B–C) |

---

## 2️⃣ Description and Context

This dataset contains indoor CO₂ concentration readings collected via LoRaWAN sensors across two campuses.  
Each observation is ingested through the `sta_get_observations` MCP tool and linked to its NGSI-LD room entity, forming the time-series foundation for IAQ analytics and occupancy inference.

---

## 3️⃣ Data Fields and Schema

| Field | Type | Unit / Example | Description |
|--------|------|----------------|--------------|
| `timestamp` | ISO 8601 | `2025-10-31T09:15:00Z` | Observation time |
| `value` | number | `650` | CO₂ concentration (ppm) |
| `sensor_id` | string | `A1-1.01` | Sensor code / room |
| `building_id` | string | `urn:ngsi-ld:Building:ES-UA:A1` | Linked NGSI-LD entity |

---

## 4️⃣ Metrics Derived in the Paper

| Metric | Definition | Reported Change |
|---------|-------------|----------------|
| **Minutes > 1000 ppm CO₂** | Per-room minutes above threshold | −39 % (38 → 23 min) |
| **Rooms > 1500 ppm** | % of rooms exceeding 1500 ppm | 7.4 % → 3.1 % |
| **Purge time (<800 ppm)** | Minutes to reach <800 ppm after ventilation | 22 → 15 min |

---

## 5️⃣ Provenance and Processing

- **Source:** LoRa/LoRaWAN CO₂ sensors in classrooms and offices  
- **Acquisition:** via OGC SensorThings API (`sta_get_observations`)  
- **Preprocessing:** JSON normalization, time alignment to 5-min bins  
- **Validation:** unit consistency, range checks (300–5000 ppm)  
- **Storage:** anonymized fixtures under `/fixtures/sta/`

---

## 6️⃣ Privacy and Ethics

- No personal data are collected.  
- Room identifiers are anonymized.  
- Covered under the low-risk DPIA documented in [`doc/DPIA.md`](DPIA.md).  

---

## 7️⃣ Schema Reference

```json
{
  "timestamp": "2025-10-31T09:15:00Z",
  "value": 650,
  "sensor_id": "A1-1.01",
  "building_id": "urn:ngsi-ld:Building:ES-UA:A1"
}
```

---

## 8️⃣ Usage and Reproducibility

Use the fixtures from `fixtures/sta/` to reproduce IAQ metrics and Fig. 7–8:

```bash
node agents/iaq-orchestrator/dist/cli.js
```

---

## 9️⃣ Citation

> F. Maciá-Pérez et al., *MAS-MCP City*, *Future Generation Computer Systems*, 2025.
> DOI: [10.5281/zenodo.17500006](https://doi.org/10.5281/zenodo.17500006)
