import React from 'react';

const CoverSection = ({ focusedBrand, activeSegment }) => (
  <section
    className="bg-white flex flex-col items-center justify-center text-center"
    style={{
      width: '297mm',
      height: '210mm',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Orange accent bar */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: '#F36B1F',
      }}
    />

    {/* Content */}
    <div style={{ maxWidth: '600px' }}>
      <p
        className="text-text-secondary font-medium uppercase tracking-widest mb-4"
        style={{ fontSize: '12px', letterSpacing: '4px' }}
      >
        Muhimma Digital Platform
      </p>

      <h1
        className="font-display text-text-primary mb-3"
        style={{ fontSize: '56px', lineHeight: 1.05 }}
      >
        Physical Availability
        <br />
        Report
      </h1>

      <div
        className="mx-auto mb-6"
        style={{ width: '60px', height: '4px', background: '#F36B1F', borderRadius: '2px' }}
      />

      <p
        className="font-display mb-2"
        style={{ fontSize: '32px', color: '#F36B1F', lineHeight: 1.1 }}
      >
        {focusedBrand || 'All Brands'}
      </p>

      <p className="text-text-secondary text-sm mb-1">
        Segment: <span className="font-semibold text-text-primary">{activeSegment || 'Total'}</span>
      </p>

      <p className="text-text-secondary text-sm">
        Generated:{' '}
        <span className="font-semibold text-text-primary">
          {new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </p>
    </div>

    {/* Bottom branding */}
    <div
      className="text-text-secondary"
      style={{
        position: 'absolute',
        bottom: '12mm',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '10px',
      }}
    >
      Physical Availability Dashboard | Muhimma Digital Platform
    </div>
  </section>
);

export default CoverSection;
