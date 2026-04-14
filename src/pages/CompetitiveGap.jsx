import { useState, useEffect, useMemo } from 'react';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import { useViewMode } from '../components/ViewModeContext.jsx';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';

import ExpandableCard from '../components/ExpandableCard.jsx';

const ORANGE = '#F36B1F';

const DIMENSIONS = [
  { key: 'presence', label: 'Presence', color: '#F36B1F' },
  { key: 'prominence', label: 'Prominence', color: '#FDB55B' },
  { key: 'portfolio', label: 'Portfolio', color: '#707070' },
];

const metricKeys = Object.keys(METRIC_DEFS);

const getMetricValue = (allMetrics, brand, key) => {
  const dim = METRIC_DEFS[key].dim;
  return allMetrics[brand]?.[dim]?.[key] ?? 0;
};

const presenceRankScore = (m) => m.presence.score;

const CompetitiveGap = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, setFocusedBrand, brandNames, allMetrics, leader } = useFilters();
  const { data, loading } = useData();
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
    return [...brands].sort((a, b) => presenceRankScore(allMetrics[b]) - presenceRankScore(allMetrics[a]));
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
          <ExpandableCard title="Brand Ranking by Physical Availability">
          <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '240ms' }}>
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">Brand Ranking by Physical Availability</h3>
            {/* Legend */}
            <div className="flex gap-4 mb-3 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: '#F36B1F' }} />Presence</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: '#FDB55B' }} />Prominence</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: '#707070' }} />Portfolio</span>
            </div>
            <div className="space-y-3">
              {rankedBrands.map((brand, i) => {
                const m = allMetrics[brand];
                const presence = (m?.presence?.score ?? 0) * 100;
                const prominence = (m?.prominence?.score ?? 0) * 100;
                const portfolio = (m?.portfolio?.score ?? 0) * 100;
                const isFocused = brand === fb;
                return (
                  <div
                    key={brand}
                    className={`px-3 py-2 rounded-lg text-[12px] ${isFocused ? 'bg-orange-light' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-6 text-text-secondary font-semibold">#{i + 1}</span>
                      <span className={`w-28 truncate ${isFocused ? 'text-orange-primary font-semibold' : 'text-text-primary'}`}>{brand}</span>
                    </div>
                    <div className="ml-9 space-y-1">
                      {[
                        { label: 'Presence', val: presence, color: '#F36B1F' },
                        { label: 'Prominence', val: prominence, color: '#FDB55B' },
                        { label: 'Portfolio', val: portfolio, color: '#707070' },
                      ].map(d => (
                        <div key={d.label} className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${d.val}%`, backgroundColor: d.color, opacity: isFocused ? 1 : 0.5 }} />
                          </div>
                          <span className="text-[10px] text-text-secondary w-10 text-right">{d.val.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </ExpandableCard>
        </div>
      )}

      {/* ── COMPARISON ── */}
      {view === 'comparison' && (
        <ExpandableCard title="Full Metric Comparison">
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
        </ExpandableCard>
      )}

      {/* ── DEEP-DIVE ── */}
      {view === 'deepdive' && (() => {
        const fbRank = rankedBrands.indexOf(fb) + 1;
        const leaderBrand = rankedBrands[0];
        const fbLogo = data?.brands?.find(b => b.name === fb)?.logo;
        const leaderLogo = data?.brands?.find(b => b.name === leaderBrand)?.logo;
        const fbOverall = presenceRankScore(allMetrics[fb]) * 100;
        const leaderOverall = presenceRankScore(allMetrics[leaderBrand]) * 100;

        // Dimension gaps for EBI narrative
        const dimGaps = DIMENSIONS.map(dim => ({
          ...dim,
          fbScore: allMetrics[fb]?.[dim.key]?.score ?? 0,
          leaderScore: allMetrics[leaderBrand]?.[dim.key]?.score ?? 0,
          gap: (allMetrics[fb]?.[dim.key]?.score ?? 0) - (allMetrics[leaderBrand]?.[dim.key]?.score ?? 0),
        }));
        const sortedByGap = [...dimGaps].sort((a, b) => a.gap - b.gap);
        const biggestGap = sortedByGap[0];
        const closestDim = [...dimGaps].sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap))[0];

        return (
        <div className="space-y-6">
          {/* 1. Brand Cards side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Focused Brand Card */}
            <div className="bg-card rounded-card p-5 animate-slide-up flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-orange-50 overflow-hidden flex-shrink-0">
                {fbLogo ? (
                  <img src={fbLogo} alt={fb} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full bg-orange-light flex items-center justify-center">
                    <span className="font-display text-xl text-orange-primary">{fb?.[0]}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Focused Brand</p>
                <h3 className="font-display text-xl text-text-primary tracking-wide">{fb}</h3>
                <p className="text-[12px] text-text-secondary mt-1">Rank <span className="font-semibold text-text-primary">#{fbRank}</span></p>
              </div>
            </div>

            {/* Leader Card */}
            <div className="bg-card rounded-card p-5 animate-slide-up flex items-center gap-4 border border-gray-100 shadow-sm" style={{ animationDelay: '80ms' }}>
              <div className="w-14 h-14 rounded-full bg-gray-50 overflow-hidden flex-shrink-0">
                {leaderLogo ? (
                  <img src={leaderLogo} alt={leaderBrand} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="font-display text-xl text-gray-500">{leaderBrand?.[0]}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Market Leader</p>
                <h3 className="font-display text-xl text-text-primary tracking-wide">{leaderBrand}</h3>
                <p className="text-[12px] text-text-secondary mt-1">Rank <span className="font-semibold text-text-primary">#1</span></p>
              </div>
            </div>
          </div>

          {/* 2. EBI Strategic Actions */}
          <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <h3 className="font-display text-lg text-text-primary mb-3">EBI Strategic Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { badge: 'GAP', bg: 'bg-red-50', border: 'border-red-300', badgeBg: 'bg-red-500', title: `Biggest Gap: ${biggestGap.label}`, desc: `Biggest gap in ${biggestGap.label} at ${(Math.abs(biggestGap.gap) * 100).toFixed(1)}pp — concentrate distribution investment here first` },
                { badge: 'PARITY', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-500', title: `Closest: ${closestDim.label}`, desc: `Closest to leader on ${closestDim.label} — ${closestDim.gap >= 0 ? 'protect this advantage' : 'close the remaining ' + (Math.abs(closestDim.gap) * 100).toFixed(1) + 'pp gap'}` },
                { badge: 'DOUBLE J', bg: 'bg-amber-50', border: 'border-amber-300', badgeBg: 'bg-amber-500', title: 'Double Jeopardy', desc: `Per Double Jeopardy, ${fb} as a smaller brand has both fewer buyers and lower loyalty. Growth requires expanding physical availability to reach new category buyers, not deepening loyalty` },
                { badge: 'EBI', bg: 'bg-gray-50', border: 'border-gray-300', badgeBg: 'bg-gray-500', title: 'Core Principle', desc: 'Physical availability is the primary growth lever. Close distribution gaps before investing in advertising — mental availability without physical availability wastes marketing spend.' },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className={`${item.bg} border ${item.border} rounded-lg p-3 flex items-start gap-2`}>
                  <span className={`${item.badgeBg} text-white text-[8px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0`}>{item.badge}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-text-primary">{item.title}</p>
                    <p className="text-[10px] text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Dimension Gap Cards with per-metric paired bars */}
          {DIMENSIONS.map((dim, di) => {
            const dimMetrics = metricKeys.filter((k) => METRIC_DEFS[k].dim === dim.key);
            const fbDimScore = allMetrics[fb]?.[dim.key]?.score ?? 0;
            const leaderDimScore = allMetrics[leaderBrand]?.[dim.key]?.score ?? 0;
            const dimGap = fbDimScore - leaderDimScore;
            return (
              <ExpandableCard key={dim.key} title={`${dim.label} Gap — ${fb} vs ${leaderBrand}`}>
              <div
                className="bg-card rounded-card p-5 animate-slide-up"
                style={{ animationDelay: `${(di + 2) * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dim.color }} />
                    <h4 className="font-display text-lg text-text-primary tracking-wide">{dim.label}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="text-text-secondary">{fb}: <span className="font-semibold" style={{ color: ORANGE }}>{(fbDimScore * 100).toFixed(1)}%</span></span>
                    <span className="text-text-secondary">{leaderBrand}: <span className="font-semibold text-gray-600">{(leaderDimScore * 100).toFixed(1)}%</span></span>
                    <span className={`font-display text-sm ${dimGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Gap: {dimGap >= 0 ? '+' : ''}{(dimGap * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: ORANGE }} />
                    <span className="text-text-secondary">{fb}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-400" />
                    <span className="text-text-secondary">{leaderBrand}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {dimMetrics.map((key) => {
                    const fbVal = getMetricValue(allMetrics, fb, key);
                    const leaderVal = getMetricValue(allMetrics, leaderBrand, key);
                    const maxVal = Math.max(Math.abs(fbVal), Math.abs(leaderVal), 0.01);
                    const fmt = METRIC_DEFS[key].format;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-32 text-[11px] text-text-secondary truncate" title={METRIC_DEFS[key].label}>
                          {METRIC_DEFS[key].label}
                        </span>
                        <div className="flex-1 space-y-1">
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
              </ExpandableCard>
            );
          })}

        </div>
        );
      })()}
    </div>
  );
};

export default CompetitiveGap;
