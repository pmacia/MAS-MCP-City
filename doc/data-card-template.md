# Dataset Card — {{DATASET NAME}}

**Version:** 1.0  
**Date:** 2025-10-31  
**Maintainer:** MAS-MCP City Project (University of Alicante Consortium)  
**License:** CC BY-NC 4.0  
**Repository:** [https://github.com/pmacia/MAS-MCP-City](https://github.com/pmacia/MAS-MCP-City)  
**Related Publication:**  
F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni, *MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings…*, *Future Generation Computer Systems*, 2025.  
DOI: [10.5281/zenodo.TODO](https://doi.org/10.5281/zenodo.TODO)

---

## 1️⃣ Dataset Summary

| Field | Description |
|-------|--------------|
| **Name** | {{DATASET NAME}} |
| **Domain** | SmartCampus / Indoor Air Quality and Occupancy |
| **Scope** | Two campuses, 41 buildings, 612 rooms |
| **Time span** | 90 + 21 days of continuous operation |
| **Sampling interval** | {{e.g., 10–15 min for LoRa sensors / 5 min for Wi-Fi / hourly for bookings}} |
| **Total records** | {{approx. N rows or events}} |
| **File format** | JSON / CSV / JSON-LD (see fixtures/) |
| **Schema reference** | See `fixtures/{{dataset}}/*.json` and schema section below |
| **Used by** | Sections 5–8 of the paper; Figs. 7–8 |

---

## 2️⃣ Description and Context

Briefly describe:
- The purpose of the dataset within the SmartCampus demonstrator.  
- How it feeds the MAS-MCP pipeline (Perception → Deliberation → Memory → Execution).  
- Its mapping to NGSI-LD entities or SensorThings resources.

Example wording for CO₂:
> The CO₂ dataset represents indoor air-quality readings from LoRaWAN sensors, used as proxy for ventilation adequacy. Each observation is ingested through the `sta_get_observations` MCP tool, producing time-series traces used to compute IAQ KPIs.

---

## 3️⃣ Data Fields and Schema

| Field | Type | Unit / Example | Description |
|--------|------|----------------|--------------|
| `timestamp` | ISO 8601 | `2025-10-31T09:15:00Z` | Measurement time |
| `value` | number | e.g. 650 ppm CO₂ / 20 users / "occupied" | Primary measurement |
| `sensor_id` | string | `A1-1.01` | Room or AP identifier |
| `building_id` | string | `urn:ngsi-ld:Building:ES-UA:A1` | Linked context entity |
| {{other fields}} |  |  |  |

---

## 4️⃣ Metrics Derived in the Paper

| Metric | Definition | Source | Reported Change |
|---------|-------------|---------|----------------|
| **Minutes > 1000 ppm CO₂** | Sum of minutes per room above 1000 ppm | CO₂ dataset | −39 % |
| **Rooms > 1500 ppm** | Fraction of rooms exceeding 1500 ppm CO₂ | CO₂ dataset | 7.4 % → 3.1 % |
| **Purge time (< 800 ppm)** | Minutes to reach < 800 ppm after ventilation | CO₂ dataset | 22 → 15 min |
| **Occupancy MAE** | Mean Absolute Error between Wi-Fi+bookings vs ground truth | Wi-Fi + Bookings | −14 % |
| **F1 score** | Detection F1 of occupied / unoccupied rooms | Wi-Fi + Bookings | +0.08 |
| **TTI / P95 latency / failures** | Integration-time and pipeline KPIs | All datasets | see Section 9 |

---

## 5️⃣ Provenance and Processing

- **Data source:** {{sensor or system origin}}  
  e.g., *LoRa CO₂ sensors (UA/UMH network)*, *Wi-Fi association logs (aggregated and anonymized)*, *Room booking system (ICS)*  
- **Acquisition method:** via OGC SensorThings API / NGSI-LD Context Broker / internal API.  
- **Preprocessing:** normalization, anonymization, alignment to 5-min bins.  
- **Validation:** unit checks, time bounds, schema validation (Zod/JSON Schema).  
- **Storage:** shared as fixtures under `/fixtures/{{dataset}}/`.

---

## 6️⃣ Privacy and Ethics

- All identifiers are **anonymized or hashed** (no personal data).  
- The dataset falls under a **low-risk DPIA**, documented in [`doc/DPIA.md`](DPIA.md).  
- Aggregation and retention policies follow GDPR Art. 89 (Research derogation).  
- Re-identification risk: *negligible*.

---

## 7️⃣ Schema Reference (simplified JSON Schema)

```json
{
  "type": "object",
  "properties": {
    "timestamp": { "type": "string", "format": "date-time" },
    "value": { "type": "number" },
    "sensor_id": { "type": "string" },
    "building_id": { "type": "string" }
  },
  "required": ["timestamp", "value"]
}
```

---

## 8️⃣ Usage and Reproducibility

* Load the fixture files from `fixtures/{{dataset}}/` or the Zenodo archive.
* Reproduce analytics and figures using:

  ```bash
  node agents/iaq-orchestrator/dist/cli.js
  ```
* The same datasets were used to generate Figures 7–8 in the paper.
* Results are fully traceable through OTEL spans and policy decisions.

---

## 9️⃣ Citation

If reusing this dataset, please cite both the paper and the Zenodo DOI:

> F. Maciá-Pérez et al., *MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings for traceable SmartCampus IAQ and occupancy analytics*, *Future Generation Computer Systems*, 2025.
> DOI: [10.5281/zenodo.TODO](https://doi.org/10.5281/zenodo.TODO)

---

*(Replace `{{DATASET NAME}}` and dataset-specific details before saving each card.)*

---

### 🧩 Recomendaciones para adaptarlo

| Dataset | Sustituciones clave | Observaciones |
|----------|---------------------|----------------|
| **CO₂** | `{{DATASET NAME}} = CO₂ LoRa/LoRaWAN dataset`<br>`sampling interval = 10–15 min` | Menciona calibración de sensores y 41 buildings / 612 rooms |
| **Wi-Fi** | `{{DATASET NAME}} = Wi-Fi association dataset`<br>`sampling interval = 5 min` | Añade anonimización de MACs, conteo SSID/AP |
| **Bookings** | `{{DATASET NAME}} = Room booking dataset`<br>`sampling interval = hourly` | Indica fuente ICS/Google Calendar, horarios oficiales |

