# Source Data Audit & Inventory Report

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Audit Date:** October 18, 2026  
**Audited Datasets:** 8 DDInter CSVs (`data/raw/ddinter/`) & 9 MecDDI CSVs (`data/raw/mecddi/`)  
**Audit Tool:** `scripts/preprocessing/inspect_sources.py`

---

## 1. Executive Summary

A comprehensive automated audit was conducted across all 17 raw source CSV files residing in `data/raw/`. The audit verified record counts, schema conformity, missing values, duplicate entries, identifier consistency, interaction level distributions, mechanism classifications, and cross-source mapping fidelity.

### Key Findings

1. **DDInter (8 files, ATC Codes A, B, D, H, L, P, R, V):**
   - **Total Records:** 222,383 rows across 8 files.
   - **Unique Unordered Pairs:** 160,235 unique drug pairs.
   - **Unique Drug Entities:** 1,939 unique DDInter drug IDs.
   - **Level Distribution:** `Moderate` (96,675 / 60.3%), `Unknown` (29,813 / 18.6%), `Major` (26,914 / 16.8%), `Minor` (6,833 / 4.3%).
   - **Data Quality:** Zero missing/null values across all columns. Zero malformed records.
   - **Cross-File Consistency:** While 43,826 pairs appear in multiple ATC code files (due to multi-category drug classifications), there are **zero conflicting severity levels** across files.

2. **MecDDI (9 files):**
   - **Drug Master:** 1,922 unique drugs in `Drug General Information.csv` with complete chemical identifiers (PubChem CID, SMILES, InChIKey).
   - **Pair Master:** 178,406 unique unordered interaction pairs in `Drug-Drug-Interaction-Pair.csv`.
   - **Mechanism Classifications:** 7 distinct mechanism categories across 7 dedicated files.
   - **Multi-Category Pairs:** 174,627 pairs (97.9%) have 1 category; 3,478 pairs (1.95%) span 2 categories; 301 pairs (0.17%) span 3 categories.
   - **Referential Integrity:** 100% of drug IDs referenced in interaction and mechanism files exist in `Drug General Information.csv`. Zero name discrepancies.
   - **Absence of Enzyme/Target Entities:** Auditing confirms that MecDDI provides only coarse mechanism category labels (e.g., `Affected intra_extra-hepatic metabolism`); it does **not** contain named CYP enzymes (CYP3A4, CYP2D6), biological targets, adverse event codes, or clinical outcome scores.

3. **Cross-Source Harmonization:**
   - **Exact 1-to-1 Drug Matches:** 1,893 drug entities match cleanly on normalized name between DDInter and MecDDI.
   - **Ambiguous Matches:** 0 multi-match or ambiguous drug names.
   - **Unmapped Drugs:** 46 DDInter drugs and 29 MecDDI drugs remain unmapped.
   - **Overlapping Pairs:** 119,601 interaction pairs appear in **both** DDInter and MecDDI, forming a high-confidence core where both clinical severity and pharmacological mechanism categories are documented.

---

## 2. DDInter Source Audit (8 Files)

All DDInter files share an identical 5-column schema:
`DDInterID_A (string)`, `Drug_A (string)`, `DDInterID_B (string)`, `Drug_B (string)`, `Level (string)`

### 2.1 File-by-File Statistics

| Filename | File Size | SHA-256 Checksum (Prefix) | Row Count | Unique Drugs | Unique Pairs | Duplicates | Conflicting Levels |
|---|---|---|---:|---:|---:|---:|---:|
| `ddinter_downloads_code_A.csv` | 3.34 MB | `a22ca451d2b7` | 56,367 | 1,757 | 56,367 | 0 | 0 |
| `ddinter_downloads_code_B.csv` | 0.87 MB | `76de5115a555` | 15,140 | 1,503 | 15,140 | 0 | 0 |
| `ddinter_downloads_code_D.csv` | 1.52 MB | `c0627ec39965` | 25,681 | 1,607 | 25,681 | 0 | 0 |
| `ddinter_downloads_code_H.csv` | 0.71 MB | `ddc8ee5aa7d9` | 11,727 | 1,529 | 11,727 | 0 | 0 |
| `ddinter_downloads_code_L.csv` | 3.89 MB | `16a84cfdb1a9` | 65,389 | 1,780 | 65,389 | 0 | 0 |
| `ddinter_downloads_code_P.csv` | 0.32 MB | `9e54d3e8e19c` | 5,492 | 1,274 | 5,492 | 0 | 0 |
| `ddinter_downloads_code_R.csv` | 1.79 MB | `1c39c3d4a6e4` | 30,563 | 1,620 | 30,563 | 0 | 0 |
| `ddinter_downloads_code_V.csv` | 0.70 MB | `353973fb3004` | 12,024 | 1,692 | 12,024 | 0 | 0 |
| **Total (Aggregated)** | **13.14 MB** | — | **222,383** | **1,939** | **160,235** | **0** | **0** |

### 2.2 DDInter Severity Distribution by File

Original source labels are strictly preserved without imputation:

| File / ATC Code | Major | Moderate | Minor | Unknown | Total Rows |
|---|---:|---:|---:|---:|---:|
| `code_A` (Alimentary tract / metabolism) | 4,906 | 33,057 | 3,637 | 14,767 | 56,367 |
| `code_B` (Blood / blood forming organs) | 2,739 | 7,359 | 800 | 4,242 | 15,140 |
| `code_D` (Dermatologicals) | 2,314 | 13,519 | 2,015 | 7,833 | 25,681 |
| `code_H` (Systemic hormonal preparations) | 1,203 | 7,051 | 707 | 2,766 | 11,727 |
| `code_L` (Antineoplastic / immunomodulating) | 15,915 | 39,985 | 2,076 | 7,413 | 65,389 |
| `code_P` (Antiparasitic products) | 1,278 | 3,270 | 278 | 666 | 5,492 |
| `code_R` (Respiratory system) | 2,617 | 19,675 | 1,138 | 7,133 | 30,563 |
| `code_V` (Various) | 2,924 | 6,451 | 287 | 2,362 | 12,024 |
| **Unique Pairs (Deduplicated Across Files)** | **26,914** | **96,675** | **6,833** | **29,813** | **160,235** |

---

## 3. MecDDI Source Audit (9 Files)

### 3.1 Drug Master & Pair Master

1. **`Drug General Information.csv` (1,922 rows, 13 columns, 2.30 MB):**
   - **Key Attributes:** `Drug_ID` (e.g., `D0001` - `D1922`), `Drug_Name`, `PubChem_CID`, `InChIKey`, `Canonical_SMILES`.
   - **Completeness:** 1,922 / 1,922 records have valid `PubChem_CID`, `InChI`, `InChIKey`, `Canonical_SMILES`, and `Therapeutic_Class`.
   - **Missing Values:** Only 7 missing in `Synonymous` and 1 in `Formula`.
   - **Drug Types:** Small molecule (1,673), Monoclonal antibody (81), Protein/peptide (58), Hormones (27), Vaccine (26), Natural product (19), Others (38).

2. **`Drug-Drug-Interaction-Pair.csv` (178,406 rows, 4 columns, 7.10 MB):**
   - **Columns:** `A_Drug_ID`, `A_Drug_Name`, `B_Drug_ID`, `B_Drug_Name`.
   - **Pair Integrity:** 178,406 unique unordered pairs. Zero duplicate pairs.
   - **Master Validation:** 100% of referenced `Drug_ID`s exist in the drug master table.

### 3.2 Mechanism Categories (7 Dedicated Files)

All mechanism files use the schema:
`A_Drug_ID`, `A_Drug_Name`, `B_Drug_ID`, `B_Drug_Name`, `Mechanism_Category`

| Mechanism File | Category Label | Row Count | Unique Pairs | Duplicates in File | Unmatched IDs |
|---|---|---:|---:|---:|---:|
| `Affected cellular transport.csv` | `Affected cellular transport` | 4,983 | 4,983 | 0 | 0 |
| `Affected excretion pathways.csv` | `Affected excretion pathways` | 1,381 | 1,381 | 0 | 0 |
| `Affected gastrointestinal absorption.csv` | `Affected gastrointestinal absorption` | 5,207 | 5,207 | 0 | 0 |
| `Affected intra_extra-hepatic metabolism.csv` | `Affected intra_extra-hepatic metabolism` | 40,645 | 40,645 | 0 | 0 |
| `Affected organization distribution.csv` | `Affected organization distribution` | 1,110 | 1,110 | 0 | 0 |
| `Pharmacodynamic additive effects.csv` | `Pharmacodynamic additive effects` | 121,291 | 109,271 | 12,020 | 0 |
| `Pharmacodynamic antagonistic effects.csv` | `Pharmacodynamic antagonistic effects` | 22,688 | 22,664 | 24 | 0 |
| **Total Mechanism Records** | — | **197,305** | **178,406** | **12,044** | **0** |

*Note on Duplicate Rows:* In `Pharmacodynamic additive effects.csv` (12,020 duplicates) and `Pharmacodynamic antagonistic effects.csv` (24 duplicates), identical drug pairs appear with both `(A, B)` and `(B, A)` orderings, or repeated row instances. These are cleaned during canonical unordered normalization.

### 3.3 Multi-Mechanism Distribution

Across all 178,406 unique pairs in MecDDI:
- **1 Mechanism Category:** 174,627 pairs (97.88%)
- **2 Mechanism Categories:** 3,478 pairs (1.95%)
- **3 Mechanism Categories:** 301 pairs (0.17%)
- **Max Categories per Pair:** 3

---

## 4. Cross-Source Audit and Entity Alignment

### 4.1 Drug Entity Matching

- **DDInter Drug ID Count:** 1,939 unique IDs (`DDInter1` through `DDInter2010`).
- **MecDDI Drug ID Count:** 1,922 unique IDs (`D0001` through `D1922`).
- **Matching Methodology:** Conservative case-insensitive, whitespace-normalized string alignment preserving salt, formulation, and stereochemistry distinctions.
- **Matched 1-to-1 Entities:** **1,893 drugs** have an unambiguous 1-to-1 name match.
- **Ambiguous Matches:** 0 (no drug name in DDInter maps to multiple MecDDI IDs or vice versa).
- **Unmapped DDInter Drugs:** 46 drugs (e.g., specialized vaccines, herbs, or specific formulations present only in DDInter).
- **Unmapped MecDDI Drugs:** 29 drugs (specific agents present only in MecDDI).

### 4.2 Interaction Pair Alignment

- **DDInter Unique Pairs:** 160,235
- **MecDDI Unique Pairs:** 178,406
- **DDInter Pairs where BOTH Drugs are Mapped:** 157,490 (98.3% of DDInter pairs)
- **Overlapping Pairs (Present in BOTH Datasets):** **119,601 pairs**
- **DDInter-Only Mapped Pairs:** 37,889 pairs
- **MecDDI-Only Pairs:** 58,805 pairs

```text
                  +-----------------------------------+
                  |         MecDDI Pairs              |
                  |          (178,406)                |
                  |   +---------------------------+   |
                  |   |    Core Overlap           |   |
                  |   |    (119,601 pairs)        |   |
+---------------------+    - Severity: Documented |   +---------------------+
| DDInter Pairs       |    - Mechanism: Documented|                         |
| (160,235)           +---------------------------+                         |
|  - 37,889 pairs                                   - 58,805 pairs          |
|    (Severity only)                                  (Mechanism only)      |
+---------------------------------------------------------------------------+
```

---

## 5. Architectural Implications for Database Design

1. **Entity Separation:** Canonical drugs must have a unique synthetic or standardized primary key (`drug_id`), with separate source cross-reference tables (`drug_source_mapping`) tracking DDInter IDs and MecDDI IDs to maintain provenance without conflating IDs.
2. **Unordered Pair Storage:** All pairs must be stored canonically with `drug_a_id < drug_b_id` and a check constraint `drug_a_id < drug_b_id` to strictly prevent duplicate reverse pairs `(B, A)` and self-interactions `(A, A)`.
3. **Multi-Mechanism Normalization:** Because pairs can exhibit multiple mechanism categories (up to 3), mechanism categories must be stored in a normalized junction relation (`ddi_mechanism`), avoiding repeating group columns.
4. **Preservation of Severity and Mechanism:** Clinical severity (from DDInter) and pharmacological mechanism (from MecDDI) must be modeled as separate attributes/relations rather than merged into a single enum.
5. **Absence of Molecular Target Data:** Neither dataset provides enzyme (CYP) or target protein annotations. Our graph schema must model **Drug-to-Drug interaction relationships directly**, attributed with `mechanism_category` and `severity_level`, rather than inventing intermediate protein/target nodes.
