import React from 'react';

const STATUS_LEVELS = [
  { emoji: '🌽', label: 'Visitante da Vila',        bg: '#E9D1B5', text: '#3A1F14', border: '#C79A3B' },
  { emoji: '🪗', label: 'Forrozeiro Oficial',        bg: '#F5E7D3', text: '#D96C2F', border: '#D96C2F' },
  { emoji: '❤️', label: 'Embaixador do Arrasta-pé',  bg: 'rgba(194,24,116,0.1)', text: '#C21874', border: '#C21874' },
  { emoji: '🔥', label: 'Lenda das Juninas',         bg: 'rgba(111,45,168,0.12)', text: '#6F2DA8', border: '#6F2DA8' },
];

export default function StatusBadge({ level = 0, size = 'sm' }) {
  const s = STATUS_LEVELS[Math.min(level, 3)];
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs  = size === 'sm' ? 11 : 13;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      borderRadius: 999, fontWeight: 600, fontSize: fs,
      padding: pad, background: s.bg, color: s.text,
      border: `1.5px solid ${s.border}`,
    }}>
      <span>{s.emoji}</span>
      <span>{s.label}</span>
    </span>
  );
}
