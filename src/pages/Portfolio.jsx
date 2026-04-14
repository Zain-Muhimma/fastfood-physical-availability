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
import ExpandableCard from '../components/ExpandableCard.jsx';

const ORANGE = '#F36B1F';
const GREY = '#D1D5DB';
const AMBER = '#F36B1F';
const BLUE = '#FDB55B';
const GREEN = '#707070';

/* ─── Q12 factor → Q24 metric mapping (for gap chart) ─── */
const Q12_Q24_MAP = [
  { label: 'Taste', q12Key: 'Taste and flavour of food', q24Key: 'PO3_tasteQuality' },
  { label: 'Price', q12Key: 'Price and value for money', q24Key: 'PO5_priceAccessibility' },
  { label: 'Variety', q12Key: 'Menu variety and range of options', q24Key: 'PO1_varietyPerception' },
  { label: 'Health', q12Key: 'Healthy and nutritional options', q24Key: 'PO4_healthOptionBreadth' },
  { label: 'Innovation', q12Key: 'Innovation and unique offerings', q24Key: 'PO2_innovationPerception' },
];

/* ─── Q25 reason color-coding by type ─── */
const REASON_TYPE = {
  'Unique menu appeal': 'portfolio',
  'Customizable experience': 'portfolio',
  'Consistent promotions': 'portfolio',
  'Positive physical feeling': 'portfolio',
  'Location convenience': 'convenience',
  'Reliable ordering': 'convenience',
  'Effortless choice': 'convenience',
  'Routine': 'convenience',
  'Branch loyalty': 'convenience',
  'Lack of alternatives': 'convenience',
  'Personal connection': 'emotional',
  'Social influence': 'emotional',
  'Emotional comfort': 'emotional',
  'Cultural fit': 'emotional',
  'Feeling special': 'emotional',
};
const REASON_COLORS = { portfolio: AMBER, convenience: BLUE, emotional: GREEN };

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
    <ExpandableCard title={def.label}>
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
    </ExpandableCard>
  );
};

/* ───────── Gap Chart: Q12 Category Demand vs Q24 Brand Portfolio ───────── */
const GapChart = ({ paData, allMetrics, focusedBrand, activeSegment }) => {
  const factors = paData?.q12?.factors;
  const brandPortfolio = allMetrics?.[focusedBrand]?.portfolio;
  if (!factors || !brandPortfolio) return null;

  const seg = activeSegment || 'Total';

  return (
    <ExpandableCard title="Gap Chart: Category Demand vs Brand Portfolio">
    <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '320ms' }}>
      <h3 className="font-display text-base text-text-primary tracking-wide mb-1">
        Gap Chart: Category Demand vs Brand Portfolio
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">
        Q12 category importance (what buyers want) vs Q24 brand association for {focusedBrand}
      </p>

      <div className="space-y-4">
        {Q12_Q24_MAP.map(({ label, q12Key, q24Key }) => {
          const demandVal = (factors[q12Key]?.[seg] || 0) * 100;
          const brandVal = (brandPortfolio[q24Key] || 0) * 100;
          const gap = demandVal - brandVal;
          const maxBar = Math.max(demandVal, brandVal, 1);

          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-text-primary">{label}</span>
                {Math.abs(gap) > 10 && (
                  <span className={`text-[10px] font-semibold ${gap > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    Gap: {gap > 0 ? '+' : ''}{gap.toFixed(1)}pp
                  </span>
                )}
              </div>
              {/* Category demand bar */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] text-text-secondary w-20 text-right">Category (Q12)</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(demandVal / maxBar) * 100}%`, backgroundColor: '#6B7280' }}
                  />
                </div>
                <span className="text-[10px] tabular-nums w-12 text-right">{demandVal.toFixed(1)}%</span>
              </div>
              {/* Brand association bar */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-text-secondary w-20 text-right">{focusedBrand} (Q24)</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(brandVal / maxBar) * 100}%`, backgroundColor: ORANGE }}
                  />
                </div>
                <span className="text-[10px] tabular-nums w-12 text-right">{brandVal.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 text-[10px] text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#6B7280' }} /> Category demand
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: ORANGE }} /> Brand delivery
        </span>
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ───────── Bar Chart: Main Brand Reasons (Q25) ───────── */
const BrandReasonsChart = ({ paData, focusedBrand }) => {
  const reasonsObj = paData?.q25_per_brand?.[focusedBrand]?.reasons;
  if (!reasonsObj) return null;

  const sorted = Object.entries(reasonsObj)
    .map(([reason, vals]) => ({ reason, value: vals?.Total || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const maxVal = Math.max(0.01, ...sorted.map((r) => r.value));

  return (
    <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <h3 className="font-display text-base text-text-primary tracking-wide mb-1">
        Main Brand Reasons (Q25)
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">
        Why main-brand users chose {focusedBrand} &mdash; top 10 reasons sorted by importance
      </p>

      <div className="space-y-1.5">
        {sorted.map(({ reason, value }) => {
          const type = REASON_TYPE[reason] || 'portfolio';
          const color = REASON_COLORS[type];
          const pct = (value / maxVal) * 100;

          return (
            <div key={reason} className="flex items-center gap-2 text-[11px]">
              <span className="w-36 text-right truncate text-text-secondary">{reason}</span>
              <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-12 text-right tabular-nums font-medium">
                {(value * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 text-[10px] text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: AMBER }} /> Portfolio
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: BLUE }} /> Convenience
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: GREEN }} /> Emotional
        </span>
      </div>
    </div>
  );
};

/* ───────── Category Context: What Buyers Value Most (Q12) ───────── */
const CategoryContextPanel = ({ paData, activeSegment }) => {
  const factors = paData?.q12?.factors;
  if (!factors) return null;

  const seg = activeSegment || 'Total';
  const sorted = Object.entries(factors)
    .map(([name, vals]) => ({ name, value: vals?.[seg] || 0 }))
    .sort((a, b) => b.value - a.value);

  const maxVal = Math.max(0.01, ...sorted.map((f) => f.value));

  return (
    <ExpandableCard title="What Buyers Value Most (Q12)">
    <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '480ms' }}>
      <h3 className="font-display text-base text-text-primary tracking-wide mb-1">
        What Buyers Value Most (Q12)
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">
        All 18 category choice factors sorted by importance &mdash; fixed reference (not brand-specific)
      </p>

      <div className="space-y-1">
        {sorted.map(({ name, value }, i) => {
          const pct = (value / maxVal) * 100;
          return (
            <div key={name} className="flex items-center gap-2 text-[11px]">
              <span className="w-4 text-right text-[9px] text-text-secondary">{i + 1}</span>
              <span className="w-52 text-right truncate text-text-secondary">{name}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: '#6B7280' }}
                />
              </div>
              <span className="w-12 text-right tabular-nums font-medium">
                {(value * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ───────── PAGE ───────── */
const Portfolio = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader, setFocusedBrand, activeSegment } = useFilters();
  const { data, loading } = useData();
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

        <ExpandableCard title="Portfolio Metrics Comparison">
        <div className="bg-card rounded-card p-6 animate-slide-up overflow-x-auto min-h-[calc(100vh-280px)]">
          <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">Portfolio Metrics Comparison</h3>
          {/* Legend */}
          <div className="flex gap-4 mb-6 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-green-200" /> &gt;30%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-yellow-200" /> 15-30%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-orange-200" /> 5-15%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-gray-100" /> &lt;5%
            </span>
          </div>

          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Rank</th>
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Brand</th>
                {PO_METRICS.map((key) => (
                  <th key={key} className="text-center py-3 px-3 text-text-secondary font-semibold whitespace-nowrap">
                    {METRIC_DEFS[key].short}
                  </th>
                ))}
                <th className="text-right py-3 px-4 text-text-secondary font-bold">Score</th>
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
                      isFocused ? 'bg-orange-light font-semibold' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setFocusedBrand(brand)}
                  >
                    <td className="py-4 px-4">{i + 1}</td>
                    <td className={`py-4 px-4 font-medium ${isFocused ? 'text-orange-primary' : ''}`}>
                      {brand}
                    </td>
                    {PO_METRICS.map((key) => {
                      const val = port[key] || 0;
                      return (
                        <td key={key} className="py-3 px-2 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded text-[12px] tabular-nums font-medium ${heatColor(val)}`}>
                            {fmtMetric(val, 'pct')}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-right tabular-nums font-semibold">
                      {fmtMetric(port.score || 0, 'pct')}
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
            <p className="text-[11px] text-text-secondary">Portfolio Score</p>
            <p className="text-[12px] text-text-primary font-medium mt-1">Range Coverage</p>
          </div>

          <p className="font-display text-sm text-text-primary tracking-wide mb-2">What's Driving This Score</p>
          <div className="space-y-3">
            {PO_METRICS.filter(k => k !== 'PO1_varietyPerception').map((key) => {
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

      {/* Blueprint elements: Gap Chart, Brand Reasons, Category Context */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <GapChart
          paData={data?.paData}
          allMetrics={allMetrics}
          focusedBrand={fb}
          activeSegment={activeSegment}
        />
        <BrandReasonsChart paData={data?.paData} focusedBrand={fb} />
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <CategoryContextPanel paData={data?.paData} activeSegment={activeSegment} />
          <ExpandableCard title={`Portfolio Profile: ${fb} vs ${leader}`}>
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <h3 className="font-display text-base text-text-primary tracking-wide mb-2">
              Portfolio Profile: {fb} vs {leader}
              {fb === leader && ' (Leader)'}
            </h3>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} />
                <Radar name={fb} dataKey={fb} stroke={ORANGE} fill={ORANGE} fillOpacity={0.25} strokeWidth={2} />
                {fb !== leader && (
                  <Radar name={leader} dataKey={leader} stroke="#6B7280" fill="#6B7280" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
                )}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          </ExpandableCard>
        </div>
      </div>

      {/* EBI Strategic Actions */}
      <div className="bg-card rounded-card p-5 animate-slide-up mt-4">
        <h3 className="font-display text-lg text-text-primary mb-3">EBI Strategic Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            (fbData.PO1_varietyPerception || 0) < 0.15 && { badge: 'RANGE', bg: 'bg-blue-50', border: 'border-blue-300', badgeBg: 'bg-blue-500', title: 'Low Variety Perception', desc: 'Low variety perception — broaden the menu to cover more buying occasions. Per EBI, each new occasion is a Category Entry Point that increases purchase probability' },
            (fbData.PO3_tasteQuality || 0) < 0.15 && { badge: 'TASTE', bg: 'bg-amber-50', border: 'border-amber-300', badgeBg: 'bg-amber-500', title: 'Weak Taste Association', desc: 'Weak taste association — taste is the #1 category choice factor. Without taste credibility, variety and innovation are meaningless' },
            (fbData.PO2_innovationPerception || 0) < 0.1 && { badge: 'INNOVATION', bg: 'bg-orange-50', border: 'border-orange-300', badgeBg: 'bg-orange-500', title: 'Stagnant Portfolio', desc: 'Portfolio perceived as stagnant — refreshing the range signals dynamism and re-enters the brand into consideration' },
            (fbData.PO7_valueStandout || 0) < 0.25 && { badge: 'VALUE', bg: 'bg-red-50', border: 'border-red-300', badgeBg: 'bg-red-500', title: 'Value Below Expectations', desc: 'Value does not exceed expectations — per EBI, value perception affects repeat purchase probability across all buyer segments' },
            (fbData.PO3_tasteQuality || 0) >= 0.3 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Strong Taste', desc: `${fmtMetric(fbData.PO3_tasteQuality || 0, 'pct')} taste association — taste is the #1 category choice factor. This is a key competitive advantage to protect.` },
            (fbData.PO1_varietyPerception || 0) >= 0.2 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Good Range', desc: `${fmtMetric(fbData.PO1_varietyPerception || 0, 'pct')} variety perception — menu breadth covers key occasions. Continue expanding Category Entry Points.` },
            (fbData.PO7_valueStandout || 0) >= 0.4 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Value Leader', desc: `${fmtMetric(fbData.PO7_valueStandout || 0, 'pct')} value standout — exceeding value expectations drives repeat purchase across all buyer segments.` },
            { badge: 'EBI', bg: 'bg-gray-50', border: 'border-gray-300', badgeBg: 'bg-gray-500', title: 'Core Principle', desc: 'Portfolio breadth increases Category Entry Points — the more buying occasions a brand covers, the more category buyers can choose it. Grow range, not segments.' },
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

export default Portfolio;
