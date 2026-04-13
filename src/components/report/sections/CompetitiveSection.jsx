import React from 'react';
import ReportPage from '../ReportPage.jsx';
import ReportHeroKPI from '../ReportHeroKPI.jsx';
import ReportBrandTable from '../ReportBrandTable.jsx';
import { fmtMetric } from '../../../data/metrics.js';

const DIMS = ['presence', 'prominence', 'portfolio'];

const CompetitiveSection = ({ allMetrics, focusedBrand, brandNames, leader }) => {
  if (!allMetrics || !focusedBrand) return null;

  const brandData = allMetrics[focusedBrand];
  const leaderData = allMetrics[leader];
  if (!brandData || !leaderData) return null;

  // Overall scores
  const brandOverall = DIMS.reduce((s, d) => s + (brandData[d]?.score || 0), 0) / 3;
  const leaderOverall = DIMS.reduce((s, d) => s + (leaderData[d]?.score || 0), 0) / 3;

  return (
    <ReportPage title="Competitive Overview">
      {/* Gap vs Leader */}
      <div className="mb-4">
        <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-2">
          Gap vs Leader ({leader}) by Dimension
        </p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          {DIMS.map((dim) => {
            const bScore = brandData[dim]?.score || 0;
            const lScore = leaderData[dim]?.score || 0;
            const gap = bScore - lScore;
            const isLeader = focusedBrand === leader;
            return (
              <ReportHeroKPI
                key={dim}
                label={`${dim.charAt(0).toUpperCase() + dim.slice(1)} Gap`}
                value={isLeader ? 'Leader' : `${gap >= 0 ? '+' : ''}${(gap * 100).toFixed(1)}pp`}
                subtitle={`${focusedBrand}: ${fmtMetric(bScore, 'pct')}`}
                color={isLeader ? '#2E7D32' : gap >= 0 ? '#2E7D32' : '#C62828'}
              />
            );
          })}
          <ReportHeroKPI
            label="Overall Gap"
            value={
              focusedBrand === leader
                ? 'Leader'
                : `${brandOverall - leaderOverall >= 0 ? '+' : ''}${((brandOverall - leaderOverall) * 100).toFixed(1)}pp`
            }
            subtitle={`Overall: ${fmtMetric(brandOverall, 'pct')}`}
            color={focusedBrand === leader ? '#2E7D32' : brandOverall >= leaderOverall ? '#2E7D32' : '#C62828'}
          />
        </div>
      </div>

      {/* Full 10 brands x 18 metrics table */}
      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-2">
        Full Brand Comparison (All Metrics)
      </p>
      <ReportBrandTable
        allMetrics={allMetrics}
        brandNames={brandNames}
        focusedBrand={focusedBrand}
        dimension="all"
      />
    </ReportPage>
  );
};

export default CompetitiveSection;
