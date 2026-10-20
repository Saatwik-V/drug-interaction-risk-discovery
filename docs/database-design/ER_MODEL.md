# Conceptual Entity-Relationship (ER) Model Specification

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course:** PES University DBMS Experiential Learning Level 3 (August–December 2026)  
**Notation:** Peter Chen Notation with `(min, max)` Structural Constraints (as per PESU CSE `ER_MODEL.pdf`)  
**ER Diagram Artifacts:**
- **Diagram (Draw.io XML):** [`ER_Diagram_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.drawio)
- **Vector Document (PDF):** [`ER_Diagram_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf)
- **High-Resolution Raster (PNG):** [`ER_Diagram_Final.png`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.png)

---

## 1. Modeling Philosophy & Rubric Alignment

The conceptual ER model represents the biomedical, clinical, and security domain requirements of the multi-hop drug interaction risk discovery platform. It strictly reflects the database architecture implemented in PostgreSQL 16 and Neo4j 5 without omitting tables or inventing unsupported entities.

### Key Conceptual Distinctions:
1. **Explicit `DDI_PAIR` Entity:** Rather than collapsing drug interactions into a simple recursive many-to-many relationship with multi-valued attributes, `DDI_PAIR` is modeled as a first-class entity with its own primary key (`pair_id`). It links to `DRUG` via two distinct roles: `Drug A` and `Drug B` (`drug_a_id < drug_b_id`).
2. **4NF Separation of Severity and Mechanism:** Sourced biomedical evidence has independent multi-valued properties:
   - `DDI_SEVERITY`: Sourced from DDInter (`Major`, `Moderate`, `Minor`, `Unknown`).
   - `DDI_MECHANISM`: Sourced from MecDDI (up to 3 independent mechanism categories).  
   Each is an independent child entity connected to `DDI_PAIR`, eliminating multi-valued dependencies.
3. **Explicit Connection of Findings to Drugs:** `ASSESSMENT_FINDING` connects to `DRUG` twice (`FINDING_DRUG_A` and `FINDING_DRUG_B`), reflecting the exact endpoints of each discovered candidate pathway or direct interaction.
4. **Distinction Between Enforced and Conceptual Relationships:** The relationship `PERFORMED_BY` between `USER_ACCOUNT` and `RISK_ASSESSMENT` is drawn with a dashed line to indicate an audit relationship tracked via clinician usernames without a physical relational foreign key constraint.

---

## 2. Entity Catalog

| Entity Name | Primary Key | Key Attributes | Domain Meaning |
|---|---|---|---|
| `DRUG` | `drug_id` | `canonical_name`, `pubchem_cid`, `inchikey`, `smiles`, `drug_type`, `therapeutic_class`, `created_at` | Canonical chemical entity harmonized across sources. |
| `DRUG_SOURCE_MAPPING` | `mapping_id` | `drug_id`, `source_name`, `source_drug_id`, `source_drug_name`, `match_method`, `created_at` | Provenance tracking linking external database IDs to canonical drugs. |
| `DDI_PAIR` | `pair_id` | `drug_a_id`, `drug_b_id`, `created_at` | Canonical unordered interaction pair (`drug_a_id < drug_b_id`). |
| `DDI_SEVERITY` | `severity_id` | `pair_id`, `severity_level`, `source_dataset`, `source_atc_codes`, `created_at` | DDInter clinical interaction severity ratings. |
| `DDI_MECHANISM` | `mechanism_id` | `pair_id`, `mechanism_category`, `source_dataset`, `created_at` | MecDDI pharmacological mechanism categories. |
| `PATIENT` | `patient_id` | `mrn`, `full_name`, `gender`, `date_of_birth`, `primary_condition`, `is_synthetic`, `created_at` | Synthetic patient demographic profiles. |
| `PRESCRIPTION` | `prescription_id` | `patient_id`, `drug_id`, `dosage`, `frequency`, `status`, `prescribed_by`, `start_date`, `end_date`, `created_at` | Active and past medication orders for patients. |
| `RISK_ASSESSMENT` | `assessment_id` | `patient_id`, `performed_by`, `max_hop_depth`, `total_active_medications`, `direct_interaction_count`, `multi_hop_candidate_count`, `assessment_notes`, `created_at` | Polypharmacy risk screening session header. |
| `ASSESSMENT_FINDING` | `finding_id` | `assessment_id`, `drug_a_id`, `drug_b_id`, `hop_count`, `traversal_path`, `severity_level`, `mechanism_category`, `evidence_sources`, `finding_type`, `created_at` | Individual direct risks and candidate multi-hop pathways discovered. |
| `USER_ACCOUNT` | `user_id` | `username`, `password_hash`, `full_name`, `role`, `is_active`, `created_at` | System user credentials with role-based access control. |

---

## 3. Relationship Catalog with `(min, max)` Structural Constraints

| Relationship | Participating Entities | Roles / Direction | Participation | Cardinality | Structural Constraint `(min, max)` |
|---|---|---|---|---|---|
| `MAPPED_TO` | `DRUG_SOURCE_MAPPING`, `DRUG` | Mapping references Drug | Total (Mapping), Partial (Drug) | `N : 1` | Mapping: `(1, 1)`, Drug: `(0, N)` |
| `DRUG_A_IN_PAIR` | `DDI_PAIR`, `DRUG` | Pair has Drug A endpoint | Total (Pair), Partial (Drug) | `N : 1` | Pair: `(1, 1)`, Drug: `(0, N)` |
| `DRUG_B_IN_PAIR` | `DDI_PAIR`, `DRUG` | Pair has Drug B endpoint | Total (Pair), Partial (Drug) | `N : 1` | Pair: `(1, 1)`, Drug: `(0, N)` |
| `HAS_SEVERITY` | `DDI_PAIR`, `DDI_SEVERITY` | Pair has severity ratings | Partial (Pair), Total (Severity) | `1 : N` | Pair: `(0, N)`, Severity: `(1, 1)` |
| `HAS_MECHANISM` | `DDI_PAIR`, `DDI_MECHANISM` | Pair has mechanism categories | Partial (Pair), Total (Mechanism) | `1 : N` | Pair: `(0, N)`, Mechanism: `(1, 1)` |
| `RECEIVES` | `PATIENT`, `PRESCRIPTION` | Patient receives prescription | Partial (Patient), Total (Prescription) | `1 : N` | Patient: `(0, N)`, Prescription: `(1, 1)` |
| `PRESCRIBES` | `PRESCRIPTION`, `DRUG` | Prescription orders drug | Total (Prescription), Partial (Drug) | `N : 1` | Prescription: `(1, 1)`, Drug: `(0, N)` |
| `UNDERGOES` | `PATIENT`, `RISK_ASSESSMENT` | Patient undergoes screening | Partial (Patient), Total (Assessment) | `1 : N` | Patient: `(0, N)`, Assessment: `(1, 1)` |
| `PRODUCES` | `RISK_ASSESSMENT`, `ASSESSMENT_FINDING` | Assessment produces findings | Partial (Assessment), Total (Finding) | `1 : N` | Assessment: `(0, N)`, Finding: `(1, 1)` |
| `FINDING_DRUG_A` | `ASSESSMENT_FINDING`, `DRUG` | Finding starts with Drug A | Total (Finding), Partial (Drug) | `N : 1` | Finding: `(1, 1)`, Drug: `(0, N)` |
| `FINDING_DRUG_B` | `ASSESSMENT_FINDING`, `DRUG` | Finding ends with Drug B | Total (Finding), Partial (Drug) | `N : 1` | Finding: `(1, 1)`, Drug: `(0, N)` |
| `PERFORMED_BY` | `USER_ACCOUNT`, `RISK_ASSESSMENT` | User performs assessment *(conceptual)* | Partial (User), Partial (Assessment) | `1 : N` | User: `(0, N)`, Assessment: `(0, 1)` |
