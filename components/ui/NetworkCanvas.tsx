'use client';

import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Edge {
  a: number;
  b: number;
  candidate: boolean;
}

/**
 * The login screen's signature moment: a slowly drifting network of nodes
 * and edges — the same documented-vs-candidate distinction (solid vs.
 * dashed) used everywhere else in the app for direct findings vs. candidate
 * pathways. It's the one visual asset this product actually owns (a drug
 * interaction graph), so it opens the experience rather than a generic
 * gradient blob. Fully decorative — aria-hidden, and freezes in place when
 * the user has prefers-reduced-motion set.
 */
export default function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const NODE_COUNT = 16;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    function resize() {
      const parent = canvas!.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : 420;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      nodes.length = 0;
      edges.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: 2 + Math.random() * 2.2,
        });
      }
      // A handful of fixed edges, mixing solid (documented) and dashed
      // (candidate) — enough to read as a network, not so many it's noisy.
      const pairs: [number, number, boolean][] = [
        [0, 1, false], [1, 2, true], [2, 3, false], [3, 4, true],
        [4, 5, false], [1, 6, true], [6, 7, false], [7, 8, true],
        [2, 9, false], [9, 10, true], [5, 11, false], [11, 12, true],
        [8, 13, false], [13, 14, true], [10, 15, false], [0, 6, true],
      ];
      for (const [a, b, candidate] of pairs) {
        if (a < NODE_COUNT && b < NODE_COUNT) edges.push({ a, b, candidate });
      }
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        }
      }

      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = e.candidate ? 'rgba(45, 212, 232, 0.22)' : 'rgba(124, 108, 245, 0.28)';
        ctx!.lineWidth = 1;
        ctx!.setLineDash(e.candidate ? [4, 4] : []);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);

      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(226, 232, 240, 0.35)';
        ctx!.fill();
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(step);
      }
    }

    let rafId = 0;
    resize();
    seed();
    step();

    const onResize = () => {
      resize();
      seed();
      if (prefersReducedMotion) step();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
