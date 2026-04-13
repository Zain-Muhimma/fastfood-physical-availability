import React from 'react';

const ReportHeroKPI = ({ label, value, subtitle, color = '#F36B1F' }) => (
  <div
    className="inline-block text-center bg-white rounded-card"
    style={{
      padding: '14px 20px',
      border: '1px solid #E5E7EB',
      minWidth: '130px',
    }}
  >
    <p className="text-[9px] text-text-secondary font-medium uppercase tracking-wider mb-1">
      {label}
    </p>
    <p
      className="font-display leading-none"
      style={{ fontSize: '36px', color }}
    >
      {value}
    </p>
    {subtitle && (
      <p className="text-[8px] text-text-secondary mt-1">{subtitle}</p>
    )}
  </div>
);

export default ReportHeroKPI;
