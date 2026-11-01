'use client';

import React, { useState } from 'react';
import SqlCodeViewer from '@/components/ui/SqlCodeViewer';

export default function ArchitecturePage() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'Incoming Request & Cookie Authentication',
      sub: 'Next.js Edge Middleware',
      description: 'Extracts "drug_interaction_session" HttpOnly cookie, verifies HS256 signature using jose, decodes role (DOCTOR or ADMIN), and injects session into request context.',
      code: `// middleware.ts
const token = request.cookies.get('drug_interaction_session')?.value;
const payload = await verifyToken(token); // jose jwtVerify
if (payload.role !== 'DOCTOR' && payload.role !== 'ADMIN') {
    return NextResponse.redirect('/login');
}`,
      file: 'middleware.ts',
    },
    {
      step: 2,
      title: 'Direct Pairwise Screening in PostgreSQL',
      sub: 'Relational ACID Engine (Port 5432)',
      description: 'Executes fn_perform_patient_direct_screening() in PostgreSQL using least-privilege connection role_doctor, joining prescriptions against ddi_pairs with canonical ordering (drug_a_id < drug_b_id).',
      code: `SELECT * FROM fn_perform_patient_direct_screening(
    p_patient_id => 1,
    p_doctor_username => 'dr_sharma',
    p_notes => 'Pre-operative polypharmacy screening'
);`,
      file: 'database/postgres/02_constraints_indexes.sql',
    },
    {
      step: 3,
      title: 'Bounded Multi-Hop Graph Traversal in Neo4j',
      sub: 'Graph Engine (Bolt Port 7687)',
      description: 'Finds candidate bridge mechanisms across the patient\'s active drug list using Cypher shortestPath / variable-length relationship matching [:INTERACTS_WITH*2..3].',
      code: `MATCH (d1:Drug), (d2:Drug)
WHERE d1.canonical_name = 'warfarin' AND d2.canonical_name = 'simvastatin'
MATCH p = shortestPath((d1)-[:INTERACTS_WITH*2..3]-(d2))
RETURN p, nodes(p) AS path_nodes, relationships(p) AS rels;`,
      file: 'database/neo4j/03_queries.cypher',
    },
    {
      step: 4,
      title: 'Transactional Persistence & Trigger Materialization',
      sub: 'PostgreSQL risk_assessments & Triggers',
      description: 'Inserts assessment findings rows. Trigger trg_assessment_findings_count fires AFTER INSERT, automatically incrementing parent summary counters.',
      code: `INSERT INTO assessment_findings (assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path, finding_type)
VALUES (101, 1, 4, 2, 'warfarin -> amiodarone -> simvastatin', 'CANDIDATE_PATHWAY');
-- Fires trg_assessment_findings_count -> fn_update_assessment_counts()`,
      file: 'database/postgres/02_constraints_indexes.sql',
    },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        }}
      >
        <span className="badge badge-doctor" style={{ marginBottom: 8, display: 'inline-block' }}>
          SYSTEM BLUEPRINT &amp; REPO TRACE
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
          Dual-Database Architecture &amp; Request Lifecycle
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: 4 }}>
          How raw biomedical sources (DDInter &amp; MecDDI) flow through PostgreSQL relational storage and Neo4j graph traversal to power real-time risk discovery.
        </p>
      </div>

      {/* Pipeline Diagram */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
          End-to-End Data Pipeline Architecture
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            {
              stage: '1. Ingestion & Harmonization',
              detail: 'Raw CSVs (DDInter, MecDDI)',
              repoPath: 'scripts/preprocessing/',
              accent: '#38bdf8',
            },
            {
              stage: '2. Relational Core (PostgreSQL)',
              detail: '10 Tables, Constraints, Stored Proc, Triggers',
              repoPath: 'database/postgres/',
              accent: '#818cf8',
            },
            {
              stage: '3. Graph Storage (Neo4j)',
              detail: ':Drug Nodes & :INTERACTS_WITH Edges',
              repoPath: 'database/neo4j/',
              accent: '#06b6d4',
            },
            {
              stage: '4. Next.js Route Handlers',
              detail: 'Two-Tier RBAC, JWT, Dual Orchestrator',
              repoPath: 'app/api/',
              accent: '#10b981',
            },
          ].map((col, idx) => (
            <div
              key={idx}
              style={{
                padding: 16,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: `3px solid ${col.accent}`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{col.stage}</div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 6 }}>{col.detail}</div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: col.accent, marginTop: 10 }}>
                {col.repoPath}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Request Trace Stepper */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Animated Request Trace: <code>POST /api/patients/:id/analyze-risk</code>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 2 }}>
              Step through the exact server execution sequence across authentication, PostgreSQL, and Neo4j.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`btn btn-sm ${activeStep === s.step ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: 34, height: 34, padding: 0, fontWeight: 700 }}
              >
                {s.step}
              </button>
            ))}
          </div>
        </div>

        {steps.map((s) => {
          if (s.step !== activeStep) return null;
          return (
            <div
              key={s.step}
              style={{
                padding: 20,
                borderRadius: 10,
                background: '#0a0f1d',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-doctor" style={{ marginBottom: 4 }}>{s.sub}</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                    Step {s.step}: {s.title}
                  </h4>
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8' }}>
                  Source: {s.file}
                </span>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '12px 0', lineHeight: 1.5 }}>
                {s.description}
              </p>

              <SqlCodeViewer title={`Code Excerpt: ${s.file}`} code={s.code} language="sql" />
            </div>
          );
        })}
      </div>

      {/* Two-Tier Security Architecture Defense */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
          Examiner Reference: Two-Tier Security Model
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
          Direct justification for the <code>USER_ACCOUNT</code> entity in the ER diagram versus PostgreSQL DCL.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <h4 style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.95rem' }}>
              Tier 1: Application Profile Layer
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 8, lineHeight: 1.5 }}>
              • Entity: <code>public.user_accounts</code> in relational ER model.
              <br />
              • Stores clinician metadata: display full name, medical license ID, clinical department, account active status.
              <br />
              • PostgreSQL engine catalogs cannot hold clinical metadata; modeling it as an ER entity is standard enterprise practice.
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
            }}
          >
            <h4 style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.95rem' }}>
              Tier 2: DBMS Engine DCL Layer
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 8, lineHeight: 1.5 }}>
              • Engine Role: <code>role_doctor</code> / <code>role_admin</code> created via <code>CREATE ROLE</code>.
              <br />
              • Login Users: <code>app_doctor_user</code>, <code>app_admin_user</code> created via <code>CREATE USER</code>.
              <br />
              • Kernel Barrier: <code>REVOKE ALL ON user_accounts FROM role_doctor</code> enforces SQLState <code>42501</code> at the database engine level.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
