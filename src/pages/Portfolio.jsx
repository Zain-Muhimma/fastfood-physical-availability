import { useState, useEffect, useMemo } from 'react';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import { useViewMode } from '../components/ViewModeContext.jsx';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ORANGE = '#F36B1F';
const GREY = '#D1D5DB';

const PO_METRICS = [
  'PO1_varietyPerception',
  'PO2_innovationPerception',
  'PO3_tasteQuality',
  'PO4_healthOptionBreadth',
  'PO5_priceAccessibility',
  'PO6_portfolioDistinctiveness',
];

// Subset for the radar (5-axis: Taste, Price, Variety, Health, Innovation)
const RADAR_KEYS = [
  { key: 'PO3_tasteQuality', axis: 'Taste' },
  { key: 'PO5_priceAccessibility', axis: 'Price' },
  { key: 'PO1_varietyPerception', axis: 'Variety' },
  { key: 'PO4_healthOptionBreadth', axis: 'Health' },
  { key: 'PO2_innovationPerception', axis: 'Innovation' },
];

/* ───────── Heatmap cell color ───────── */
const heatColor = (v) => {
  if (v > 0.3) return 'bg-green-200 text-green-900';
  if (v > 0.15) return 'bg-yellow-200 text-yellow-900';
  if (v > 0.05) return 'bg-orange-200 text-orange-900';
  return 'bg-gray-100 text-gray-500';
};

/* ───────── Metric bar card (reusable) ───────── */
const MetricBarCard = ({ metricKey, allMetrics, brandNames, focusedBrand, index }) => {
  const def = METRIC_DEFS[metricKey];

  const sorted = [...brandNames].sort(
    (a, b) =>
      (allMetrics[b]?.portfolio?.[metricKey] || 0) -
      (allMetrics[a]?.portfolio?.[metricKey] || 0),
  );

  const values = brandNames.map((b) => allMetrics[b]?.portfolio?.[metricKey] || 0);
  const maxVal = Math.max(0.01, ...values);

  return (
    <div
      className="bg-card rounded-card p-5 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <h3 className="font-display text-base text-text-primary tracking-wide">{def.label}</h3>
      <p className="text-[10px] text-text-secondary mb-3">{def.desc}</p>

      <div className="space-y-1.5">
        {sorted.map((brand) => {
          const val = allMetrics[brand]?.portfolio?.[metricKey] || 0;
          const isFocused = brand === focusedBrand;
          const pct = (val / maxVal) * 100;

          return (
            <div key={brand} className="flex items-center gap-2 text-[11px]">
              <span
                className={`w-20 text-right truncate ${
                  isFocused ? 'font-bold text-orange-primary' : 'text-text-secondary'
                }`}
              >
                {brand}
              </span>
              <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isFocused ? ORANGE : GREY,
                  }}
                />
              </div>
              <span className={`w-14 text-right tabular-nums ${isFocused ? 'font-bold' : ''}`}>
                {fmtMetric(val, def.format)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────── PAGE ───────── */
const Portfolio = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader, setFocusedBrand } = useFilters();
  const { loading } = useData();
  const { setCurrentGuide } = useGuide();
  const [view, setView] = useState('overview');

  useEffect(() => {
    setCurrentGuide({ sections: guides['/portfolio'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/portfolio',
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

  const fb = focusedBrand || brandNames[0];

  const ranked = useMemo(() => {
    if (!allMetrics || brandNames.length === 0) return [];
    return [...brandNames].sort(
      (a, b) => (allMetrics[b]?.portfolio?.score || 0) - (allMetrics[a]?.portfolio?.score || 0),
    );
  }, [allMetrics, brandNames]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!allMetrics || !fb || !leader) return [];
    const fbPortfolio = allMetrics[fb]?.portfolio || {};
    const leaderPortfolio = allMetrics[leader]?.portfolio || {};
    return RADAR_KEYS.map(({ key, axis }) => ({
      axis,
      [fb]: parseFloat(((fbPortfolio[key] || 0) * 100).toFixed(1)),
      [leader]: parseFloat(((leaderPortfolio[key] || 0) * 100).toFixed(1)),
    }));
  }, [allMetrics, fb, leader]);

  if (loading || !allMetrics) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  const fbData = allMetrics[fb]?.portfolio || {};
  const fbRank = ranked.indexOf(fb) + 1;
  const leaderData = allMetrics[leader]?.portfolio || {};

  /* ─── OVERVIEW ─── */
  if (view === 'overview') {
    return (
      <div className="p-6 min-h-[calc(100vh-155px)]">
        <div className="flex flex-col flex-shrink-0 mb-3">
          <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">
            Portfolio
          </h1>
          <p className="text-[11px] text-text-secondary font-medium mt-1">
            Product range perception across taste, price, variety, health and innovation
          </p>
          <div className="mt-2"><PageViewModeFallback /></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {PO_METRICS.map((key, i) => (
            <MetricBarCard
              key={key}
              metricKey={key}
              allMetrics={allMetrics}
              brandNames={brandNames}
              focusedBrand={fb}
              index={i}
            />
          ))}
        </div>

        {/* Radar chart */}
        <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '380ms' }}>
          <h3 className="font-display text-base text-text-primary tracking-wide mb-2">
            Portfolio Profile: {fb} vs {leader}
            {fb === leader && ' (Leader)'}
          </h3>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} />
              <Radar
                name={fb}
                dataKey={fb}
                stroke={ORANGE}
                fill={ORANGE}
                fillOpacity={0.25}
                strokeWidth={2}
              />
              {fb !== leader && (
                <Radar
                  name={leader}
                  dataKey={leader}
                  stroke="#6B7280"
                  fill="#6B7280"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  /* ─── COMPARISON (Heatmap table) ─── */
  if (view === 'comparison') {
    return (
      <div className="p-6 min-h-[calc(100vh-155px)]">
        <div className="flex flex-col flex-shrink-0 mb-3">
          <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">
            Portfolio
          </h1>
          <p className="text-[11px] text-text-secondary font-medium mt-1">
            Heatmap comparison of portfolio attributes across brands
          </p>
          <div className="mt-2"><PageViewModeFallback /></div>
        </div>

        <div className="bg-card rounded-card p-5 animate-slide-up">
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-green-200" /> &gt;30%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-yellow-200" /> 15-30%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-orange-200" /> 5-15%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-gray-100" /> &lt;5%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3">Rank</th>
                  <th className="text-left py-2 px-3">Brand</th>
                  {PO_METRICS.map((key) => (
                    <th key={key} className="text-center py-2 px-3">
                      {METRIC_DEFS[key].short}
                    </th>
                  ))}
                  <th className="text-right py-2 px-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((brand, i) => {
                  const port = allMetrics[brand]?.portfolio || {};
                  const isFocused = brand === fb;
                  return (
                    <tr
                      key={brand}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isFocused ? 'ring-1 ring-orange-primary' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setFocusedBrand(brand)}
                    >
                      <td className="py-2 px-3">{i + 1}</td>
                      <td
                        className={`py-2 px-3 font-medium ${
                          isFocused ? 'text-orange-primary' : ''
                        }`}
                      >
                        {brand}
                      </td>
                      {PO_METRICS.map((key) => {
                        const val = port[key] || 0;
                        return (
                          <td key={key} className="py-1.5 px-2 text-center">
                            <span
                              className={`inline-block px-2 py-1 rounded text-[11px] tabular-nums font-medium ${heatColor(val)}`}
                            >
                              {fmtMetric(val, 'pct')}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right tabular-nums font-semibold">
                        {fmtMetric(port.score || 0, 'pct')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ─── DEEP-DIVE ─── */
  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">
          Portfolio
        </h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">
          Deep-dive analysis for {fb}
        </p>
        <div className="mt-2"><PageViewModeFallback /></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Focused brand profile */}
        <div className="bg-card rounded-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center">
              <span className="font-display text-xl text-orange-primary">{fb?.[0]}</span>
            </div>
            {fbRank <= 3 && <span className="text-orange-primary text-xl">&#9733;</span>}
          </div>
          <h2 className="font-display text-2xl text-text-primary">{fb}</h2>
          <p className="text-[11px] text-text-secondary mb-4">
            Rank #{fbRank} of {brandNames.length}
          </p>

          <div className="text-center py-4 bg-orange-50 rounded-card mb-4">
            <p className="font-display text-[48px] text-orange-primary">
              {fmtMetric(fbData.score || 0, 'pct')}
            </p>
            <p className="text-[11px] text-text-secondary">Portfolio Score</p>
          </div>

          <div className="space-y-3">
            {PO_METRICS.map((key) => {
              const def = METRIC_DEFS[key];
              const val = fbData[key] || 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-text-secondary">{def.short}</span>
                    <span className="font-semibold">{fmtMetric(val, def.format)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val * 100}%`,
                        backgroundColor: ORANGE,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gap analysis vs leader */}
        <div className="bg-card rounded-card p-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h3 className="font-display text-lg text-text-primary mb-4">
            Gap Analysis vs {leader}
          </h3>

          {fb === leader ? (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-[12px] text-green-800 font-medium">
                {fb} is the category leader in portfolio with a score of{' '}
                {fmtMetric(fbData.score || 0, 'pct')}.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <p className="text-[12px] text-orange-800 font-medium">
                {fb} trails {leader} by{' '}
                {fmtMetric((leaderData.score || 0) - (fbData.score || 0), 'pct')} overall.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {PO_METRICS.map((key) => {
              const def = METRIC_DEFS[key];
              const fbVal = fbData[key] || 0;
              const ldrVal = leaderData[key] || 0;
              const gap = fbVal - ldrVal;
              const isPositive = gap >= 0;

              return (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-text-secondary">{def.short}</span>
                    <span
                      className={`font-semibold ${
                        isPositive ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {(gap * 100).toFixed(1)}pp
                    </span>
                  </div>
                  {/* Stacked comparison bars */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-text-secondary w-10 text-right">{fb}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${fbVal * 100}%`, backgroundColor: ORANGE }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-text-secondary w-10 text-right">{leader}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${ldrVal * 100}%`, backgroundColor: '#6B7280' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking sidebar + insight */}
        <div className="space-y-4">
          <div className="bg-card rounded-card p-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <h3 className="font-display text-lg text-text-primary mb-4">Brand Ranking</h3>
            <div className="space-y-2">
              {ranked.map((brand, i) => (
                <button
                  key={brand}
                  onClick={() => setFocusedBrand(brand)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-colors ${
                    brand === fb
                      ? 'bg-orange-primary text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-text-primary'
                  }`}
                >
                  <span>#{i + 1} {brand}</span>
                  <span className="font-semibold">
                    {fmtMetric(allMetrics[brand]?.portfolio?.score || 0, 'pct')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-card p-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
            <h3 className="font-display text-lg text-text-primary mb-3">Key Insight</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {(() => {
                const best = PO_METRICS.reduce((a, b) =>
                  (fbData[a] || 0) > (fbData[b] || 0) ? a : b,
                );
                const worst = PO_METRICS.reduce((a, b) =>
                  (fbData[a] || 0) < (fbData[b] || 0) ? a : b,
                );
                return `${fb}'s strongest portfolio attribute is ${METRIC_DEFS[best].label} (${fmtMetric(
                  fbData[best] || 0,
                  METRIC_DEFS[best].format,
                )}), while ${METRIC_DEFS[worst].label} (${fmtMetric(
                  fbData[worst] || 0,
                  METRIC_DEFS[worst].format,
                )}) is the most significant gap. Improving this dimension could lift the overall portfolio score by up to ${(
                  ((fbData[best] || 0) - (fbData[worst] || 0)) / 6 * 100
                ).toFixed(1)}pp.`;
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
