'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface GraphNode {
  id: string;
  name: string;
  type: 'Prescribed' | 'Bridge' | 'Target' | 'CenterDrug' | 'InteractingDrug';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  severity?: string;
  mechanism?: string;
  findingType?: 'DOCUMENTED_DIRECT' | 'CANDIDATE_PATHWAY';
}

interface InteractionGraphViewerProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
  selectedElement?: string | null;
  onSelectNode?: (nodeName: string) => void;
}

export default function InteractionGraphViewer({
  nodes: initialNodes,
  links: initialLinks,
  width = 800,
  height = 380,
  selectedElement,
  onSelectNode,
}: InteractionGraphViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Interactive Drag State
  const dragNodeRef = useRef<GraphNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Filter links based on user controls
    const activeLinks = initialLinks.filter((l) => {
      if (severityFilter !== 'ALL' && l.severity !== severityFilter) return false;
      return true;
    });

    // Positions nodes with basic physics / radial anchor
    const simNodes: GraphNode[] = initialNodes.map((n, i) => {
      const isPrescribed = n.type === 'Prescribed';
      const angle = (i / Math.max(initialNodes.length, 1)) * 2 * Math.PI;
      const dist = isPrescribed ? radius * 0.75 : radius * 1.15;
      return {
        ...n,
        x: n.x ?? (centerX + dist * Math.cos(angle)),
        y: n.y ?? (centerY + dist * Math.sin(angle)),
        vx: 0,
        vy: 0,
      };
    });

    let animationFrameId: number | undefined;
    let particleOffset = 0;

    const render = () => {
      particleOffset = (particleOffset + 0.015) % 1;
      ctx.clearRect(0, 0, width, height);

      // 1. Background Grid & Radar Rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Links (Edges)
      activeLinks.forEach((link) => {
        const sourceNode = simNodes.find((n) => n.id.toLowerCase() === link.source.toLowerCase());
        const targetNode = simNodes.find((n) => n.id.toLowerCase() === link.target.toLowerCase());

        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          const isCandidate = link.findingType === 'CANDIDATE_PATHWAY' || link.mechanism?.includes('Candidate');
          const isMajor = link.severity === 'Major';

          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);

          // Solid line for DIRECT, Dashed line for CANDIDATE PATHWAY (Hypothesis)
          if (isCandidate) {
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = isMajor ? '#ef4444' : '#f59e0b';
            ctx.lineWidth = isMajor ? 3 : 2;
          }
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash

          // Directional Flow Particle (60fps simulation)
          if (isCandidate) {
            const px = sourceNode.x + (targetNode.x - sourceNode.x) * particleOffset;
            const py = sourceNode.y + (targetNode.y - sourceNode.y) * particleOffset;
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Edge Label
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.fillStyle = isCandidate ? '#67e8f9' : isMajor ? '#fca5a5' : '#fde68a';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(link.severity || (isCandidate ? 'Hypothesis' : 'Documented'), midX, midY - 6);
        }
      });

      // 3. Draw Nodes
      simNodes.forEach((node) => {
        if (!node.x || !node.y) return;

        const isPrescribed = node.type === 'Prescribed';
        const isBridge = node.type === 'Bridge';
        const isTarget = node.type === 'Target';
        const isSelected = selectedElement?.toLowerCase() === node.name.toLowerCase();

        const nodeColor = isPrescribed ? '#3b82f6' : isBridge ? '#f59e0b' : '#ef4444';
        const nodeRadius = isPrescribed ? 16 : 13;

        // Selection / Focus Glow
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 10, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.fill();
        }

        // Outer Aura
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${nodeColor}28`;
        ctx.fill();

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.lineWidth = isPrescribed ? 2.5 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + nodeRadius + 14);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse Drag Listeners
    //
    // Node positions live in the canvas's native coordinate space (the
    // `width`/`height` attributes, e.g. 800x380), but the canvas is styled
    // to render responsively (width: 100%) — so its CSS-rendered size from
    // getBoundingClientRect() only equals the native size when the
    // container happens to be exactly `width` pixels wide. On any narrower
    // viewport the two diverge, and using raw CSS-space coordinates for hit
    // testing silently misses every node. Scale by the native/CSS ratio so
    // clicks and drags land where the pointer actually is regardless of how
    // the canvas has been scaled down.
    const toCanvasCoords = (e: MouseEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const { x: mx, y: my } = toCanvasCoords(e);
      const clicked = simNodes.find((n) => n.x && n.y && Math.hypot(n.x - mx, n.y - my) < 22);
      if (clicked) {
        dragNodeRef.current = clicked;
        if (onSelectNode) onSelectNode(clicked.name);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (dragNodeRef.current) {
        const { x, y } = toCanvasCoords(e);
        dragNodeRef.current.x = x;
        dragNodeRef.current.y = y;
      }
    };

    const handleMouseUp = () => {
      dragNodeRef.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [initialNodes, initialLinks, width, height, selectedElement, severityFilter, onSelectNode]);

  const copyCypher = () => {
    const drugNames = initialNodes.map((n) => `'${n.name.toLowerCase()}'`).join(', ');
    const cypher = `MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug)\nWHERE d1.canonical_name IN [${drugNames}]\nRETURN d1, r, d2 LIMIT 50;`;
    navigator.clipboard.writeText(cypher);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 12,
        background: '#070b14',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: '16px 0',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.78rem', color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} /> Prescribed Drug
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Discovered Bridge
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Target Candidate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 2, background: '#06b6d4', borderBottom: '2px dashed #06b6d4' }} /> Hypothesis Path
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="input-field"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Major">Major Only</option>
            <option value="Moderate">Moderate Only</option>
          </select>

          <button
            onClick={copyCypher}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            title="Copy query to verify in Neo4j Browser (:7474)"
          >
            {copiedCypher ? '✓ Cypher Copied' : 'Copy Cypher'}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          borderRadius: 8,
          background: 'radial-gradient(ellipse at center, #0e1726 0%, #030712 100%)',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)',
          width: '100%',
          maxWidth: width,
          height: 'auto',
          aspectRatio: `${width} / ${height}`,
          cursor: 'grab',
        }}
      />
    </div>
  );
}
