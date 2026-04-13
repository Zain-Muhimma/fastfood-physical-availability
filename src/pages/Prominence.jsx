import { useState, useEffect, useMemo } from 'react';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import { useViewMode } from '../components/ViewModeContext.jsx';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';

const ORANGE = '#F36B1F';
const GREY = '#D1D5DB';

const PR_METRICS = [
  'PR1_impressionScore',
  'PR2_valueStandout',
  'PR3_perceivedMomentum',
  'PR4_adCutThrough',
  'PR5_netAdvocacy',
  'PR6_reputationSalience',
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
  );
};

/* ───────── PAGE ───────── */
const Prominence = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader, setFocusedBrand } = useFilters();
  const { loading } = useData();
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="bg-card rounded-card p-5 animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3">Rank</th>
                  <th className="text-left py-2 px-3">Brand</th>
                  {PR_METRICS.map((key) => (
                    <th key={key} className="text-right py-2 px-3">
                      {METRIC_DEFS[key].short}
                    </th>
                  ))}
                  <th className="text-right py-2 px-3">Score</th>
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
                        isFocused ? 'bg-orange-50 font-semibold' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setFocusedBrand(brand)}
                    >
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className={`py-2 px-3 ${isFocused ? 'text-orange-primary' : ''}`}>{brand}</td>
                      {PR_METRICS.map((key) => {
                        const def = METRIC_DEFS[key];
                        return (
                          <td key={key} className="py-2 px-3 text-right tabular-nums">
                            {fmtMetric(prom[key] || 0, def.format)}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right tabular-nums font-semibold">
                        {fmtMetric(prom.score || 0, 'pct')}
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
            <p className="text-[11px] text-text-secondary">Prominence Score</p>
          </div>

          <div className="space-y-3">
            {PR_METRICS.map((key) => {
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
    </div>
  );
};

export default Prominence;
