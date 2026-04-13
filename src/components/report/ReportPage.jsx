import React from 'react';

const ReportPage = ({ title, children, isFirst = false }) => (
  <section
    className="bg-white w-full"
    style={{
      width: '297mm',
      minHeight: '210mm',
      padding: '12mm 18mm',
      breakBefore: isFirst ? 'auto' : 'always',
      position: 'relative',
    }}
  >
    {/* Orange top border */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: '#F36B1F',
      }}
    />

    {/* Header */}
    {title && (
      <h2
        className="font-display text-[28px] text-text-primary tracking-wide mb-4"
        style={{ lineHeight: 1.1 }}
      >
        {title}
      </h2>
    )}

    {/* Content */}
    <div className="flex-1">{children}</div>

    {/* Footer */}
    <div
      className="text-[9px] text-text-secondary"
      style={{
        position: 'absolute',
        bottom: '8mm',
        left: '18mm',
        right: '18mm',
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '4px',
      }}
    >
      <span>Physical Availability Dashboard | Muhimma Digital Platform</span>
      <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
  </section>
);

export default ReportPage;
