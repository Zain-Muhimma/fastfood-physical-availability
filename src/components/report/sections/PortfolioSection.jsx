import React from 'react';
import ReportPage from '../ReportPage.jsx';
import ReportHeroKPI from '../ReportHeroKPI.jsx';
import ReportBrandTable from '../ReportBrandTable.jsx';
import { METRIC_DEFS, fmtMetric } from '../../../data/metrics.js';

const PORTFOLIO_KEYS = [
  'PO1_varietyPerception',
  'PO2_innovationPerception',
  'PO3_tasteQuality',
  'PO4_healthOptionBreadth',
  'PO5_priceAccessibility',
  'PO6_portfolioDistinctiveness',
];

const PortfolioSection = ({ allMetrics, focusedBrand, brandNames, leader }) => {
  if (!allMetrics || !focusedBrand) return null;

  const brandData = allMetrics[focusedBrand]?.portfolio;
  const leaderData = allMetrics[leader]?.portfolio;
  if (!brandData) return null;

  return (
    <ReportPage title="Portfolio Dimension">
      {/* KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {PORTFOLIO_KEYS.map((key) => {
          const def = METRIC_DEFS[key];
          const val = brandData[key];
          const leaderVal = leaderData?.[key];
          const delta = leaderVal !== undefined ? val - leaderVal : null;
          const deltaStr = delta !== null && leader !== focusedBrand
            ? `vs Leader: ${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}pp`
            : null;

          return (
            <ReportHeroKPI
              key={key}
              label={def.short}
              value={fmtMetric(val, def.format)}
              subtitle={deltaStr}
              color="#F36B1F"
            />
          );
        })}
      </div>

      {/* Dimension Score */}
      <div className="mb-3">
        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mr-2">
          Portfolio Score:
        </span>
        <span className="font-display text-[24px]" style={{ color: '#F36B1F' }}>
          {fmtMetric(brandData.score, 'pct')}
        </span>
        {leader && leader !== focusedBrand && (
          <span className="text-[9px] text-text-secondary ml-3">
            Leader ({leader}): {fmtMetric(leaderData?.score || 0, 'pct')}
          </span>
        )}
      </div>

      {/* Brand Ranking Table */}
      <ReportBrandTable
        allMetrics={allMetrics}
        brandNames={brandNames}
        focusedBrand={focusedBrand}
        dimension="portfolio"
      />
    </ReportPage>
  );
};

export default PortfolioSection;
