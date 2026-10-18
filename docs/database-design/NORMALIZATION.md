# Database Normalization Analysis & Justification

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**DBMS:** PostgreSQL 15+  
**Target Normal Form:** Third Normal Form (3NF) / Boyce-Codd Normal Form (BCNF)  

---

## 1. Normalization Objectives

In designing the schema for this multi-source polypharmacy risk discovery system, the primary normalization objectives were:
1. **Eliminate Redundancy and Update Anomalies:** Prevent storing identical drug properties or interaction metadata across thousands of pairwise combinations.
2. **Preserve Independent Provenance:** Keep clinical severity ratings (DDInter) strictly separated from pharmacological mechanism categories (MecDDI).
3. **Handle Multi-Valued Attributes Elegantly:** Support drugs that map to multiple external IDs and interaction pairs that span multiple mechanism categories (up to 3 categories) without creating repeating columns or comma-separated lists.
4. **Prevent Duplicate Symmetric Relationships:** Ensure that an interaction between Drug A and Drug B cannot be redundantly stored as both `(A, B)` and `(B, A)`.

---

## 2. Functional Dependency (FD) Analysis and Normal Form Proofs

### 2.1 Relation: `drugs`
- **Attributes:** `{drug_id, canonical_name, pubchem_cid, inchikey, smiles, drug_type, therapeutic_class, created_at}`
- **Candidate Keys:** `{drug_id}`, `{canonical_name}`
- **Functional Dependencies:**
  - `FD1: drug_id -> canonical_name, pubchem_cid, inchikey, smiles, drug_type, therapeutic_class, created_at`
  - `FD2: canonical_name -> drug_id, pubchem_cid, inchikey, smiles, drug_type, therapeutic_class, created_at`
- **Normal Form Analysis:**
  - **1NF:** All attributes are atomic scalars.
  - **2NF:** There are no partial dependencies on composite keys (all candidate keys are single attributes).
  - **3NF:** No non-prime attribute is transitively dependent on a candidate key.
  - **BCNF:** For every non-trivial functional dependency $X \to Y$, the determinant $X$ is a superkey (`drug_id` and `canonical_name` are both superkeys).
  - **Conclusion:** `drugs` is in **BCNF**.

---

### 2.2 Relation: `drug_source_mappings`
- **Attributes:** `{mapping_id, drug_id, source_name, source_drug_id, source_drug_name, match_method, created_at}`
- **Candidate Keys:** `{mapping_id}`, `{source_name, source_drug_id}`
- **Functional Dependencies:**
  - `FD1: mapping_id -> drug_id, source_name, source_drug_id, source_drug_name, match_method, created_at`
  - `FD2: {source_name, source_drug_id} -> mapping_id, drug_id, source_drug_name, match_method, created_at`
- **Why Separate from `drugs`?**
  - If external IDs were stored as columns in `drugs` (e.g., `ddinter_id`, `mecddi_id`), adding a third dataset (e.g., DrugBank, ChEMBL) would require schema alteration (violating Open/Closed principle).
  - Furthermore, if an external source ever assigned multiple IDs or synonym names to the same canonical chemical entity, storing them in `drugs` would create partial dependencies or non-atomic repeating groups.
  - In `drug_source_mappings`, for every FD $X \to Y$, $X$ is a candidate key.
  - **Conclusion:** `drug_source_mappings` is in **BCNF**.

---

### 2.3 Relation: `ddi_pairs`
- **Attributes:** `{pair_id, drug_a_id, drug_b_id, created_at}`
- **Candidate Keys:** `{pair_id}`, `{drug_a_id, drug_b_id}`
- **Functional Dependencies:**
  - `FD1: pair_id -> drug_a_id, drug_b_id, created_at`
  - `FD2: {drug_a_id, drug_b_id} -> pair_id, created_at`
- **Constraint Enforcement:**
  - To prevent symmetric duplication `(A, B)` vs `(B, A)`, the schema enforces:
    $$\text{CHECK} \ (drug\_a\_id < drug\_b\_id)$$
  - This check guarantees that every unordered pair has a unique, canonical representation.
  - **Conclusion:** `ddi_pairs` is in **BCNF**.

---

### 2.4 Relations: `ddi_severities` & `ddi_mechanisms`
- **Why Separate Severity from Mechanism?**
  - In DDInter, an interaction has an assessed clinical severity (`Major`, `Moderate`, `Minor`, `Unknown`), but no mechanism category.
  - In MecDDI, an interaction has 1 to 3 mechanism categories (`Affected cellular transport`, `Pharmacodynamic additive effects`, etc.), but no severity score.
  - Only 119,601 pairs overlap across both datasets; 40,634 pairs exist only in DDInter, and 58,805 pairs exist only in MecDDI.
  - If combined into a single table `ddi_attributes (pair_id, severity, mechanism_category)`:
    1. Pairs with 3 mechanisms would force severity to be duplicated 3 times across rows, violating 2NF/3NF (redundancy: `pair_id -> severity`).
    2. MecDDI-only pairs would store `NULL` for severity, and DDInter-only pairs would store `NULL` for mechanism.
  - **Normalized Decomposition:**
    - `ddi_severities (severity_id, pair_id, severity_level, source_dataset, source_atc_codes)`
      - Candidate Key: `{pair_id, source_dataset}`
      - FD: `{pair_id, source_dataset} -> severity_level, source_atc_codes` (1:1 with respect to pair & source)
      - **In BCNF**.
    - `ddi_mechanisms (mechanism_id, pair_id, mechanism_category, source_dataset)`
      - Candidate Key: `{pair_id, mechanism_category, source_dataset}`
      - Eliminates multi-valued dependency (MVD) $pair\_id \twoheadrightarrow mechanism\_category$.
      - **In 4NF (Fourth Normal Form)** because it isolates independent multi-valued facts.

---

### 2.5 Relations: `patients`, `prescriptions`, `risk_assessments`, `assessment_findings`
- **`patients`**: Key `{patient_id}`, Alternate Key `{mrn}`. All attributes depend strictly on the patient key. **BCNF**.
- **`prescriptions`**: Key `{prescription_id}`, Composite Alternate Key `{patient_id, drug_id, start_date}`.
  - FD: `{prescription_id} -> patient_id, drug_id, dosage, frequency, status, prescribed_by, start_date, end_date`
  - No transitive dependencies. **BCNF**.
- **`risk_assessments`**: Key `{assessment_id}`. Stores session-level aggregate metrics. **BCNF**.
- **`assessment_findings`**: Key `{finding_id}`.
  - Child table of `risk_assessments`. Decomposes individual multi-hop pathways and interaction risks found during a screening session.
  - FD: `{finding_id} -> assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path, severity_level, mechanism_category, finding_type`
  - **BCNF**.

---

## 3. Summary of Normalization Levels

| Table Name | Normal Form Achieved | Justification |
|---|---|---|
| `drugs` | **BCNF** | All determinants are candidate keys (`drug_id`, `canonical_name`). |
| `drug_source_mappings` | **BCNF** | Eliminates repeating groups of external IDs; all determinants are candidate keys. |
| `ddi_pairs` | **BCNF** | Single relationship table with canonical ordering check constraint. |
| `ddi_severities` | **BCNF** | Functional dependency `{pair_id, source} -> severity` isolated from mechanisms. |
| `ddi_mechanisms` | **4NF** | Eliminates multi-valued dependency for pairs with multiple mechanism categories. |
| `patients` | **BCNF** | Demographics keyed by surrogate and natural MRN. |
| `prescriptions` | **BCNF** | Transactional regimen table with full functional dependency on surrogate key. |
| `risk_assessments` | **BCNF** | Session header with candidate key `assessment_id`. |
| `assessment_findings` | **BCNF** | Granular interaction findings isolated from assessment header. |
| `user_accounts` | **BCNF** | Single-table authentication model with unique username. |

---

## 4. Controlled Denormalization Notes

There is **no uncontrolled denormalization** in this schema. Two controlled performance optimizations are explicitly documented:
1. `risk_assessments.direct_interaction_count` and `multi_hop_candidate_count`:
   - These are pre-aggregated summary counts stored in the assessment header for rapid display in clinician dashboards without executing repeated `COUNT(*)` aggregations across child `assessment_findings`.
   - Maintained transactionally or via database triggers upon finding insertion.
2. `assessment_findings.traversal_path`:
   - Stores the serialized textual explanation path (e.g., `Aspirin (D0089) -> Heparin (D0774) -> Warfarin (D1782)`) alongside foreign keys `drug_a_id` and `drug_b_id`.
   - Storing the human-readable path string eliminates expensive recursive self-joins when rendering risk explanation cards in the user interface.
