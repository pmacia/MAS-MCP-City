# Dataset Card — Room Booking Dataset

**Version:** 1.0  
**Date:** 2025-10-31  
**Maintainer:** MAS-MCP City Project (University of Alicante Consortium)  
**License:** CC BY-NC 4.0  
**Repository:** [https://github.com/pmacia/MAS-MCP-City](https://github.com/pmacia/MAS-MCP-City)  
**Related Publication:**  
F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni, *MAS-MCP City…*, *FGCS*, 2025.  
DOI: [10.5281/zenodo.17500006](https://doi.org/10.5281/zenodo.17500006)

---

## 1️⃣ Dataset Summary

| Field | Description |
|-------|--------------|
| **Name** | Room Booking Dataset |
| **Domain** | Occupancy planning / schedule data |
| **Scope** | Official timetables for 10 universities (Kunna consortium) |
| **Time span** | Synchronized with IAQ campaign (90 + 21 days) |
| **Sampling interval** | 1 hour |
| **Total records** | ~25,000 |
| **Format** | CSV / JSON |
| **Used by** | Occupancy ground truth and cross-validation (Sections 5–8) |

---

## 2️⃣ Description and Context

This dataset provides anonymized room booking records used as ground truth for occupancy inference.  
Entries are aligned with Wi-Fi and CO₂ timelines to enable cross-domain fusion in the IAQ orchestrator workflow.

---

## 3️⃣ Data Fields and Schema

| Field | Type | Example | Description |
|--------|------|----------|-------------|
| `room_id` | string | `A1-1.01` | Local room identifier |
| `building_id` | string | `urn:ngsi-ld:Building:ES-UA:A1` | Linked NGSI-LD entity |
| `start_time` | ISO 8601 | `2025-10-31T09:00:00Z` | Start of scheduled slot |
| `end_time` | ISO 8601 | `2025-10-31T10:00:00Z` | End of slot |
| `status` | string | `"booked"` / `"free"` | Occupancy label |

---

## 4️⃣ Metrics Derived in the Paper

| Metric | Definition | Reported Change |
|---------|-------------|----------------|
| **Occupancy MAE** | MAE of inferred vs. scheduled occupancy | −14 % |
| **F1 Score** | F1-score of occupancy detection | +0.08 |

---

## 5️⃣ Provenance and Processing

- **Source:** Academic scheduling systems (ICS/Google Calendar exports)  
- **Processing:** time normalization, entity linking (NGSI-LD), anonymization of event titles  
- **Validation:** cross-comparison with Wi-Fi associations  
- **Storage:** `/fixtures/bookings/`

---

## 6️⃣ Privacy and Ethics

- Contains no personal identifiers.  
- Titles and participants stripped; only occupancy state preserved.  
- Falls under low-risk DPIA (`doc/DPIA.md`).

---

## 7️⃣ Schema Reference

```json
{
  "room_id": "A1-1.01",
  "building_id": "urn:ngsi-ld:Building:ES-UA:A1",
  "start_time": "2025-10-31T09:00:00Z",
  "end_time": "2025-10-31T10:00:00Z",
  "status": "booked"
}
```

---

## 8️⃣ Usage and Reproducibility

Combine with Wi-Fi and CO₂ fixtures to reproduce occupancy KPIs:

```bash
node agents/iaq-orchestrator/dist/cli.js
```

---

## 9️⃣ Citation

> F. Maciá-Pérez et al., *MAS-MCP City*, *Future Generation Computer Systems*, 2025.
> DOI: [10.5281/zenodo.17500006](https://doi.org/10.5281/zenodo.17500006)
