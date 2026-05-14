import React from 'react';

const STATUS_LEVELS = [
  { emoji: '🌽', label: 'Visitante da Vila',       bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { emoji: '🪗', label: 'Forrozeiro Oficial',       bg: 'bg-orange-100', text: 'text-orange-800' },
  { emoji: '❤️', label: 'Embaixador do Arrasta-pé', bg: 'bg-rose-100',   text: 'text-rose-800'   },
  { emoji: '🔥', label: 'Lenda das Juninas',        bg: 'bg-red-100',    text: 'text-red-800'    },
];

export default function StatusBadge({ level = 0, size = 'sm' }) {
  const s = STATUS_LEVELS[level] || STATUS_LEVELS[0];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${s.bg} ${s.text} ${sizeClass}`}>
      <span>{s.emoji}</span>
      <span>{s.label}</span>
    </span>
  );
}
