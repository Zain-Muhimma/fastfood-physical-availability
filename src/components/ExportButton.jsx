import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileArrowDown } from '@phosphor-icons/react';

const OPTIONS = [
  { label: 'Quick Summary', scope: 'summary' },
  { label: 'Full Report', scope: 'full' },
];

const ExportButton = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-primary text-white text-[12px] font-bold uppercase tracking-wide hover:bg-orange-hover transition-colors"
      >
        <FileArrowDown size={16} weight="bold" />
        Generate Report
      </button>

      {open && (
        <div className="absolute right-0 mt-1 bg-white rounded-card shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[160px]">
          {OPTIONS.map(({ label, scope }) => (
            <button
              key={scope}
              onClick={() => { setOpen(false); navigate(`/report?scope=${scope}`); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-orange-light transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportButton;
