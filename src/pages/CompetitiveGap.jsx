import { useState, useEffect, useMemo } from 'react';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import { useViewMode } from '../components/ViewModeContext.jsx';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';

const ORANGE = '#F36B1F';

const DIMENSIONS = [
  { key: 'presence', label: 'Presence', color: '#F36B1F' },
  { key: 'prominence', label: 'Prominence', color: '#1565C0' },
  { key: 'portfolio', label: 'Portfolio', color: '#2E7D32' },
];

const metricKeys = Object.keys(METRIC_DEFS);

const getMetricValue = (allMetrics, brand, key) => {
  const dim = METRIC_DEFS[key].dim;
  return allMetrics[brand]?.[dim]?.[key] ?? 0;
};

const overallScore = (m) => (m.presence.score + m.prominence.score + m.portfolio.score) / 3;

const CompetitiveGap = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader } = useFilters();
  const { loading } = useData();
  const { setCurrentGuide } = useGuide();
  const [view, setView] = useState('overview');

  useEffect(() => {
    setCurrentGuide({ sections: guides['/competitive'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/competitive',
      modes: [
        { key: 'overview', label: 'Overview' },
        { key: 'comparison', label: 'Comparison' },
        { key: 'deepdive', label: 'Deep-Dive' },
      ],
      current: view,
      onChange: (key) => setView(key),
    });
    return () => setViewMode(null);
  }, [setViewMode, view]);

  const brands = useMemo(() => {
    if (!allMetrics) return [];
    return Object.keys(allMetrics).sort((a, b) => a.localeCompare(b));
  }, [allMetrics]);

  const fb = focusedBrand || brands[0];

  const rankedBrands = useMemo(() => {
    if (!allMetrics) return [];
    return [...brands].sort((a, b) => overallScore(allMetrics[b]) - overallScore(allMetrics[a]));
  }, [allMetrics, brands]);

  // Precompute column min/max ranks for conditional coloring
  const columnRanks = useMemo(() => {
    if (!allMetrics || brands.length === 0) return {};
    const ranks = {};
    metricKeys.forEach((key) => {
      const def = METRIC_DEFS[key];
      const values = brands.map((b) => getMetricValue(allMetrics, b, key));
      // For inverted metrics (Friction Rate), lower is better → sort ascending for top3
      const sorted = def?.invert
        ? [...values].sort((a, b) => a - b)
        : [...values].sort((a, b) => b - a);
      const top3 = sorted.slice(0, 3);
      const bottom3 = sorted.slice(-3);
      ranks[key] = { top3: new Set(top3), bottom3: new Set(bottom3) };
    });
    return ranks;
  }, [allMetrics, brands]);

  if (loading || !allMetrics) {
    return <div className="p-6"><p className="text-text-secondary">Loading...</p></div>;
  }

  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Competitive Gap Analysis</h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">Identify gaps and advantages versus competition</p>
        <div className="mt-2"><PageViewModeFallback /></div>
      </div>

      {/* ── OVERVIEW ── */}
      {view === 'overview' && (
        <div className="space-y-6">
          {/* Gap Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {DIMENSIONS.map((dim, i) => {
              const fbScore = allMetrics[fb]?.[dim.key]?.score ?? 0;
              const leaderScore = allMetrics[leader]?.[dim.key]?.score ?? 0;
              const gap = fbScore - leaderScore;
              const isPositive = gap >= 0;
              return (
                <div
                  key={dim.key}
                  className="bg-card rounded-card p-5 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-xl text-text-primary tracking-wide">{dim.label}</h3>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dim.color }}
                    />
                  </div>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{fb}</span>
                      <span className="font-semibold text-text-primary">{(fbScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{leader} (Leader)</span>
                      <span className="font-semibold text-text-primary">{(leaderScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-text-secondary font-medium">Gap</span>
                      <span className={`font-display text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{(gap * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Brand Ranking */}
          <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '240ms' }}>
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">Brand Ranking by Overall PA Score</h3>
            <div className="space-y-2">
              {rankedBrands.map((brand, i) => {
                const score = overallScore(allMetrics[brand]) * 100;
                const maxScore = overallScore(allMetrics[rankedBrands[0]]) * 100;
                const isFocused = brand === fb;
                return (
                  <div
                    key={brand}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] ${isFocused ? 'bg-orange-light' : 'bg-gray-50'}`}
                  >
                    <span className="w-6 text-text-secondary font-semibold">#{i + 1}</span>
                    <span className={`w-28 truncate ${isFocused ? 'text-orange-primary font-semibold' : 'text-text-primary'}`}>{brand}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(score / maxScore) * 100}%`,
                          backgroundColor: isFocused ? ORANGE : '#D1D5DB',
                        }}
                      />
                    </div>
                    <span className="w-14 text-right font-semibold text-text-primary">{score.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPARISON ── */}
      {view === 'comparison' && (
        <div className="bg-card rounded-card p-5 animate-slide-up overflow-x-auto">
          <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">Full Metric Comparison</h3>
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-2 sticky left-0 bg-card z-10 min-w-[100px]">Brand</th>
                {metricKeys.map((key) => (
                  <th key={key} className="text-center py-2 px-1 min-w-[70px]">
                    <span className="block text-[10px] text-text-secondary">{METRIC_DEFS[key].short}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => {
                const isFocused = brand === fb;
                return (
                  <tr key={brand} className={`border-b border-gray-100 ${isFocused ? 'bg-orange-light font-semibold' : ''}`}>
                    <td className={`py-2 px-2 sticky left-0 z-10 ${isFocused ? 'bg-orange-light text-orange-primary' : 'bg-card text-text-primary'}`}>
                      {brand}
                    </td>
                    {metricKeys.map((key) => {
                      const val = getMetricValue(allMetrics, brand, key);
                      const { top3, bottom3 } = columnRanks[key] || {};
                      let cellBg = '';
                      if (top3?.has(val)) cellBg = 'bg-green-100';
                      else if (bottom3?.has(val)) cellBg = 'bg-red-100';
                      return (
                        <td key={key} className={`py-2 px-1 text-center ${cellBg}`}>
                          {fmtMetric(val, METRIC_DEFS[key].format)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DEEP-DIVE ── */}
      {view === 'deepdive' && (
        <div className="space-y-6">
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: ORANGE }} />
                <span className="text-[12px] font-semibold text-text-primary">{fb}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400" />
                <span className="text-[12px] font-semibold text-text-primary">{leader} (Leader)</span>
              </div>
            </div>

            {DIMENSIONS.map((dim) => {
              const dimMetrics = metricKeys.filter((k) => METRIC_DEFS[k].dim === dim.key);
              return (
                <div key={dim.key} className="mb-8 last:mb-0">
                  <h4 className="font-display text-lg text-text-primary tracking-wide mb-3 border-b border-gray-200 pb-1">{dim.label}</h4>
                  <div className="space-y-3">
                    {dimMetrics.map((key) => {
                      const fbVal = getMetricValue(allMetrics, fb, key);
                      const leaderVal = getMetricValue(allMetrics, leader, key);
                      const maxVal = Math.max(Math.abs(fbVal), Math.abs(leaderVal), 0.01);
                      const fmt = METRIC_DEFS[key].format;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-32 text-[11px] text-text-secondary truncate" title={METRIC_DEFS[key].label}>
                            {METRIC_DEFS[key].label}
                          </span>
                          <div className="flex-1 space-y-1">
                            {/* Focused brand bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max((Math.abs(fbVal) / maxVal) * 100, 2)}%`,
                                    backgroundColor: ORANGE,
                                  }}
                                />
                              </div>
                              <span className="w-16 text-[11px] text-right font-semibold text-text-primary">{fmtMetric(fbVal, fmt)}</span>
                            </div>
                            {/* Leader bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gray-400"
                                  style={{
                                    width: `${Math.max((Math.abs(leaderVal) / maxVal) * 100, 2)}%`,
                                  }}
                                />
                              </div>
                              <span className="w-16 text-[11px] text-right font-semibold text-text-primary">{fmtMetric(leaderVal, fmt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitiveGap;
