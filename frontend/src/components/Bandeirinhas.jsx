import React from 'react';

const COLORS = ['#C21874','#6F2DA8','#C79A3B','#007C91','#D96C2F','#4B1E6D','#1F5F6B'];

export default function Bandeirinhas({ className = '' }) {
  return (
    <div className={`relative overflow-hidden h-8 ${className}`} aria-hidden>
      <svg viewBox="0 0 400 32" preserveAspectRatio="none" className="w-full h-full">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" stroke="#C79A3B" strokeWidth="1.5" fill="none" strokeDasharray="4,2" />
        {Array.from({ length: 14 }).map((_, i) => {
          const x = (i / 13) * 380 + 10;
          const y = i % 2 === 0 ? 10 : 16;
          return (
            <polygon key={i} points={`${x},${y} ${x - 7},${y + 12} ${x + 7},${y + 12}`} fill={COLORS[i % COLORS.length]} opacity="0.9" />
          );
        })}
      </svg>
    </div>
  );
}
