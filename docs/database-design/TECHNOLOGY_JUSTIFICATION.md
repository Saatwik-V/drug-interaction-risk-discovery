# Technology Justification & System Architecture

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course:** PES University DBMS Experiential Learning Level 3  
**Authors:** Student Project Team  

---

## 1. Dual-Database Paradigm: PostgreSQL + Neo4j

This project employs a deliberate **polyglot persistence architecture**, pairing a relational database management system (**PostgreSQL**) with a native graph database (**Neo4j**). Each database technology is mapped strictly to the workload for which its data model and query engine are mathematically and architecturally optimal.

```text
+---------------------------------------------------------------------------------+
|                               Next.js Application Layer                         |
|   (Route Handlers, Server-Side Authorization, Input Validation, UI Components)  |
+---------------------------------------------------------------------------------+
                         |                                 |
                         | Relational Queries & ACID       | Cypher Path Traversal
                         v                                 v
+------------------------------------+    +---------------------------------------+
|        PostgreSQL (Relational)     |    |             Neo4j (Graph)             |
|------------------------------------|    |---------------------------------------|
| - Master canonical drug catalog    |    | - High-performance graph traversal   |
| - Strict check & foreign key rules |    | - Index-free adjacency for multi-hop  |
| - Provenance audit source mappings |    | - Candidate pathway path discovery    |
| - Synthetic patients & regimens    |    | - Explaining intermediary drug bridges|
| - Clinical session audit trails    |    | - Cypher pattern matching (1..3 hops) |
+------------------------------------+    +---------------------------------------+
```

---

## 2. Why PostgreSQL for Relational & Transactional State

PostgreSQL was selected as the relational foundation for the following architectural reasons:

1. **Relational Integrity and Invariant Enforcement:**
   - Healthcare and medication regimens require strict integrity guarantees. PostgreSQL enforces foreign key constraints (`ON DELETE CASCADE` / `ON DELETE RESTRICT`), candidate key uniqueness (`UNIQUE`), and domain validity via `CHECK` constraints.
   - For interaction pairs, PostgreSQL enforces canonical ordering through a check constraint:
     $$\text{CHECK} \ (drug\_a\_id < drug\_b\_id)$$
     This mathematically guarantees that self-interactions ($A = A$) and symmetric duplicates ($(A, B)$ and $(B, A)$) cannot exist in the relational store.
2. **ACID Transactions for Patient Regimens:**
   - Updating a patient's active prescriptions, recording clinical screening sessions, and storing granular findings require full atomicity and serializability.
3. **Multi-Source Provenance Normalization:**
   - Mapping external identifiers (`DDInterID`, `MecDDI_ID`) to canonical drug entities while isolating clinical severities from mechanism categories is modeled in BCNF and 4NF.
4. **Rich Analytical SQL Capabilities:**
   - PostgreSQL provides advanced procedural functions (PL/pgSQL), triggers for automated metric updates, window functions (`ROW_NUMBER()`, `DENSE_RANK()`), and recursive Common Table Expressions (CTEs).

---

## 3. Why Neo4j for Graph Traversal & Pathway Discovery

While PostgreSQL is superior for transactional integrity, relational databases encounter severe performance and conceptual degradation when querying graph networks of arbitrary depth:

1. **The Multi-Hop Polypharmacy Problem:**
   - In polypharmacy, adverse interactions often occur indirectly across shared metabolic pathways or competitive substrate binding ($A \leftrightarrow C \leftrightarrow B$).
   - Evaluating indirect risk across a regimen of $N$ drugs requires bounded path traversal (1-hop, 2-hop, 3-hop).
2. **Index-Free Adjacency vs. Recursive Joins:**
   - In relational SQL, evaluating a 3-hop path requires a recursive CTE or a 3-way self-join on a table containing 178,000+ interaction rows. Each join involves repeated B-Tree index lookups: $O(k \log M)$.
   - Neo4j utilizes **index-free adjacency**, where each node directly points to its adjacent relationship records in memory via double-linked pointer chains. Traversing an edge is an $O(1)$ pointer dereference.
3. **Declarative Expressiveness of Cypher:**
   - A complex multi-hop path search with variable length, node exclusions, and edge property filtering requires 20+ lines of complex SQL with array checks. In Cypher, it is expressed concisely:
     ```cypher
     MATCH path = (d1:Drug)-[:INTERACTS_WITH*1..3]-(d2:Drug)
     WHERE d1.drug_id IN $patientMeds AND d2.drug_id IN $patientMeds AND d1 <> d2
     RETURN path, length(path) AS hops;
     ```

---

## 4. Assessment of Vector Databases vs. Graph NoSQL

The official DBMS Level 3 rubric states under Category 4:
> *"NoSQL/vector database creation (4 marks) ... NoSQL/vector features and CRUD (7 marks)"*

### Architectural Justification: Why Neo4j Fulfills the Rubric
- **Domain Fit:** The core problem is **multi-hop network path discovery and relationship explanation**. This is fundamentally a graph topology problem (nodes, edges, paths, degrees, subgraphs).
- **Vector Database Incongruity:** Vector databases (e.g., Pinecone, Milvus, Qdrant, pgvector) are designed for approximate nearest neighbor (ANN) search over high-dimensional dense embeddings (e.g., text semantic search, image feature matching).
  - An interaction between Warfarin and Amiodarone is not an "approximate nearest neighbor" similarity; it is an **explicit, documented biomedical relationship**.
  - Vector similarity cannot traverse graph paths ($A \to B \to C$) or return traceable causal explanation chains with hop counts and mechanism labels.
  - Introducing a vector database into this specific core pipeline without a text embedding task would be gratuitous architectural padding.

### Rubric Verification Note
Because the rubric combines NoSQL and vector databases under the same evaluation line items (*"NoSQL/vector database creation"*), Neo4j fully satisfies the NoSQL graph requirement. If the course instructors require a vector-specific demonstration in later phases, an optional biomedical text embedding search (e.g., embedding therapeutic indication descriptions using pgvector or a local vector store) can be added cleanly as an auxiliary feature without distorting the primary graph architecture.

---

## 5. Web Application & API Integration (Next.js)

1. **Next.js App Router (TypeScript):**
   - Unified full-stack framework collocating frontend presentation with server-side API Route Handlers.
   - Eliminates redundant multi-repository structures (`frontend/` + `backend/`).
2. **Server-Side API Layer:**
   - Enforces strict role-based access control (Doctor vs. Admin).
   - Validates user input before executing SQL queries or Cypher statements.
   - Coordinates dual-database calls: queries PostgreSQL for patient medications, calls Neo4j for path traversal, and persists discovered findings back into PostgreSQL audit tables.
