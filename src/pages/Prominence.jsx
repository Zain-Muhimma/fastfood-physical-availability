import { useState, useEffect, useMemo } from 'react';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import { useViewMode } from '../components/ViewModeContext.jsx';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import ExpandableCard from '../components/ExpandableCard.jsx';

const ORANGE = '#F36B1F';
const GREY = '#D1D5DB';

const PR_METRICS = [
  'PR1_impressionScore',
  'PR2_marketPresence',
  'PR3_adCutThrough',
];

/* ───────── Horizontal bar card (with diverging bars for PR5) ───────── */
const MetricBarCard = ({ metricKey, allMetrics, brandNames, focusedBrand, index }) => {
  const def = METRIC_DEFS[metricKey];
  const isDiverging = metricKey === 'PR5_netAdvocacy';

  const sorted = [...brandNames].sort(
    (a, b) =>
      (allMetrics[b]?.prominence?.[metricKey] || 0) -
      (allMetrics[a]?.prominence?.[metricKey] || 0),
  );

  // Determine scale
  const values = brandNames.map((b) => allMetrics[b]?.prominence?.[metricKey] || 0);
  const maxAbs = isDiverging
    ? Math.max(0.01, ...values.map(Math.abs))
    : Math.max(0.01, ...values);

  return (
    <ExpandableCard title={def.label}>
    <div
      className="bg-card rounded-card p-5 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <h3 className="font-display text-base text-text-primary tracking-wide">{def.label}</h3>
      <p className="text-[10px] text-text-secondary mb-3">{def.desc}</p>

      <div className="space-y-1.5">
        {sorted.map((brand) => {
          const val = allMetrics[brand]?.prominence?.[metricKey] || 0;
          const isFocused = brand === focusedBrand;

          if (isDiverging) {
            const pct = (Math.abs(val) / maxAbs) * 50;
            const isPos = val >= 0;
            return (
              <div key={brand} className="flex items-center gap-2 text-[11px]">
                <span className={`w-20 text-right truncate ${isFocused ? 'font-bold text-orange-primary' : 'text-text-secondary'}`}>
                  {brand}
                </span>
                <div className="flex-1 flex items-center h-4">
                  {/* left half (negative) */}
                  <div className="w-1/2 flex justify-end">
                    {!isPos && (
                      <div
                        className="h-3.5 rounded-l"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isFocused ? '#DC2626' : '#FCA5A5',
                        }}
                      />
                    )}
                  </div>
                  {/* center line */}
                  <div className="w-px h-full bg-gray-300" />
                  {/* right half (positive) */}
                  <div className="w-1/2">
                    {isPos && (
                      <div
                        className="h-3.5 rounded-r"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isFocused ? '#16A34A' : '#BBF7D0',
                        }}
                      />
                    )}
                  </div>
                </div>
                <span className={`w-14 text-right tabular-nums ${isFocused ? 'font-bold' : ''}`}>
                  {fmtMetric(val, 'net')}
                </span>
              </div>
            );
          }

          // Standard horizontal bar
          const pct = (val / maxAbs) * 100;
          return (
            <div key={brand} className="flex items-center gap-2 text-[11px]">
              <span className={`w-20 text-right truncate ${isFocused ? 'font-bold text-orange-primary' : 'text-text-secondary'}`}>
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
    </ExpandableCard>
  );
};

/* ───────── Helper to find option keys by prefix ───────── */
const findOpt = (opts, sub) => Object.keys(opts).find(k => k.toLowerCase().startsWith(sub.toLowerCase()));

/* ───────── Stacked horizontal bar chart (100%) ───────── */
const STACK_COLORS = { negative: '#DC2626', neutral: '#9CA3AF', positive: '#16A34A' };
const VFM_COLORS  = { overpriced: '#DC2626', expected: '#9CA3AF', good: '#16A34A' };

const StackedBarChart = ({ title, subtitle, dataByBrand, categoryMap, colorMap, focusedBrand, index }) => {
  // categoryMap: array of { key: substring to match, label, colorKey }
  return (
    <ExpandableCard title={title}>
    <div
      className="bg-card rounded-card p-5 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <h3 className="font-display text-base text-text-primary tracking-wide">{title}</h3>
      <p className="text-[10px] text-text-secondary mb-1">{subtitle}</p>
      {/* legend */}
      <div className="flex gap-4 mb-3">
        {categoryMap.map(c => (
          <div key={c.label} className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: colorMap[c.colorKey] }} />
            {c.label}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {dataByBrand.map(({ brand, segments }) => {
          const isFocused = brand === focusedBrand;
          const total = segments.reduce((s, v) => s + v.value, 0) || 1;
          return (
            <div key={brand} className="flex items-center gap-2 text-[11px]">
              <span className={`w-20 text-right truncate ${isFocused ? 'font-bold text-orange-primary' : 'text-text-secondary'}`}>
                {brand}
              </span>
              <div className="flex-1 flex h-4 rounded overflow-hidden bg-gray-100">
                {segments.map((seg, i) => {
                  const pct = (seg.value / total) * 100;
                  return (
                    <div
                      key={i}
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: seg.color,
                        opacity: isFocused ? 1 : 0.6,
                      }}
                      title={`${seg.label}: ${(pct).toFixed(1)}%`}
                    />
                  );
                })}
              </div>
              <span className={`w-14 text-right tabular-nums text-[10px] ${isFocused ? 'font-bold' : 'text-text-secondary'}`}>
                {/* show positive/good value pct */}
                {((segments[segments.length - 1]?.value || 0) / total * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ───────── Bubble Chart: Ad Recall vs Impression ───────── */
const BRAND_COLORS = [
  '#F36B1F', '#2563EB', '#16A34A', '#DC2626', '#9333EA',
  '#0891B2', '#CA8A04', '#DB2777', '#4F46E5', '#059669',
];

const BubbleChart = ({ allMetrics, brandNames, focusedBrand, index, data }) => {
  const chartData = useMemo(() => {
    const logoMap = {};
    data?.brands?.forEach(b => { logoMap[b.name] = b.logo; });
    return brandNames.map((brand) => {
      const prom = allMetrics[brand]?.prominence || {};
      return {
        brand,
        x: prom.PR3_adCutThrough || 0,
        y: prom.PR1_impressionScore || 0,
        logo: logoMap[brand],
        isFocused: brand === focusedBrand,
      };
    });
  }, [allMetrics, brandNames, focusedBrand, data]);

  const maxX = Math.max(...chartData.map(d => d.x), 0.01);
  const maxY = Math.max(...chartData.map(d => d.y), 0.01);
  const medianX = useMemo(() => {
    const xs = chartData.map(d => d.x).sort((a, b) => a - b);
    const mid = Math.floor(xs.length / 2);
    return xs.length % 2 !== 0 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
  }, [chartData]);
  const medianY = useMemo(() => {
    const ys = chartData.map(d => d.y).sort((a, b) => a - b);
    const mid = Math.floor(ys.length / 2);
    return ys.length % 2 !== 0 ? ys[mid] : (ys[mid - 1] + ys[mid]) / 2;
  }, [chartData]);

  const W = 100; // percentage-based positioning
  const H = 100;

  const focusedPoint = chartData.find(d => d.brand === focusedBrand);
  const insightText = useMemo(() => {
    if (!focusedPoint) return '';
    const highX = focusedPoint.x > medianX;
    const highY = focusedPoint.y > medianY;
    if (highX && highY) return 'Strong advertising effectiveness — ads are noticed AND building positive impression. Per EBI, this refreshes memory structures effectively.';
    if (highX && !highY) return 'Advertising noticed but not building positive perception — review creative strategy. Per EBI, ads should build distinctive brand assets, not just awareness.';
    if (!highX && highY) return 'Organically prominent — brand stands out without heavy ad spend. This is the strongest position per EBI — earned salience through distinctive assets.';
    return 'Low visibility — increase advertising reach to all category buyers. Per EBI, broad reach advertising refreshes memory structures.';
  }, [focusedPoint, medianX, medianY]);

  return (
    <ExpandableCard title="Ad Recall vs Impression">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: `${index * 60}ms` }}>
        <h3 className="font-display text-base text-text-primary tracking-wide mb-1">Ad Recall vs Impression</h3>
        <p className="text-[10px] text-text-secondary mb-3">
          X = Ad Cut-Through | Y = Positive Standout | Logo = Brand
        </p>
        <div className="relative border border-gray-200 rounded-lg bg-gray-50" style={{ height: 380, overflow: 'hidden' }}>
          {/* Axis labels */}
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-text-secondary">Ad Cut-Through →</span>
          <span className="absolute top-1/2 left-1 -translate-y-1/2 text-[9px] text-text-secondary" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}>Positive Standout →</span>
          {/* Median lines */}
          <div className="absolute border-l border-dashed border-gray-300" style={{ left: `${(medianX / maxX) * 90 + 5}%`, top: 0, bottom: 0 }} />
          <div className="absolute border-t border-dashed border-gray-300" style={{ top: `${(1 - medianY / maxY) * 90 + 5}%`, left: 0, right: 0 }} />
          {/* X-axis ticks */}
          {[0, 0.25, 0.5, 0.75].filter(v => v <= maxX).map(v => (
            <span key={`x${v}`} className="absolute text-[8px] text-gray-400" style={{ left: `${(v / maxX) * 90 + 5}%`, bottom: 14 }}>{(v * 100).toFixed(0)}%</span>
          ))}
          {/* Y-axis ticks */}
          {[0, 0.25, 0.5, 0.75].filter(v => v <= maxY).map(v => (
            <span key={`y${v}`} className="absolute text-[8px] text-gray-400" style={{ top: `${(1 - v / maxY) * 90 + 5}%`, left: 14 }}>{(v * 100).toFixed(0)}%</span>
          ))}
          {/* Brand logos as dots */}
          {chartData.map(d => {
            const xPct = (d.x / maxX) * 90 + 5;
            const yPct = (1 - d.y / maxY) * 90 + 5;
            return (
              <div
                key={d.brand}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white overflow-hidden border-2 transition-all ${
                  d.isFocused ? 'border-orange-primary shadow-lg z-10 w-12 h-12' : 'border-gray-200 w-9 h-9 opacity-80 hover:opacity-100 hover:scale-110'
                }`}
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                title={`${d.brand}: Ad ${(d.x * 100).toFixed(1)}%, Impression ${(d.y * 100).toFixed(1)}%`}
              >
                {d.logo ? (
                  <img src={d.logo} alt={d.brand} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-gray-500">{d.brand[0]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Insight Panel */}
      <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: `${index * 60 + 50}ms` }}>
        <h3 className="font-display text-base text-text-primary mb-3">Insight: {focusedBrand}</h3>
        <div className="space-y-3 text-[12px] text-text-secondary leading-relaxed">
          <p>{insightText}</p>
          {focusedPoint && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span>Ad Cut-Through</span>
                <span className="font-semibold text-text-primary">{(focusedPoint.x * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Positive Standout</span>
                <span className="font-semibold text-text-primary">{(focusedPoint.y * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Median Ad Cut-Through</span>
                <span className="font-semibold text-text-primary">{(medianX * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Median Standout</span>
                <span className="font-semibold text-text-primary">{(medianY * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ───────── PAGE ───────── */
const Prominence = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader, setFocusedBrand, activeSegment } = useFilters();
  const { data, loading } = useData();
  const { setCurrentGuide } = useGuide();
  const [view, setView] = useState('overview');

  useEffect(() => {
    setCurrentGuide({ sections: guides['/prominence'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/prominence',
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

  // Ranking by prominence score
  const ranked = useMemo(() => {
    if (!allMetrics || brandNames.length === 0) return [];
    return [...brandNames].sort(
      (a, b) => (allMetrics[b]?.prominence?.score || 0) - (allMetrics[a]?.prominence?.score || 0),
    );
  }, [allMetrics, brandNames]);

  const seg = activeSegment || 'Total';

  // Q19 Impression Distribution (Negative / Neutral / Positive) — used in deep-dive
  const q19Stacked = useMemo(() => {
    if (!data?.paData?.q19 || !allMetrics) return [];
    return brandNames.map(brand => {
      const opts = data.paData.q19?.[brand]?.options || {};
      const negKey = findOpt(opts, 'Negative');
      const neuKey = findOpt(opts, 'Neutral');
      const posKey = findOpt(opts, 'Positive');
      const getV = (k) => {
        if (!k || !opts[k]) return 0;
        return typeof opts[k] === 'number' ? opts[k] : (opts[k]?.[seg] || 0);
      };
      return {
        brand,
        segments: [
          { label: 'Negative', value: getV(negKey), color: STACK_COLORS.negative },
          { label: 'Neutral',  value: getV(neuKey), color: STACK_COLORS.neutral  },
          { label: 'Positive', value: getV(posKey), color: STACK_COLORS.positive },
        ],
      };
    });
  }, [data, brandNames, seg, allMetrics]);

  // Q20 Value for Money Distribution (Overpriced / As expected / Good value) — used in deep-dive
  const q20Stacked = useMemo(() => {
    if (!data?.paData?.q20 || !allMetrics) return [];
    return brandNames.map(brand => {
      const opts = data.paData.q20?.[brand]?.options || {};
      const overKey  = findOpt(opts, 'Overpriced') || findOpt(opts, 'Much worse') || findOpt(opts, 'Poor');
      const expKey   = findOpt(opts, 'As expected') || findOpt(opts, 'About the same') || findOpt(opts, 'Average');
      const goodKey  = findOpt(opts, 'Good value') || findOpt(opts, 'Much better') || findOpt(opts, 'Great');
      const getV = (k) => {
        if (!k || !opts[k]) return 0;
        return typeof opts[k] === 'number' ? opts[k] : (opts[k]?.[seg] || 0);
      };
      return {
        brand,
        segments: [
          { label: 'Overpriced',  value: getV(overKey),  color: VFM_COLORS.overpriced },
          { label: 'As expected', value: getV(expKey),   color: VFM_COLORS.expected   },
          { label: 'Good value',  value: getV(goodKey),  color: VFM_COLORS.good       },
        ],
      };
    });
  }, [data, brandNames, seg, allMetrics]);

  if (loading || !allMetrics) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  const fbData = allMetrics[fb]?.prominence || {};
  const fbRank = ranked.indexOf(fb) + 1;

  /* ─── OVERVIEW ─── */
  if (view === 'overview') {
    return (
      <div className="p-6 min-h-[calc(100vh-155px)]">
        <div className="flex flex-col flex-shrink-0 mb-3">
          <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Prominence</h1>
          <p className="text-[11px] text-text-secondary font-medium mt-1">
            Brand salience, reputation and word-of-mouth indicators
          </p>
          <div className="mt-2"><PageViewModeFallback /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {PR_METRICS.map((key, i) => (
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
      </div>
    );
  }

  /* ─── COMPARISON ─── */
  if (view === 'comparison') {
    return (
      <div className="p-6 min-h-[calc(100vh-155px)]">
        <div className="flex flex-col flex-shrink-0 mb-3">
          <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Prominence</h1>
          <p className="text-[11px] text-text-secondary font-medium mt-1">
            Side-by-side comparison of all prominence metrics
          </p>
          <div className="mt-2"><PageViewModeFallback /></div>
        </div>

        <ExpandableCard title="Prominence Metrics Comparison">
        <div className="bg-card rounded-card p-6 animate-slide-up overflow-x-auto min-h-[calc(100vh-280px)]">
          <h3 className="font-display text-xl text-text-primary tracking-wide mb-6">Prominence Metrics Comparison</h3>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Rank</th>
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Brand</th>
                {PR_METRICS.map((key) => (
                  <th key={key} className="text-right py-3 px-3 text-text-secondary font-semibold whitespace-nowrap">
                    {METRIC_DEFS[key].short}
                  </th>
                ))}
                <th className="text-right py-3 px-4 text-text-secondary font-bold">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((brand, i) => {
                const prom = allMetrics[brand]?.prominence || {};
                const isFocused = brand === fb;
                return (
                  <tr
                    key={brand}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isFocused ? 'bg-orange-light font-semibold' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setFocusedBrand(brand)}
                  >
                    <td className="py-4 px-4">{i + 1}</td>
                    <td className={`py-4 px-4 ${isFocused ? 'text-orange-primary' : ''}`}>{brand}</td>
                    {PR_METRICS.map((key) => {
                      const def = METRIC_DEFS[key];
                      return (
                        <td key={key} className="py-4 px-3 text-right tabular-nums">
                          {fmtMetric(prom[key] || 0, def.format)}
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-right tabular-nums font-semibold">
                      {fmtMetric(prom.score || 0, 'pct')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </ExpandableCard>
      </div>
    );
  }

  /* ─── DEEP-DIVE ─── */
  const leaderData = allMetrics[leader]?.prominence || {};

  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Prominence</h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">
          Deep-dive analysis for {fb}
        </p>
        <div className="mt-2"><PageViewModeFallback /></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Focused brand card */}
        <div className="bg-card rounded-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {data?.brands?.find(b => b.name === fb)?.logo ? (
                <img src={data.brands.find(b => b.name === fb).logo} alt={fb} className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="font-display text-xl text-orange-primary">{fb?.[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl text-text-primary">{fb}</h2>
              <p className="text-[11px] text-text-secondary">Rank #{fbRank} of {brandNames.length}</p>
            </div>
            {fbRank <= 3 && <span className="text-orange-primary text-xl">&#9733;</span>}
          </div>

          <div className="text-center py-4 bg-orange-50 rounded-card mb-4">
            <p className="font-display text-[48px] text-orange-primary">
              {fmtMetric(fbData.score || 0, 'pct')}
            </p>
            <p className="text-[11px] text-text-secondary">Prominence Score</p>
            <p className="text-[12px] text-text-primary font-medium mt-1">Positive Impression %</p>
          </div>

          <p className="font-display text-sm text-text-primary tracking-wide mb-2">What's Driving This Score</p>
          <div className="space-y-3">
            {PR_METRICS.filter(k => k !== 'PR1_impressionScore').map((key) => {
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
                        width: `${Math.max(0, (key === 'PR5_netAdvocacy' ? (val + 1) / 2 : val) * 100)}%`,
                        backgroundColor: ORANGE,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking sidebar */}
        <div className="bg-card rounded-card p-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
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
                  {fmtMetric(allMetrics[brand]?.prominence?.score || 0, 'pct')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Narrative / gap vs leader */}
        <div className="bg-card rounded-card p-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h3 className="font-display text-lg text-text-primary mb-4">Narrative</h3>

          {fb === leader ? (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-[12px] text-green-800 font-medium">
                {fb} is the category leader in prominence with a score of{' '}
                {fmtMetric(fbData.score || 0, 'pct')}.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <p className="text-[12px] text-orange-800 font-medium">
                {fb} trails the leader ({leader}) by{' '}
                {fmtMetric((leaderData.score || 0) - (fbData.score || 0), 'pct')} in overall
                prominence.
              </p>
            </div>
          )}

          <h4 className="text-[12px] font-semibold text-text-primary mb-3">
            Gap vs Leader ({leader})
          </h4>
          <div className="space-y-3">
            {PR_METRICS.map((key) => {
              const def = METRIC_DEFS[key];
              const gap = (fbData[key] || 0) - (leaderData[key] || 0);
              const isPositive = gap >= 0;
              return (
                <div key={key} className="flex items-center justify-between text-[11px]">
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
              );
            })}
          </div>

          <div className="mt-6">
            <h4 className="text-[12px] font-semibold text-text-primary mb-2">Key Insight</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {(() => {
                const best = PR_METRICS.reduce((a, b) =>
                  (fbData[a] || 0) > (fbData[b] || 0) ? a : b,
                );
                const worst = PR_METRICS.filter((k) => k !== 'PR5_netAdvocacy').reduce((a, b) =>
                  (fbData[a] || 0) < (fbData[b] || 0) ? a : b,
                );
                return `${fb}'s strongest prominence lever is ${METRIC_DEFS[best].label} (${fmtMetric(
                  fbData[best] || 0,
                  METRIC_DEFS[best].format,
                )}), while ${METRIC_DEFS[worst].label} (${fmtMetric(
                  fbData[worst] || 0,
                  METRIC_DEFS[worst].format,
                )}) represents the biggest opportunity for improvement.`;
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Distribution Charts ─── */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {q19Stacked.length > 0 && (
          <StackedBarChart
            title="Impression Distribution (Q19)"
            subtitle="100% stacked: Negative / Neutral / Positive sentiment across brands"
            dataByBrand={q19Stacked}
            categoryMap={[
              { key: 'negative', label: 'Negative', colorKey: 'negative' },
              { key: 'neutral',  label: 'Neutral',  colorKey: 'neutral'  },
              { key: 'positive', label: 'Positive', colorKey: 'positive' },
            ]}
            colorMap={STACK_COLORS}
            focusedBrand={fb}
            index={6}
          />
        )}

        {q20Stacked.length > 0 && (
          <StackedBarChart
            title="Value for Money Distribution (Q20)"
            subtitle="100% stacked: Overpriced / As expected / Good value across brands"
            dataByBrand={q20Stacked}
            categoryMap={[
              { key: 'overpriced', label: 'Overpriced',  colorKey: 'overpriced' },
              { key: 'expected',   label: 'As expected', colorKey: 'expected'   },
              { key: 'good',       label: 'Good value',  colorKey: 'good'       },
            ]}
            colorMap={VFM_COLORS}
            focusedBrand={fb}
            index={7}
          />
        )}
      </div>

      {/* ─── Bubble Chart: Ad Recall vs Impression ─── */}
      <div className="mt-4">
        <BubbleChart
          allMetrics={allMetrics}
          brandNames={brandNames}
          focusedBrand={fb}
          index={8}
          data={data}
        />
      </div>

      {/* EBI Strategic Actions */}
      <div className="bg-card rounded-card p-5 animate-slide-up mt-4">
        <h3 className="font-display text-lg text-text-primary mb-3">EBI Strategic Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            (fbData.PR1_impressionScore || 0) < 0.5 && { badge: 'VISIBILITY', bg: 'bg-amber-50', border: 'border-amber-300', badgeBg: 'bg-amber-500', title: 'Low Impression at POP', desc: 'Brand not noticed at point of purchase — invest in distinctive brand assets (logo, colour, packaging) that are unique to this brand' },
            (fbData.PR3_adCutThrough || 0) < 0.15 && { badge: 'RECALL', bg: 'bg-blue-50', border: 'border-blue-300', badgeBg: 'bg-blue-500', title: 'Low Ad Recall', desc: 'Low ad recall — advertising builds mental availability by refreshing memory structures. Increase reach and frequency across all category buyers' },
            (fbData.PR2_marketPresence || 0) < 0.1 && { badge: 'PRESENCE', bg: 'bg-red-50', border: 'border-red-300', badgeBg: 'bg-red-500', title: 'Low Market Presence', desc: 'Low perceived market presence — per Double Jeopardy, smaller brands feel less "everywhere". Growth in physical distribution will naturally lift perceived presence' },
            (fbData.PR1_impressionScore || 0) >= 0.65 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'High Standout', desc: `${fmtMetric(fbData.PR1_impressionScore || 0, 'pct')} positive standout — brand is noticed and perceived favourably at point of purchase. Protect distinctive assets.` },
            (fbData.PR2_marketPresence || 0) >= 0.2 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Strong Market Presence', desc: `${fmtMetric(fbData.PR2_marketPresence || 0, 'pct')} perceive the brand as widely available — physical distribution is translating into mental presence.` },
            (fbData.PR3_adCutThrough || 0) >= 0.3 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'High Ad Recall', desc: `${fmtMetric(fbData.PR3_adCutThrough || 0, 'pct')} ad cut-through — advertising is cutting through and refreshing memory structures effectively.` },
            { badge: 'EBI', bg: 'bg-gray-50', border: 'border-gray-300', badgeBg: 'bg-gray-500', title: 'Core Principle', desc: 'Prominence = being easy to notice. Build distinctive brand assets (not differentiation) and ensure consistent presence across all category buyer touchpoints.' },
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
    </div>
  );
};

export default Prominence;
