# Neo4j Graph Schema Specification

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Graph Engine:** Neo4j (Cypher Query Language)  
**Database Role:** High-performance relationship traversal, multi-hop path discovery, and mechanism-based polypharmacy risk explanation.

---

## 1. Graph Model Justification

While PostgreSQL manages relational integrity, ACID transactions, patient demographics, prescriptions, and audit logs, graph databases excel at **arbitrary-depth relationship traversal**. In polypharmacy analysis, evaluating interactions across a regimen of $N$ medications requires searching not only for direct edges ($A \leftrightarrow B$), but also transitive multi-hop candidate pathways ($A \leftrightarrow C \leftrightarrow B$) where shared metabolic or pharmacodynamic pathways could induce synergistic toxicity.

Executing multi-hop traversals in relational SQL requires recursive Common Table Expressions (CTEs) or multiple expensive self-joins on `ddi_pairs`. In contrast, Neo4j treats relationships as first-class physical entities with index-free adjacency, delivering bounded traversal speeds orders of magnitude faster as path depth increases.

---

## 2. Graph Schema Specification

### 2.1 Node Labels

#### Label: `:Drug`
Represents a canonical non-proprietary drug entity.
- **Properties:**
  - `drug_id` (`INTEGER`, **UNIQUE**, **NOT NULL**): Matches `drugs.drug_id` in PostgreSQL.
  - `canonical_name` (`STRING`, **INDEXED**): Standardized drug name (e.g., `warfarin`, `aspirin`).
  - `pubchem_cid` (`STRING`): External chemical cross-reference ID.
  - `drug_type` (`STRING`): E.g., `Small molecule`, `Biotech`.
  - `therapeutic_class` (`STRING`): High-level indication.

---

### 2.2 Relationship Types

#### Type: `[:INTERACTS_WITH]`
Represents a documented pairwise interaction between two canonical drugs.

- **Directionality:** In biomedical reality, drug interaction is an undirected symmetric phenomenon. In Neo4j, relationships must be stored with a direction, but queries traverse them **undirected** using `(d1:Drug)-[:INTERACTS_WITH]-(d2:Drug)`.
- **Properties:**
  - `pair_id` (`INTEGER`): Foreign key linking back to `ddi_pairs.pair_id` in PostgreSQL.
  - `severity_level` (`STRING`): Documented DDInter severity rating (`Major`, `Moderate`, `Minor`, `Unknown`), or `null` if sourced only from MecDDI.
  - `mechanism_categories` (`LIST OF STRINGS`): List of up to 3 mechanism categories from MecDDI (e.g., `['Affected intra_extra-hepatic metabolism', 'Pharmacodynamic additive effects']`).
  - `evidence_sources` (`STRING`): Provenance string (`DDInter`, `MecDDI`, or `DDInter+MecDDI`).
  - `atc_codes` (`STRING`): ATC classification codes from DDInter (if applicable).

```text
 (:Drug {canonical_name: "Warfarin"})
      |
      |  [:INTERACTS_WITH {
      |      pair_id: 10421,
      |      severity_level: "Major",
      |      mechanism_categories: ["Pharmacodynamic additive effects"],
      |      evidence_sources: "DDInter+MecDDI"
      |  }]
      v
 (:Drug {canonical_name: "Aspirin"})
```

---

## 3. Modeling Decision: Relationship Properties vs. Separate Category Nodes

We evaluated whether to model MecDDI mechanism categories as:
- **Option A (Chosen): Relationship Properties on `[:INTERACTS_WITH]`**
  - Mechanisms are modeled as an array property `mechanism_categories` on each `[:INTERACTS_WITH]` edge.
  - *Rationale:* Multi-hop path queries seek paths *between drugs* ($D_1 \to D_2 \to D_3$). Storing mechanisms on the edge keeps the traversal path strictly between `:Drug` nodes, preventing graph bloat and avoiding unnecessary intermediary hops through category nodes.
- **Option B (Alternative): Dedicated `:MechanismCategory` Nodes**
  - Would model `(:Drug)-[:HAS_MECHANISM]->(:MechanismCategory)`.
  - *Limitation:* The source data does *not* link specific drugs to individual enzymes or biological targets—it only documents that the *pair* exhibits that mechanism category. Connecting individual drugs to a general category node would create dense "supernodes" (e.g., `Pharmacodynamic additive effects` connected to 1,600+ drugs), severely degrading traversal performance without providing mechanistic specificity.

---

## 4. Multi-Hop Risk Traversal Semantics

### Direct vs. Candidate Pathway Distinction

1. **1-Hop (Direct Documented Interaction):**
   - Pattern: `MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug) WHERE ...`
   - Clinical Interpretation: Documented pairwise interaction reported in literature and curated biomedical databases.
2. **2-Hop (Candidate Shared-Partner Pathway):**
   - Pattern: `MATCH path = (d1:Drug)-[:INTERACTS_WITH]-(inter:Drug)-[:INTERACTS_WITH]-(d2:Drug) WHERE ...`
   - Clinical Interpretation: Drugs $D_1$ and $D_2$ share a common interaction partner $D_{\text{inter}}$ (e.g., a shared competitive substrate or common pathway). **This is an explanatory candidate pathway hypothesis**, NOT proven clinical co-toxicity.
3. **3-Hop (Bounded Extended Candidate Pathway):**
   - Pattern: `MATCH path = (d1:Drug)-[:INTERACTS_WITH*3]-(d2:Drug) WHERE ...`
   - Clinical Interpretation: Exploratory network cascade identifying distal pharmacological connectivity. Bounded to a maximum radius of 3 to prevent combinatorial explosion.
