'use client';

import React, { useState, useEffect, useRef } from 'react';
import SqlCodeViewer from '@/components/ui/SqlCodeViewer';
import VerifyOnDisk from '@/components/ui/VerifyOnDisk';
import InteractionGraphViewer from '@/components/graph/InteractionGraphViewer';
import { useToast } from '@/components/ui/Toast';

function generateDemoUsername(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `dr_kapoor_${suffix}`;
}

function severityBadgeClassForGraph(severity: string | undefined): string {
  const s = severity?.toLowerCase();
  if (s === 'major' || s === 'critical') return 'badge-major';
  if (s === 'moderate') return 'badge-moderate';
  if (s === 'minor') return 'badge-minor';
  return 'badge-unknown';
}

export default function DbmsStudioPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'constraints' | 'triggers' | 'procedures' | 'queries' | 'ddl' | 'roles' | 'graph'
  >('constraints');

  // Tab 1: Constraints Lab State
  const [referencedDrugs, setReferencedDrugs] = useState<any[]>([]);
  const [restrictDrugId, setRestrictDrugId] = useState<number>(1);
  const [restrictResult, setRestrictResult] = useState<any | null>(null);
  const [restrictLoading, setRestrictLoading] = useState(false);

  // Cascade Demo State
  const [ephemeralPatient, setEphemeralPatient] = useState<any | null>(null);
  const [cascadeCounts, setCascadeCounts] = useState<any | null>(null);
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<any | null>(null);
  const ephemeralPatientRef = useRef<any | null>(null);
  useEffect(() => {
    ephemeralPatientRef.current = ephemeralPatient;
  }, [ephemeralPatient]);

  // Best-effort self-clean: if the examiner navigates away or closes the tab
  // while an ephemeral sandbox patient is still pending deletion, sweep it on
  // the way out so the next session always starts clean.
  useEffect(() => {
    const sweepOnExit = () => {
      if (ephemeralPatientRef.current) {
        fetch('/api/dbms/constraints/test-cascade', { method: 'DELETE', keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', sweepOnExit);
    return () => {
      sweepOnExit();
      window.removeEventListener('beforeunload', sweepOnExit);
    };
  }, []);

  // Check Constraint State
  const [checkResult, setCheckResult] = useState<any | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  // Tab 2: Triggers State
  const [triggerHeader, setTriggerHeader] = useState<any | null>(null);
  const [triggerResult, setTriggerResult] = useState<any | null>(null);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Tab 3: Stored Procedures State
  const [procedurePatientName, setProcedurePatientName] = useState<string>('Robert Vance');
  const [procedureDoctor, setProcedureDoctor] = useState('dr_sharma');
  const [procedureNotes, setProcedureNotes] = useState('Evaluation studio direct screening test');
  const [procedureResult, setProcedureResult] = useState<any | null>(null);
  const [procedureLoading, setProcedureLoading] = useState(false);

  // Tab 4: Advanced SQL Queries State
  const [queriesList, setQueriesList] = useState<any[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<number>(1);
  const [queryExecutionResult, setQueryExecutionResult] = useState<any | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Tab 5: DDL Schema Studio State
  const [tableList, setTableList] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('patients');
  const [tableSchemaData, setTableSchemaData] = useState<any | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Tab 6: DCL, Roles & RBAC State
  const [engineRoles, setEngineRoles] = useState<any[]>([]);
  const [appProfiles, setAppProfiles] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState(generateDemoUsername);
  const [newFullName, setNewFullName] = useState('Dr. Anita Kapoor, MD');
  const [newPassword, setNewPassword] = useState('DoctorPass#2026');
  const [newRole, setNewRole] = useState<'DOCTOR' | 'ADMIN'>('DOCTOR');
  const [dclResult, setDclResult] = useState<any | null>(null);
  const [dclLoading, setDclLoading] = useState(false);
  const [rbacTestResult, setRbacTestResult] = useState<any | null>(null);
  const [rbacLoading, setRbacLoading] = useState(false);

  // Tab 7: NoSQL Graph RUD State
  const [allDrugs, setAllDrugs] = useState<any[]>([]);
  const [starNetworkDrug, setStarNetworkDrug] = useState('warfarin');
  const [starNetwork, setStarNetwork] = useState<any | null>(null);
  const [starNetworkLoading, setStarNetworkLoading] = useState(false);
  // Deliberately NOT a real seeded pair (e.g. warfarin/aspirin, pair_id 1001)
  // — this form's Delete button runs for real against Neo4j, and defaulting
  // to a documented demo edge meant an examiner (or anyone) clicking through
  // the form without changing the dropdowns would destroy real seed data.
  // metoprolol/ibuprofen has no existing edge, so Create/Update/Delete here
  // is always a self-contained sandbox action.
  const [edgeDrugA, setEdgeDrugA] = useState('metoprolol');
  const [edgeDrugB, setEdgeDrugB] = useState('ibuprofen');
  const [edgeSeverity, setEdgeSeverity] = useState('Moderate');
  const [edgeMechanism, setEdgeMechanism] = useState('Test interaction (DBMS Studio demo)');
  const [graphMutationResult, setGraphMutationResult] = useState<any | null>(null);
  const [graphMutationLoading, setGraphMutationLoading] = useState(false);
  const [graphOverview, setGraphOverview] = useState<any | null>(null);
  const [graphOverviewLoading, setGraphOverviewLoading] = useState(false);
  const [showFullGraph, setShowFullGraph] = useState(false);

  // Initial Load for Active Tab
  useEffect(() => {
    if (activeTab === 'constraints') {
      fetch('/api/dbms/constraints/test-restrict')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.referencedDrugs) {
            setReferencedDrugs(d.referencedDrugs);
            if (d.referencedDrugs.length > 0) {
              setRestrictDrugId(d.referencedDrugs[0].drug_id);
            }
          }
        });

      // Self-heal: sweep any ephemeral sandbox patients left behind by a
      // previous demo session (crash, forgotten cleanup click, etc.) so the
      // Constraints Lab always opens in a pristine, reproducible state.
      setEphemeralPatient(null);
      setCascadeResult(null);
      fetch('/api/dbms/constraints/test-cascade')
        .then((r) => r.json())
        .then((listData) => {
          if (listData.success && listData.ephemeralPatients?.length > 0) {
            return fetch('/api/dbms/constraints/test-cascade', { method: 'DELETE' })
              .then((r) => r.json())
              .then((sweepData) => {
                if (sweepData.success && sweepData.sweptCount > 0) {
                  addToast({
                    type: 'info',
                    title: 'Sandbox Auto-Cleaned',
                    message: sweepData.summary,
                  });
                }
                setCascadeCounts({ patients: 0, prescriptions: 0, risk_assessments: 0, assessment_findings: 0 });
              });
          }
          setCascadeCounts({ patients: 0, prescriptions: 0, risk_assessments: 0, assessment_findings: 0 });
        });
    } else if (activeTab === 'triggers') {
      // Always start the Triggers tab from a fresh, isolated demo session
      // (counters at 0/0) so no manual DB reseed is ever required between runs.
      setTriggerResult(null);
      fetch('/api/dbms/triggers/demo?reset=true')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setTriggerHeader(d.assessment);
        });
    } else if (activeTab === 'queries') {
      fetch('/api/dbms/queries/execute')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setQueriesList(d.queries);
        });
    } else if (activeTab === 'ddl') {
      fetch('/api/dbms/schema?action=list_tables')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setTableList(d.tables);
        });
    } else if (activeTab === 'roles') {
      loadRolesData();
    } else if (activeTab === 'graph') {
      if (allDrugs.length === 0) {
        fetch('/api/prescriptions')
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setAllDrugs(d.data);
          });
      }
      loadStarNetwork(starNetworkDrug);
      loadGraphOverview();
    }
  }, [activeTab]);

  // Load Table DDL
  useEffect(() => {
    if (activeTab === 'ddl' && selectedTable) {
      setSchemaLoading(true);
      fetch(`/api/dbms/schema?table=${selectedTable}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setTableSchemaData(d);
        })
        .finally(() => setSchemaLoading(false));
    }
  }, [activeTab, selectedTable]);

  const loadGraphOverview = async () => {
    setGraphOverviewLoading(true);
    try {
      const res = await fetch('/api/neo4j/graph-rud?action=overview');
      const data = await res.json();
      if (data.success) setGraphOverview(data.overview);
    } finally {
      setGraphOverviewLoading(false);
    }
  };

  const loadStarNetwork = async (drugName: string) => {
    setStarNetworkLoading(true);
    try {
      const res = await fetch(`/api/neo4j/graph-rud?drug=${encodeURIComponent(drugName)}`);
      const data = await res.json();
      setStarNetwork(data.success ? data.starNetwork : null);
    } finally {
      setStarNetworkLoading(false);
    }
  };

  const handleCreateGraphEdge = async () => {
    setGraphMutationLoading(true);
    setGraphMutationResult(null);
    try {
      const res = await fetch('/api/neo4j/graph-rud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugA: edgeDrugA, drugB: edgeDrugB, severity: edgeSeverity, mechanism: edgeMechanism }),
      });
      const data = await res.json();
      setGraphMutationResult({ op: 'CREATE', ...data });
      if (data.success) {
        addToast({ type: 'success', title: 'Neo4j Edge Created (MERGE)', message: data.message });
        loadStarNetwork(starNetworkDrug);
      }
    } finally {
      setGraphMutationLoading(false);
    }
  };

  const handleUpdateGraphEdge = async () => {
    setGraphMutationLoading(true);
    setGraphMutationResult(null);
    try {
      const res = await fetch('/api/neo4j/graph-rud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugA: edgeDrugA, drugB: edgeDrugB, severity: edgeSeverity, mechanism: edgeMechanism }),
      });
      const data = await res.json();
      setGraphMutationResult({ op: 'UPDATE', ...data });
      if (data.success) {
        addToast({ type: 'success', title: 'Neo4j Edge Updated (SET)', message: data.message });
        loadStarNetwork(starNetworkDrug);
      }
    } finally {
      setGraphMutationLoading(false);
    }
  };

  const handleDeleteGraphEdge = async () => {
    setGraphMutationLoading(true);
    setGraphMutationResult(null);
    try {
      const res = await fetch(
        `/api/neo4j/graph-rud?drug_a=${encodeURIComponent(edgeDrugA)}&drug_b=${encodeURIComponent(edgeDrugB)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      setGraphMutationResult({ op: 'DELETE', ...data });
      if (data.success) {
        addToast({ type: 'info', title: 'Neo4j Edge Deleted', message: data.message });
        loadStarNetwork(starNetworkDrug);
      }
    } finally {
      setGraphMutationLoading(false);
    }
  };

  const loadRolesData = () => {
    fetch('/api/dbms/roles')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEngineRoles(d.tier2PostgresEngineRoles);
          setAppProfiles(d.tier1ApplicationProfiles);
        }
      });
  };

  // Actions
  const handleTestRestrict = async () => {
    setRestrictLoading(true);
    setRestrictResult(null);
    try {
      const res = await fetch(`/api/dbms/constraints/test-restrict?drug_id=${restrictDrugId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setRestrictResult(data);
      addToast({
        type: 'error',
        title: 'ON DELETE RESTRICT Enforced',
        message: data.demonstrationSummary,
        sqlCode: data.errorCode,
      });
    } finally {
      setRestrictLoading(false);
    }
  };

  const handleSpawnCascadePatient = async () => {
    setCascadeLoading(true);
    try {
      const res = await fetch('/api/dbms/constraints/test-cascade', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEphemeralPatient({
          id: data.patientId,
          mrn: data.mrn,
          fullName: data.fullName || `Test-Cascade-Patient-${data.patientId}`,
        });
        setCascadeCounts(data.counts);
        addToast({
          type: 'success',
          title: 'Spawned Ephemeral Patient',
          message: `Created patient "${data.fullName}" with 2 prescriptions, 1 assessment, 2 findings.`,
        });
      }
    } finally {
      setCascadeLoading(false);
    }
  };

  const handleDeleteCascadePatient = async () => {
    if (!ephemeralPatient) return;
    setCascadeLoading(true);
    try {
      // Execute deletion using full_name parameter directly from patients table
      const res = await fetch(
        `/api/dbms/constraints/test-cascade?full_name=${encodeURIComponent(ephemeralPatient.fullName)}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      setCascadeResult(data);
      setCascadeCounts(data.afterCounts);
      setEphemeralPatient(null);
      addToast({
        type: 'success',
        title: 'ON DELETE CASCADE Executed',
        message: data.summary,
      });
    } finally {
      setCascadeLoading(false);
    }
  };

  const handleTestCheck = async (testType: 'PATIENT_SYNTHETIC' | 'HOP_DEPTH' | 'PAIR_ORDER') => {
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await fetch('/api/dbms/constraints/test-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType }),
      });
      const data = await res.json();
      setCheckResult(data);
      addToast({
        type: 'error',
        title: 'CHECK Constraint Enforced',
        message: data.demonstrationSummary,
        sqlCode: data.errorCode,
      });
    } finally {
      setCheckLoading(false);
    }
  };

  const handleInsertFindingTrigger = async (findingType: 'DOCUMENTED_DIRECT' | 'CANDIDATE_PATHWAY') => {
    if (!triggerHeader) return;
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/dbms/triggers/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: triggerHeader.assessment_id,
          findingType,
        }),
      });
      const data = await res.json();
      setTriggerResult(data);
      if (data.success) {
        setTriggerHeader((prev: any) => ({
          ...prev,
          direct_interaction_count: data.afterCounts.direct,
          multi_hop_candidate_count: data.afterCounts.multiHop,
        }));
        addToast({
          type: 'success',
          title: `Trigger Fired: ${data.triggerFired}`,
          message: data.summary,
        });
      }
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleResetTriggerDemo = async () => {
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/dbms/triggers/demo', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTriggerHeader(data.assessment);
        addToast({
          type: 'info',
          title: 'Demo Session Reset',
          message: 'Sandbox assessment purged and recreated with counters at 0/0 — fully reproducible for the next run.',
        });
      }
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleExecuteProcedure = async () => {
    setProcedureLoading(true);
    setProcedureResult(null);
    try {
      const res = await fetch('/api/dbms/procedures/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: procedurePatientName.trim(),
          doctorUsername: procedureDoctor,
          notes: procedureNotes,
        }),
      });
      const data = await res.json();
      setProcedureResult(data);
      if (data.success) {
        addToast({
          type: 'success',
          title: 'PL/pgSQL Procedure Executed',
          message: `Returned ${data.rowsReturned} rows for "${data.patientName}" in ${data.executionMs}ms.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Procedure Execution Failed',
          message: data.error || 'The stored function raised an error.',
        });
      }
    } finally {
      setProcedureLoading(false);
    }
  };

  const handleExecuteQuery = async (queryId: number) => {
    setQueryLoading(true);
    setQueryExecutionResult(null);
    try {
      const res = await fetch('/api/dbms/queries/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });
      const data = await res.json();
      setQueryExecutionResult(data);
      addToast({
        type: 'info',
        title: `Executed: ${data.title}`,
        message: `Returned ${data.rowsReturned} rows in ${data.executionMs}ms.`,
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCreateUserDcl = async (e: React.FormEvent) => {
    e.preventDefault();
    setDclLoading(true);
    setDclResult(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          fullName: newFullName,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      setDclResult(data);
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Two-Tier User Created',
          message: data.message,
        });
        loadRolesData();
        // Regenerate a fresh default username so the form can be re-submitted
        // immediately without a collision — no manual cleanup required.
        setNewUsername(generateDemoUsername());
      } else {
        addToast({
          type: 'error',
          title: 'User Creation Error',
          message: data.error,
        });
      }
    } finally {
      setDclLoading(false);
    }
  };

  const handleDeleteDemoUser = async (username: string) => {
    setDclLoading(true);
    try {
      const res = await fetch(`/api/admin/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Demo Account Self-Cleaned',
          message: data.message,
        });
        setDclResult(null);
        loadRolesData();
      } else {
        addToast({ type: 'error', title: 'Cleanup Failed', message: data.error });
      }
    } finally {
      setDclLoading(false);
    }
  };

  const handleTestRbacBarrier = async () => {
    setRbacLoading(true);
    setRbacTestResult(null);
    try {
      const res = await fetch('/api/dbms/roles', { method: 'POST' });
      const data = await res.json();
      setRbacTestResult(data);
      addToast({
        type: 'success',
        title: 'PostgreSQL RBAC Enforced',
        message: data.demonstrationSummary,
        sqlCode: data.errorCode,
      });
    } finally {
      setRbacLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Banner */}
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(124, 108, 245, 0.18)',
                  color: '#a79af7',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.02em',
                }}
              >
                PES University · DBMS Level 3 · 50 marks
              </span>
              <span className="status-dot">
                <span className="status-dot-indicator healthy pulse" />
                100% live database ground truth
              </span>
            </div>
            <h1 className="hero-title" style={{ marginTop: 10 }}>
              DBMS Operations &amp; Evaluation Studio
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6, maxWidth: 560 }}>
              Every evaluated relational and graph-database capability, triggerable live from this interface —
              the same actions are also reachable from the regular clinical screens, not just here.
            </p>
          </div>
          <div
            style={{
              textAlign: 'right',
              padding: '12px 18px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PostgreSQL port / Neo4j Bolt</div>
            <div style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: '#2dd4e8', fontWeight: 600 }}>
              localhost:5432 / :7687
            </div>
          </div>
        </div>
      </div>

      {/* 6 Rubric Modules Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          marginBottom: 24,
        }}
      >
        {[
          { key: 'constraints', label: '1. Constraints Lab', badge: 'RESTRICT / CASCADE' },
          { key: 'triggers', label: '2. Triggers & Audits', badge: 'BEFORE / AFTER' },
          { key: 'procedures', label: '3. Procedures & Functions', badge: 'PL/pgSQL' },
          { key: 'queries', label: '4. Advanced SQL & CTEs', badge: '7 Rubric Queries' },
          { key: 'ddl', label: '5. DDL & Schema Studio', badge: 'Show Create Table' },
          { key: 'roles', label: '6. DCL & Roles (CREATE USER)', badge: 'Two-Tier RBAC' },
          { key: 'graph', label: '7. NoSQL Graph RUD', badge: 'Neo4j CRUD' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: isActive ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? 'rgba(99, 102, 241, 0.16)' : 'rgba(15, 23, 42, 0.6)',
                color: isActive ? '#f8fafc' : '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{tab.label}</div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: isActive ? '#a5b4fc' : '#64748b',
                  marginTop: 4,
                }}
              >
                {tab.badge}
              </div>
            </button>
          );
        })}
      </div>

      {/* ====================================================================== */}
      {/* MODULE 1: CONSTRAINTS LAB */}
      {/* ====================================================================== */}
      {activeTab === 'constraints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section A: ON DELETE RESTRICT */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-major" style={{ marginBottom: 8, display: 'inline-block' }}>
                  RUBRIC DEMO: FOREIGN KEY RESTRICT
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                  A. Live Demonstration of ON DELETE RESTRICT
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
                  PostgreSQL integrity rules reject deleting a canonical drug record referenced by active patient prescriptions.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                  Referenced Master Drug in Prescriptions:
                </label>
                <select
                  className="input-field"
                  value={restrictDrugId}
                  onChange={(e) => setRestrictDrugId(Number(e.target.value))}
                >
                  {referencedDrugs.map((d) => (
                    <option key={d.drug_id} value={d.drug_id}>
                      Drug #{d.drug_id}: {d.canonical_name} ({d.active_prescriptions} active prescriptions)
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={handleTestRestrict}
                    disabled={restrictLoading}
                    className="btn"
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontWeight: 600,
                      width: '100%',
                    }}
                  >
                    {restrictLoading ? 'Executing DELETE on PostgreSQL...' : 'Attempt Deletion of Referenced Drug (RESTRICT)'}
                  </button>
                </div>

                <div style={{ marginTop: 16 }}>
                  <SqlCodeViewer
                    title="Engine SQL Action Executed"
                    code={`DELETE FROM drugs WHERE drug_id = ${restrictDrugId};`}
                    language="sql"
                  />
                </div>
              </div>

              <div>
                {restrictResult ? (
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 10,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 700 }}>
                      <span>🛡️ PostgreSQL Engine Rejection: ON DELETE RESTRICT Enforced</span>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
                      <div>
                        <strong style={{ color: '#f8fafc' }}>SQLState Code:</strong>{' '}
                        <span style={{ fontFamily: 'monospace', color: '#fca5a5' }}>
                          {restrictResult.errorCode} (foreign_key_violation)
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: '#f8fafc' }}>Foreign Key Constraint:</strong>{' '}
                        <span style={{ fontFamily: 'monospace', color: '#fca5a5' }}>
                          {restrictResult.constraint}
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: '#f8fafc' }}>Engine Detail:</strong>{' '}
                        <span style={{ color: '#cbd5e1' }}>{restrictResult.errorDetail}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#f8fafc' }}>Latency:</strong>{' '}
                        <span style={{ color: '#38bdf8' }}>⚡ {restrictResult.executionMs}ms</span>
                      </div>
                    </div>
                    <VerifyOnDisk
                      query={`SELECT drug_id, canonical_name FROM drugs WHERE drug_id = ${restrictDrugId};`}
                      expected={`Row still present — the DELETE was rejected, so drug_id ${restrictDrugId} was never removed.`}
                      onReRead={async () => {
                        const res = await fetch('/api/dbms/constraints/test-restrict');
                        const data = await res.json();
                        const row = data.referencedDrugs?.find((d: any) => d.drug_id === restrictDrugId);
                        return row
                          ? `Row intact: drug_id=${row.drug_id}, canonical_name=${row.canonical_name}`
                          : 'Row not found in the referenced-drugs list (unexpected).';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: '100%',
                      minHeight: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      color: '#64748b',
                      fontSize: '0.85rem',
                    }}
                  >
                    Click the red button to trigger the RESTRICT violation against PostgreSQL
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section B: ON DELETE CASCADE */}
          <div className="card">
            <span className="badge badge-doctor" style={{ marginBottom: 8, display: 'inline-block' }}>
              RUBRIC DEMO: MULTI-TABLE CASCADE
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              B. Live Demonstration of ON DELETE CASCADE Across 4 Relational Tables
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
              Demonstrates automatic cascading deletion using <code>full_name</code> from <code>patients</code> &rarr; <code>prescriptions</code> &rarr; <code>risk_assessments</code> &rarr; <code>assessment_findings</code>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18 }}>
              <div>
                {!ephemeralPatient ? (
                  <button
                    onClick={handleSpawnCascadePatient}
                    disabled={cascadeLoading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {cascadeLoading ? 'Creating Sandbox Records...' : '1. Spawn Ephemeral Test Patient with Child Records'}
                  </button>
                ) : (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>
                      Ephemeral Test Patient Ready:{' '}
                      <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        &quot;{ephemeralPatient.fullName}&quot;
                      </span>{' '}
                      (ID: #{ephemeralPatient.id}, MRN: {ephemeralPatient.mrn})
                    </div>
                    <button
                      onClick={handleDeleteCascadePatient}
                      disabled={cascadeLoading}
                      className="btn"
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 600,
                        width: '100%',
                        marginTop: 12,
                      }}
                    >
                      {cascadeLoading
                        ? 'Cascading Deletion...'
                        : `2. Delete Patient by full_name: "${ephemeralPatient.fullName}"`}
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <SqlCodeViewer
                    title="Executed DML & Cascading Relational Constraints"
                    code={`-- 1. Targeted deletion executed using full_name on parent table:
DELETE FROM patients WHERE full_name = '${ephemeralPatient ? ephemeralPatient.fullName : 'Test-Cascade-Patient-XXXX'}';

-- 2. Foreign keys automatically cascade to 3 dependent child tables:
ALTER TABLE prescriptions ADD CONSTRAINT fk_prescription_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;
ALTER TABLE risk_assessments ADD CONSTRAINT fk_assessment_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;
ALTER TABLE assessment_findings ADD CONSTRAINT fk_finding_assessment 
    FOREIGN KEY (assessment_id) REFERENCES risk_assessments(assessment_id) ON DELETE CASCADE;`}
                    language="sql"
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
                    Live Row Counts in Relational Hierarchy:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                      { label: 'patients', count: cascadeCounts?.patients ?? 0 },
                      { label: 'prescriptions', count: cascadeCounts?.prescriptions ?? 0 },
                      { label: 'risk_assessments', count: cascadeCounts?.risk_assessments ?? 0 },
                      { label: 'assessment_findings', count: cascadeCounts?.assessment_findings ?? 0 },
                    ].map((c) => (
                      <div
                        key={c.label}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.count > 0 ? '#38bdf8' : '#10b981' }}>
                          {c.count}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>
                          {c.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {cascadeResult && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        fontSize: '0.8rem',
                      }}
                    >
                      ✨ {cascadeResult.summary} (Executed in {cascadeResult.executionMs}ms)
                    </div>
                  )}

                  {cascadeResult && (
                    <VerifyOnDisk
                      query={`-- 1. Verify parent deleted by full_name:\nSELECT count(*) FROM patients WHERE full_name = '${cascadeResult.fullName}';\n-- 2. Verify cascading deletion across child tables:\nSELECT count(*) FROM prescriptions WHERE patient_id = ${cascadeResult.patientId};\nSELECT count(*) FROM risk_assessments WHERE patient_id = ${cascadeResult.patientId};`}
                      expected={`All child row counts return 0 — patient '${cascadeResult.fullName}' and its 3 dependent tables were purged atomically.`}
                      onReRead={async () => {
                        const res = await fetch(`/api/dbms/constraints/test-cascade?full_name=${encodeURIComponent(cascadeResult.fullName)}`);
                        const data = await res.json();
                        return `patients=${data.counts.patients}, prescriptions=${data.counts.prescriptions}, risk_assessments=${data.counts.risk_assessments}, assessment_findings=${data.counts.assessment_findings}`;
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: CHECK Constraints */}
          <div className="card">
            <span className="badge" style={{ background: '#8b5cf6', color: '#f8fafc', marginBottom: 8, display: 'inline-block' }}>
              RUBRIC DEMO: DOMAIN INTEGRITY
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              C. Domain Invariant CHECK Constraints Sandbox
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
              PostgreSQL enforces domain rules at the schema level before rows are accepted into storage.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 18 }}>
              <button
                onClick={() => handleTestCheck('PATIENT_SYNTHETIC')}
                disabled={checkLoading}
                className="btn btn-secondary"
                style={{ textAlign: 'left', padding: '14px', whiteSpace: 'normal', minWidth: 0, height: 'auto' }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Test 1: Synthetic Patient Guard</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                  CHECK (is_synthetic = TRUE)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 8 }}>
                  Attempts inserting is_synthetic = FALSE
                </div>
              </button>

              <button
                onClick={() => handleTestCheck('HOP_DEPTH')}
                disabled={checkLoading}
                className="btn btn-secondary"
                style={{ textAlign: 'left', padding: '14px', whiteSpace: 'normal', minWidth: 0, height: 'auto' }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Test 2: Hop Depth Bound</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                  CHECK (max_hop_depth BETWEEN 1 AND 3)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 8 }}>
                  Attempts inserting hop_depth = 5
                </div>
              </button>

              <button
                onClick={() => handleTestCheck('PAIR_ORDER')}
                disabled={checkLoading}
                className="btn btn-secondary"
                style={{ textAlign: 'left', padding: '14px', whiteSpace: 'normal', minWidth: 0, height: 'auto' }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Test 3: Canonical Pair Order</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                  CHECK (drug_a_id &lt; drug_b_id)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 8 }}>
                  Attempts inserting drug_a=5, drug_b=1
                </div>
              </button>
            </div>

            {checkResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '0.85rem',
                }}
              >
                <strong style={{ color: '#ef4444' }}>🛡️ CHECK Constraint Enforced:</strong>{' '}
                <span style={{ color: '#f8fafc' }}>{checkResult.demonstrationSummary}</span>
                <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: '0.75rem', color: '#fca5a5' }}>
                  Constraint Name: {checkResult.constraint} | SQLState: {checkResult.errorCode}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODULE 2: TRIGGERS & AUDITS */}
      {/* ====================================================================== */}
      {activeTab === 'triggers' && (
        <div className="card">
          <span className="badge badge-major" style={{ marginBottom: 8, display: 'inline-block' }}>
            RUBRIC DEMO: AUTOMATED AUDIT TRIGGERS
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            Materialized Summary Counters via Trigger: <code>trg_assessment_findings_count</code>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
            PostgreSQL executes <code>fn_update_assessment_counts()</code> on <code>AFTER INSERT ON assessment_findings</code>, incrementing parent summary counters without application-side recalculation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            <div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Isolated Sandbox Assessment ID: #{triggerHeader?.assessment_id ?? 'Loading...'}
                  </div>
                  <button
                    onClick={handleResetTriggerDemo}
                    disabled={triggerLoading}
                    className="btn"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                    }}
                    title="Purge this sandbox assessment and start fresh at 0/0"
                  >
                    🔄 Reset Demo Session
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8 }}>
                  This session is isolated via <code>assessment_notes</code> and never touches real clinical assessments.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                      {triggerHeader?.direct_interaction_count ?? 0}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: 4 }}>
                      direct_interaction_count
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 6,
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4' }}>
                      {triggerHeader?.multi_hop_candidate_count ?? 0}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#67e8f9', marginTop: 4 }}>
                      multi_hop_candidate_count
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={() => handleInsertFindingTrigger('DOCUMENTED_DIRECT')}
                    disabled={triggerLoading || !triggerHeader}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    + Insert 1-Hop Direct Finding
                  </button>
                  <button
                    onClick={() => handleInsertFindingTrigger('CANDIDATE_PATHWAY')}
                    disabled={triggerLoading || !triggerHeader}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    + Insert 2-Hop Pathway Finding
                  </button>
                </div>
              </div>

              {triggerResult && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.85rem',
                    color: '#6ee7b7',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>⚡ PostgreSQL Trigger Execution Confirmed:</div>
                  <div style={{ marginTop: 4 }}>
                    Before: Direct={triggerResult.beforeCounts.direct}, Multi-Hop={triggerResult.beforeCounts.multiHop}
                    <br />
                    After: Direct=<strong>{triggerResult.afterCounts.direct}</strong>, Multi-Hop=<strong>{triggerResult.afterCounts.multiHop}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: 4, color: '#a7f3d0' }}>
                    Function: {triggerResult.functionExecuted} (Executed in {triggerResult.executionMs}ms)
                  </div>
                </div>
              )}

              {triggerHeader && (
                <VerifyOnDisk
                  query={`SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count\nFROM risk_assessments WHERE assessment_id = ${triggerHeader.assessment_id};`}
                  expected={`direct_interaction_count=${triggerHeader.direct_interaction_count}, multi_hop_candidate_count=${triggerHeader.multi_hop_candidate_count} on the live row — exactly what the trigger wrote, nothing computed here.`}
                  onReRead={async () => {
                    const res = await fetch('/api/dbms/triggers/demo');
                    const data = await res.json();
                    return `assessment_id=${data.assessment.assessment_id}, direct_interaction_count=${data.assessment.direct_interaction_count}, multi_hop_candidate_count=${data.assessment.multi_hop_candidate_count}`;
                  }}
                />
              )}
            </div>

            <div>
              <SqlCodeViewer
                title="PL/pgSQL Trigger Source Code in PostgreSQL"
                code={`CREATE OR REPLACE FUNCTION fn_update_assessment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.finding_type = 'DOCUMENTED_DIRECT' THEN
        UPDATE risk_assessments
        SET direct_interaction_count = direct_interaction_count + 1
        WHERE assessment_id = NEW.assessment_id;
    ELSIF NEW.finding_type = 'CANDIDATE_PATHWAY' THEN
        UPDATE risk_assessments
        SET multi_hop_candidate_count = multi_hop_candidate_count + 1
        WHERE assessment_id = NEW.assessment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_assessment_findings_count
AFTER INSERT ON assessment_findings
FOR EACH ROW EXECUTE FUNCTION fn_update_assessment_counts();`}
                language="sql"
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODULE 3: PROCEDURES & STORED FUNCTIONS */}
      {/* ====================================================================== */}
      {activeTab === 'procedures' && (
        <div className="card">
          <span className="badge badge-doctor" style={{ marginBottom: 8, display: 'inline-block' }}>
            RUBRIC DEMO: PL/pgSQL PROCEDURAL LOGIC
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            Stored Procedure Runner: <code>fn_perform_patient_direct_screening()</code>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
            Execute complex procedural screening logic entirely within the PostgreSQL database engine.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 20 }}>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
                    Patient Full Name (e.g. Robert Vance, Sarah Connor, James Wilson, Diana Prince):
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="input-field"
                      value={procedurePatientName}
                      onChange={(e) => setProcedurePatientName(e.target.value)}
                      placeholder="e.g. Robert Vance"
                      style={{ flex: 1 }}
                    />
                    <select
                      className="input-field"
                      style={{ width: 'auto', minWidth: 175, fontSize: '0.8rem' }}
                      value={procedurePatientName}
                      onChange={(e) => setProcedurePatientName(e.target.value)}
                    >
                      <option value="Robert Vance">Robert Vance (Patient 1)</option>
                      <option value="Sarah Connor">Sarah Connor (Patient 2)</option>
                      <option value="James Wilson">James Wilson (Patient 3)</option>
                      <option value="Diana Prince">Diana Prince (Patient 4)</option>
                    </select>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Using unique <code>full_name</code> from <code>patients</code> table to invoke the overloaded PL/pgSQL function.
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
                    Clinician Username:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={procedureDoctor}
                    onChange={(e) => setProcedureDoctor(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
                    Clinical Audit Notes:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={procedureNotes}
                    onChange={(e) => setProcedureNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleExecuteProcedure}
                  disabled={procedureLoading}
                  className="btn btn-primary"
                  style={{ marginTop: 10, padding: '12px' }}
                >
                  {procedureLoading ? 'Executing on PostgreSQL...' : 'Invoke PL/pgSQL Stored Function'}
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <SqlCodeViewer
                  title="Invocation SQL (Executes by full_name)"
                  code={`SELECT * FROM fn_perform_patient_direct_screening(
    '${procedurePatientName}', 
    '${procedureDoctor}', 
    '${procedureNotes}'
);`}
                  language="sql"
                />
              </div>
            </div>

            <div>
              {procedureResult && !procedureResult.success ? (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong style={{ color: '#ef4444' }}>🛡️ Function Raised an Error:</strong>{' '}
                  <span style={{ color: '#f8fafc' }}>{procedureResult.error}</span>
                </div>
              ) : procedureResult ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      Returned Table Result ({procedureResult.rowsReturned} rows for &quot;{procedureResult.patientName}&quot;)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8' }}>
                      ⚡ Executed in {procedureResult.executionMs}ms
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Assessment ID</th>
                          <th>Drug A</th>
                          <th>Drug B</th>
                          <th>Severity</th>
                          <th>Mechanism</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {procedureResult.data.map((row: any, i: number) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>#{row.assessment_id}</td>
                            <td style={{ fontWeight: 600, color: '#f8fafc' }}>{row.drug_a}</td>
                            <td style={{ fontWeight: 600, color: '#f8fafc' }}>{row.drug_b}</td>
                            <td>
                              <span className={`badge ${row.severity === 'Major' ? 'badge-major' : 'badge-doctor'}`}>
                                {row.severity}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.mechanisms || 'General'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#38bdf8' }}>
                              {row.sources}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: '100%',
                    minHeight: 240,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: '#64748b',
                    fontSize: '0.85rem',
                  }}
                >
                  Click Invoke to run the stored procedure and inspect the tabular result
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODULE 4: ADVANCED SQL & RECURSIVE CTE SHOWCASE */}
      {/* ====================================================================== */}
      {activeTab === 'queries' && (
        <div className="card">
          <span className="badge" style={{ background: '#0ea5e9', color: '#ffffff', marginBottom: 8, display: 'inline-block' }}>
            RUBRIC DEMO: ADVANCED SQL &amp; CTEs
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            Evaluated Advanced SQL Showcase &amp; Recursive Graph CTE
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
            Direct one-click execution of all 7 evaluated rubric queries from <code>04_required_queries.sql</code>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queriesList.map((q) => {
                const isSelected = selectedQueryId === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQueryId(q.id);
                      handleExecuteQuery(q.id);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Q{q.id}. {q.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: 4 }}>
                      {q.rubricMarks}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              {queriesList.find((q) => q.id === selectedQueryId) && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {queriesList.find((q) => q.id === selectedQueryId)?.title}
                    </h3>
                    <button
                      onClick={() => handleExecuteQuery(selectedQueryId)}
                      disabled={queryLoading}
                      className="btn btn-primary btn-sm"
                    >
                      {queryLoading ? 'Running...' : 'Execute Live on PostgreSQL'}
                    </button>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 6 }}>
                    {queriesList.find((q) => q.id === selectedQueryId)?.explanation}
                  </p>

                  <SqlCodeViewer
                    title="Exact Evaluated SQL"
                    code={queriesList.find((q) => q.id === selectedQueryId)?.sql || ''}
                    language="sql"
                    latencyMs={queryExecutionResult?.executionMs}
                  />

                  {queryExecutionResult && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
                        Live Tabular Execution Result ({queryExecutionResult.rowsReturned} rows returned):
                      </div>
                      <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                        <table className="table" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              {queryExecutionResult.data.length > 0 &&
                                Object.keys(queryExecutionResult.data[0]).map((col) => (
                                  <th key={col}>{col}</th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryExecutionResult.data.map((row: any, idx: number) => (
                              <tr key={idx}>
                                {Object.values(row).map((val: any, valIdx: number) => (
                                  <td key={valIdx} style={{ fontFamily: typeof val === 'number' ? 'monospace' : 'inherit' }}>
                                    {String(val ?? 'NULL')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODULE 5: DDL & SCHEMA STUDIO */}
      {/* ====================================================================== */}
      {activeTab === 'ddl' && (
        <div className="card">
          <span className="badge badge-admin" style={{ marginBottom: 8, display: 'inline-block' }}>
            RUBRIC DEMO: DDL &amp; SCHEMA ARCHITECTURE
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            Live Schema Catalog &amp; "Show Create Table" DDL Reconstructor
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
            Satisfies evaluator request to inspect table columns and full <code>CREATE TABLE</code> DDL statements directly in the UI.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 18, alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              Select Table:
            </label>
            <select
              className="input-field"
              style={{ maxWidth: 280 }}
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              {tableList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {schemaLoading && <span style={{ fontSize: '0.8rem', color: '#6366f1' }}>Loading catalog...</span>}
          </div>

          {tableSchemaData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                  Table Structure (information_schema.columns)
                </h4>
                <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Key / Constraint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSchemaData.columns.map((c: any) => (
                        <tr key={c.column_name}>
                          <td style={{ fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
                            {c.column_name}
                          </td>
                          <td style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{c.data_type}</td>
                          <td>{c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}</td>
                          <td>
                            {c.constraint_type && (
                              <span
                                className={`badge ${
                                  c.constraint_type === 'PRIMARY KEY'
                                    ? 'badge-major'
                                    : c.constraint_type === 'FOREIGN KEY'
                                    ? 'badge-doctor'
                                    : 'badge-admin'
                                }`}
                              >
                                {c.constraint_type}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                  Reconstructed "Show Create Table" DDL
                </h4>
                <SqlCodeViewer
                  title={`CREATE TABLE public.${selectedTable}`}
                  code={tableSchemaData.ddl}
                  language="sql"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODULE 6: DCL, ENGINE ROLES & RBAC */}
      {/* ====================================================================== */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Reviewer Defense Banner */}
          <div
            className="card"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a5b4fc' }}>
              🛡️ Reviewer Defense: Two-Tier Enterprise Security Architecture
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.5 }}>
              <strong>Tier 1: Application Profile Layer (<code>user_accounts</code> table):</strong> Holds clinical metadata, medical license numbers, doctor display names, and account active flags.
              <br />
              <strong>Tier 2: DBMS Engine DCL Layer (<code>CREATE USER</code> + <code>GRANT role_*</code>):</strong> Creates the database login in PostgreSQL system catalogs (<code>pg_user</code>, <code>pg_roles</code>) and enforces least-privilege permission barriers at the kernel level.
            </p>
          </div>

          {/* Form to Create Doctor with Real DCL */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              A. Interactive User Creation Form (Executes PostgreSQL DCL)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
              Submitting this form executes both <code>INSERT INTO user_accounts</code> AND native PostgreSQL <code>CREATE USER &lt;username&gt;</code> + <code>GRANT &lt;role&gt;</code>.
            </p>

            <form onSubmit={handleCreateUserDcl} style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                    Username:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                    Full Clinician Name:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                    Password:
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                    Role Assignment:
                  </label>
                  <select
                    className="input-field"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                  >
                    <option value="DOCTOR">role_doctor (Clinician)</option>
                    <option value="ADMIN">role_admin (Administrator)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <button type="submit" disabled={dclLoading} className="btn btn-primary">
                  {dclLoading ? 'Executing DCL in PostgreSQL...' : 'Create User (Executes CREATE USER & GRANT)'}
                </button>
                <button
                  type="button"
                  onClick={handleTestRbacBarrier}
                  disabled={rbacLoading}
                  className="btn btn-secondary"
                >
                  {rbacLoading ? 'Testing Barrier...' : 'Test Least-Privilege Barrier as role_doctor'}
                </button>
              </div>
            </form>

            {dclResult && dclResult.dclExecuted && (
              <div style={{ marginTop: 14 }}>
                <SqlCodeViewer
                  title="DCL Statements Executed on PostgreSQL Engine"
                  code={dclResult.dclExecuted.join('\n')}
                  language="sql"
                />
                <VerifyOnDisk
                  query={`SELECT usename, usecreatedb FROM pg_user WHERE usename = '${dclResult.data.username}';`}
                  expected={`One row: usename=${dclResult.data.username} — proves CREATE USER actually ran, not just the user_accounts insert.`}
                  onReRead={async () => {
                    const res = await fetch('/api/dbms/roles');
                    const data = await res.json();
                    const row = data.tier2PostgresEngineRoles?.find((r: any) => r.rolname === dclResult.data.username);
                    return row
                      ? `Found in pg_roles: rolname=${row.rolname}, member_of=${row.member_of.join(', ') || 'none'}`
                      : 'Not found in pg_roles (DCL may have failed).';
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteDemoUser(dclResult.data.username)}
                  disabled={dclLoading}
                  className="btn"
                  style={{
                    marginTop: 10,
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.78rem',
                    width: '100%',
                  }}
                  title="Reverses this demo: DROP USER + delete application profile row"
                >
                  🗑️ Remove Demo Account &amp; Self-Clean (DROP USER {dclResult.data.username})
                </button>
              </div>
            )}

            {rbacTestResult && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.85rem',
                  color: '#6ee7b7',
                }}
              >
                <div style={{ fontWeight: 700 }}>🛡️ Least-Privilege Engine Security Verified:</div>
                <div style={{ marginTop: 4 }}>{rbacTestResult.demonstrationSummary}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginTop: 4, color: '#a7f3d0' }}>
                  Query Attempted: {rbacTestResult.attemptedQuery} | SQLState: {rbacTestResult.errorCode} (insufficient_privilege)
                </div>
              </div>
            )}
          </div>

          {/* Side-by-Side Dual Catalog Viewer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Engine Catalogs */}
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
                PostgreSQL Engine Catalogs (pg_roles &amp; pg_user)
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
                Queried directly from internal engine system tables.
              </p>
              <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Rolname</th>
                      <th>CanLogin</th>
                      <th>Member Of</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineRoles.map((r) => (
                      <tr key={r.rolname}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f8fafc' }}>
                          {r.rolname}
                        </td>
                        <td>{r.rolcanlogin ? 'YES' : 'NO (Group)'}</td>
                        <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                          {r.member_of?.join(', ') || 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Application Profile Table */}
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>
                Application Profiles Table (public.user_accounts)
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
                Maintains display names and clinical metadata in relational storage.
              </p>
              <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appProfiles.map((u) => (
                      <tr key={u.user_id}>
                        <td style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>#{u.user_id}</td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{u.username}</td>
                        <td>{u.full_name}</td>
                        <td>
                          <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-doctor'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODULE 7: NOSQL GRAPH RUD (NEO4J) */}
      {/* ====================================================================== */}
      {activeTab === 'graph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Graph-wide schema & verification: SHOW CONSTRAINTS, counts, centrality */}
          <div className="card">
            <span className="badge" style={{ background: '#0ea5e9', color: '#f8fafc', marginBottom: 8, display: 'inline-block' }}>
              RUBRIC DEMO: NOSQL/GRAPH DATABASE CREATION &amp; SCHEMA
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Graph-Wide Schema, Uniqueness Constraints &amp; Centrality
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
              Everything an examiner would otherwise check in Neo4j Browser with <code>SHOW CONSTRAINTS</code> and node/edge counts, read live from this app.
            </p>

            {graphOverviewLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 16 }}>Querying Neo4j…</div>
            ) : graphOverview ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18 }}>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ padding: 14, borderRadius: 8, background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{graphOverview.nodeCount}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>:Drug nodes</div>
                    </div>
                    <div style={{ padding: 14, borderRadius: 8, background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{graphOverview.edgeCount}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>INTERACTS_WITH edges</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                    Uniqueness Constraints (SHOW CONSTRAINTS)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {graphOverview.constraints.map((c: any) => (
                      <div
                        key={c.name}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#a5f3fc',
                        }}
                      >
                        {c.name}: {c.type} ON ({c.labelsOrTypes.join(', ')}) {c.properties.join(', ')}
                      </div>
                    ))}
                  </div>

                  <VerifyOnDisk
                    query={'SHOW CONSTRAINTS;'}
                    language="cypher"
                    expected={`${graphOverview.constraints.length} uniqueness constraints on :Drug, status ONLINE.`}
                    onReRead={async () => {
                      const res = await fetch('/api/neo4j/graph-rud?action=overview');
                      const data = await res.json();
                      return `${data.overview.constraints.length} constraints, ${data.overview.nodeCount} nodes, ${data.overview.edgeCount} edges`;
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                    Degree Centrality (Most-Connected Drugs)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {graphOverview.centrality.map((c: any, i: number) => (
                      <div
                        key={c.drug}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.82rem',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)' }}>#{i + 1} {c.drug}</span>
                        <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', fontSize: '0.7rem' }}>
                          degree {c.degreeCentrality}
                        </span>
                      </div>
                    ))}
                  </div>

                  <SqlCodeViewer
                    title="Degree Centrality Cypher"
                    language="cypher"
                    code={`MATCH (d:Drug)-[r:INTERACTS_WITH]-()\nRETURN d.canonical_name AS drug, count(r) AS degree_centrality\nORDER BY degree_centrality DESC\nLIMIT 5;`}
                  />

                  <button
                    onClick={() => setShowFullGraph((v) => !v)}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: 12 }}
                  >
                    {showFullGraph ? 'Hide Full Interaction Graph' : 'View Full Interaction Graph (All 10 Drugs)'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 16 }}>No graph data available.</div>
            )}

            {showFullGraph && graphOverview && (
              <div style={{ marginTop: 16 }}>
                <InteractionGraphViewer
                  nodes={graphOverview.nodes.map((n: any) => ({ id: n.id, name: n.name, type: 'Prescribed' as const }))}
                  links={graphOverview.edges.map((e: any) => ({
                    source: e.source,
                    target: e.target,
                    severity: e.severity,
                    mechanism: e.mechanism,
                  }))}
                  width={1200}
                  height={420}
                />
              </div>
            )}
          </div>

          <div className="card">
            <span className="badge" style={{ background: '#0ea5e9', color: '#f8fafc', marginBottom: 8, display: 'inline-block' }}>
              RUBRIC DEMO: NOSQL CREATE / READ / UPDATE / DELETE
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Full CRUD on the Neo4j Property Graph
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
              Every action here executes real Cypher against the running Neo4j instance — no in-memory mock. Create/Update/Delete require ADMIN.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18 }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>Drug A</label>
                    <select className="input-field" value={edgeDrugA} onChange={(e) => setEdgeDrugA(e.target.value)}>
                      {allDrugs.map((d) => (
                        <option key={d.drug_id} value={d.canonical_name}>{d.canonical_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>Drug B</label>
                    <select className="input-field" value={edgeDrugB} onChange={(e) => setEdgeDrugB(e.target.value)}>
                      {allDrugs.map((d) => (
                        <option key={d.drug_id} value={d.canonical_name}>{d.canonical_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>Severity</label>
                    <select className="input-field" value={edgeSeverity} onChange={(e) => setEdgeSeverity(e.target.value)}>
                      {['Major', 'Moderate', 'Minor', 'Unknown'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>Mechanism</label>
                    <input
                      className="input-field"
                      value={edgeMechanism}
                      onChange={(e) => setEdgeMechanism(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCreateGraphEdge} disabled={graphMutationLoading} className="btn btn-primary" style={{ flex: 1 }}>
                    Create (MERGE)
                  </button>
                  <button onClick={handleUpdateGraphEdge} disabled={graphMutationLoading} className="btn btn-secondary" style={{ flex: 1 }}>
                    Update (SET)
                  </button>
                  <button
                    onClick={handleDeleteGraphEdge}
                    disabled={graphMutationLoading}
                    className="btn"
                    style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', color: '#fb7185', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                  >
                    Delete
                  </button>
                </div>

                {graphMutationResult && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 8,
                      background: graphMutationResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${graphMutationResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      fontSize: '0.82rem',
                      color: graphMutationResult.success ? '#6ee7b7' : '#fca5a5',
                    }}
                  >
                    [{graphMutationResult.op}] {graphMutationResult.message || graphMutationResult.error}
                    {graphMutationResult.executionMs !== undefined && ` (${graphMutationResult.executionMs}ms)`}
                  </div>
                )}

                <VerifyOnDisk
                  query={`MATCH (a:Drug {canonical_name: '${edgeDrugA}'})-[r:INTERACTS_WITH]-(b:Drug {canonical_name: '${edgeDrugB}'})\nRETURN a.canonical_name, r.severity_level, r.mechanism_categories, b.canonical_name;`}
                  language="cypher"
                  expected="The edge's current severity_level and mechanism_categories properties, matching whatever this panel last wrote."
                  onReRead={async () => {
                    const res = await fetch(`/api/neo4j/graph-rud?drug=${encodeURIComponent(edgeDrugA)}`);
                    const data = await res.json();
                    const edge = data.starNetwork?.edges?.find(
                      (e: any) =>
                        (e.source === edgeDrugA && e.target === edgeDrugB) ||
                        (e.source === edgeDrugB && e.target === edgeDrugA)
                    );
                    return edge
                      ? `severity=${edge.severity}, mechanism=${edge.mechanism}`
                      : 'No edge found between these two drugs.';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
                  Read: 1-hop ego-network for
                </label>
                <select
                  className="input-field"
                  value={starNetworkDrug}
                  onChange={(e) => {
                    setStarNetworkDrug(e.target.value);
                    loadStarNetwork(e.target.value);
                  }}
                  style={{ marginBottom: 12 }}
                >
                  {allDrugs.map((d) => (
                    <option key={d.drug_id} value={d.canonical_name}>{d.canonical_name}</option>
                  ))}
                </select>

                {starNetworkLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Querying Neo4j…</div>
                ) : starNetwork ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{starNetwork.center.name}</div>
                    {starNetwork.edges.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No edges in the graph for this drug yet.</div>
                    ) : (
                      starNetwork.edges.map((e: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            background: 'rgba(14, 165, 233, 0.08)',
                            border: '1px solid rgba(14, 165, 233, 0.25)',
                            fontSize: '0.82rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {e.source} &harr; {e.target}
                          </span>
                          <span className={`badge ${severityBadgeClassForGraph(e.severity)}`} style={{ fontSize: '0.68rem' }}>
                            {e.severity || 'Unknown'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No graph data found for this drug.</div>
                )}

                <div style={{ marginTop: 14 }}>
                  <SqlCodeViewer
                    title="Read: Cypher Ego-Network Query"
                    code={`MATCH (d:Drug {canonical_name: '${starNetworkDrug}'})\nOPTIONAL MATCH (d)-[r:INTERACTS_WITH]-(other:Drug)\nRETURN d, collect({ rel: r, neighbor: other }) AS connections;`}
                    language="cypher"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
