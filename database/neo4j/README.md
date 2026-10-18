# Neo4j Graph Database Setup & Cypher Scripts

This directory contains the Cypher scripts and instructions for configuring the graph layer of the **Patient-Specific Multi-Hop Drug Interaction Risk Discovery** system.

---

## 1. Directory Contents

- **`01_constraints.cypher`**: Defines uniqueness constraints (e.g., `Drug.drug_id`, `Drug.canonical_name`) and indexes for relationship attributes (`severity_level`, `evidence_sources`).
- **`02_import.cypher`**: Idempotent seeding script loading the curated demonstration cohort of 10 drugs and 9 documented interaction edges (with severities and mechanism categories), plus bulk `LOAD CSV` templates.
- **`03_queries.cypher`**: Graph query suite fulfilling the DBMS Level 3 NoSQL rubric criteria, including direct pair lookups, patient medication set screening, 2-hop/3-hop candidate pathway traversals, and complete NoSQL CRUD operations.

---

## 2. Execution Order

When initializing a local Neo4j 5.x instance (via Neo4j Desktop or Docker `neo4j:5-community`):

```bash
# 1. Apply schema constraints and indexes
cypher-shell -u neo4j -p YOUR_PASSWORD -f database/neo4j/01_constraints.cypher

# 2. Seed curated demonstration graph data
cypher-shell -u neo4j -p YOUR_PASSWORD -f database/neo4j/02_import.cypher

# 3. Test queries and multi-hop risk traversals
cypher-shell -u neo4j -p YOUR_PASSWORD -f database/neo4j/03_queries.cypher
```

---

## 3. Graph Model Semantics

- **Nodes:** `:Drug {drug_id, canonical_name, pubchem_cid, drug_type, therapeutic_class}`
- **Relationships:** `[:INTERACTS_WITH {pair_id, severity_level, mechanism_categories, evidence_sources}]`
- **Candidate Pathway Policy:** Multi-hop paths ($A \to B \to C$) returned by Cypher traversals are explicitly classified as **candidate mechanism pathways** (hypotheses for polypharmacy review), NOT confirmed pairwise drug interactions.
