# Data Sources, Licensing, and Provenance

This document details the provenance, licensing terms, citation requirements, and legal limitations for all biomedical datasets utilized in the **Patient-Specific Multi-Hop Drug Interaction Risk Discovery** project.

---

## 1. Dataset Provenance and Terms of Use

### 1.1 DDInter (Drug-Drug Interaction Database)

- **Official Website:** [https://ddinter2.scbdd.com/](https://ddinter2.scbdd.com/)
- **Download URL:** [https://ddinter2.scbdd.com/download/](https://ddinter2.scbdd.com/download/)
- **Terms of Service:** [https://ddinter2.scbdd.com/terms/](https://ddinter2.scbdd.com/terms/)
- **Primary Citation:** 
  > Xiong, G., et al. "DDInter: an online drug-drug interaction database towards improving clinical medication safety." *Nucleic Acids Research* 50.D1 (2022): D1200-D1207.
- **Licensing Model:** **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**
- **Permitted Uses:** Academic research, non-commercial evaluation, educational projects.
- **Restrictions & Obligations:**
  - **Attribution (BY):** Proper academic citation of the DDInter publication must accompany any presentation, paper, or system derived from this data.
  - **NonCommercial (NC):** The dataset and derived works may not be used for commercial purposes without prior permission.
  - **ShareAlike (SA):** Any adaptations or derivative databases shared publicly must be licensed under the same CC BY-NC-SA 4.0 license.
- **Data Content:** Pairwise drug-drug interactions categorized by severity level (`Major`, `Moderate`, `Minor`, and `Unknown`). Partitioned across anatomical therapeutic classifications (Codes A, B, D, H, L, P, R, V).

---

### 1.2 MecDDI (Mechanisms of Drug-Drug Interactions Database)

- **Official Website:** [https://mecddi.idrblab.net/](https://mecddi.idrblab.net/)
- **Download URL:** [https://mecddi.idrblab.net/download](https://mecddi.idrblab.net/download)
- **Primary Citation:**
  > Liu, S., et al. "MecDDI: a comprehensive database of mechanism-based drug-drug interactions." *Bioinformatics* (2024).
- **Licensing Model:** **All Rights Reserved (Proprietary / Academic Use Only)**
- **Terms & Legal Limitations:**
  - The MecDDI download portal states: *"All rights reserved. The data may be used for educational and non-commercial research purposes."*
  - **Redistribution Status:** Direct redistribution of raw or full derived MecDDI datasets in public version-control repositories is strictly prohibited unless explicitly granted by the copyright holders (IDRB Lab, Zhejiang University).
  - **Unresolved Licensing Question:** Whether a derived schema mapping between DDInter and MecDDI constitutes a redistributable transformation under fair academic use. Until formal permission or clarification is established, all raw MecDDI files and transformed dumps must remain strictly local and excluded from version control via `.gitignore`.
- **Data Content:** Pairwise drug-drug interaction mechanism categories, specifically:
  - Pharmacokinetic: Gastrointestinal absorption, Cellular transport, Organization distribution, Intra/extra-hepatic metabolism, Excretion pathways.
  - Pharmacodynamic: Additive effects, Antagonistic effects.
  - Drug general properties: PubChem CID, SMILES, InChI, CAS, Therapeutic Class, Disease Class.

---

## 2. Data Boundary Architecture

To ensure strict compliance with database licensing and patient privacy, data in this project is segregated into distinct layers:

```text
+--------------------------------------------------------------------------+
| 1. Raw Source Data (Git-Ignored)                                         |
|    - data/raw/ddinter/ (8 CSVs, CC BY-NC-SA 4.0)                        |
|    - data/raw/mecddi/ (9 CSVs, All Rights Reserved)                     |
+--------------------------------------------------------------------------+
                                    |
                                    v (Reproducible Python Preprocessing)
+--------------------------------------------------------------------------+
| 2. Local Processed Data (Git-Ignored)                                    |
|    - data/processed/ (Normalized tables, mapped IDs, audit logs)         |
+--------------------------------------------------------------------------+
                                    |
                                    v (PostgreSQL & Neo4j Staging)
+--------------------------------------------------------------------------+
| 3. Application Data Store                                                |
|    - Knowledge Graph & Canonical Pair Tables (Biomedical Evidence)       |
|    - Synthetic Patient Profiles & Prescriptions (Strictly Separated)    |
+--------------------------------------------------------------------------+
                                    |
                                    +--------------------------------------+
                                    |                                      |
                                    v                                      v
+----------------------------------------------------+ +-------------------+
| 4. Tracked Manifests & Metadata                    | | 5. Tracked Small  |
|    - data/manifests/data_sources.md                | |    Test Samples   |
|    - data/manifests/source_manifest.csv            | |    data/samples/  |
|    - Checksums, row counts, provenance notes       | |    (Mock/fixtures)|
+----------------------------------------------------+ +-------------------+
```

---

## 3. Strict Prohibitions

1. **No Identifiable Patient Health Information (PHI):** All patient profiles, diagnoses, and prescriptions are 100% synthetically generated. Under no circumstances should real patient data be introduced.
2. **No Data Fabrication:** Relationships between drugs, severity ratings, and mechanisms must originate exclusively from verified records in DDInter or MecDDI.
3. **No Uncorroborated Medical Claims:** Any interaction discovered via multi-hop graph traversal must be explicitly qualified as a *candidate mechanism pathway* rather than a confirmed clinical drug interaction.
