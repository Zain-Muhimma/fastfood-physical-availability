import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useFilters, useData } from '../data/dataLoader.jsx';
import CoverSection from '../components/report/sections/CoverSection.jsx';
import PresenceSection from '../components/report/sections/PresenceSection.jsx';
import ProminenceSection from '../components/report/sections/ProminenceSection.jsx';
import PortfolioSection from '../components/report/sections/PortfolioSection.jsx';
import CompetitiveSection from '../components/report/sections/CompetitiveSection.jsx';

const printStyles = `
@media print {
  @page { size: A4 landscape; margin: 10mm 15mm; }
  .no-print { display: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const Report = () => {
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope') || 'summary';

  const { allMetrics, focusedBrand, brandNames, leader, activeSegment } = useFilters();
  const { data, loading } = useData();

  if (loading || !allMetrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-secondary text-sm">Loading report data...</p>
      </div>
    );
  }

  const isFull = scope === 'full';

  return (
    <>
      <style>{printStyles}</style>

      {/* Control Bar (hidden in print) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#F7F6F4',
          borderBottom: '1px solid #E5E7EB',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Link
          to="/"
          className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
          style={{ color: '#F36B1F', border: '1px solid #F36B1F' }}
        >
          Back to Dashboard
        </Link>

        <button
          onClick={() => window.print()}
          className="text-sm font-medium px-4 py-2 rounded-full text-white transition-colors"
          style={{ background: '#F36B1F' }}
        >
          Save as PDF
        </button>

        <span className="text-[11px] text-text-secondary ml-auto">
          Scope: <span className="font-semibold capitalize">{scope}</span>
          {' | '}Brand: <span className="font-semibold">{focusedBrand}</span>
        </span>
      </div>

      {/* Report Content */}
      <div
        style={{
          background: '#E5E7EB',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '16px 0',
        }}
      >
        <CoverSection focusedBrand={focusedBrand} activeSegment={activeSegment} />

        {isFull && (
          <>
            <PresenceSection
              allMetrics={allMetrics}
              focusedBrand={focusedBrand}
              brandNames={brandNames}
              leader={leader}
            />
            <ProminenceSection
              allMetrics={allMetrics}
              focusedBrand={focusedBrand}
              brandNames={brandNames}
              leader={leader}
            />
            <PortfolioSection
              allMetrics={allMetrics}
              focusedBrand={focusedBrand}
              brandNames={brandNames}
              leader={leader}
            />
            <CompetitiveSection
              allMetrics={allMetrics}
              focusedBrand={focusedBrand}
              brandNames={brandNames}
              leader={leader}
            />
          </>
        )}
      </div>
    </>
  );
};

export default Report;
