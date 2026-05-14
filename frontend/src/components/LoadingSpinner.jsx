import React from 'react';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} rounded-full border-2 animate-spin`}
        style={{ borderColor: 'rgba(194,24,116,0.2)', borderTopColor: '#C21874' }} />
      {text && <p className="text-sm font-medium" style={{ color: '#6F2DA8' }}>{text}</p>}
    </div>
  );
}
