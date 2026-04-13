import { useState, useEffect, useMemo } from 'react';
import { useViewMode } from '../components/ViewModeContext.jsx';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartBar, Table, MagnifyingGlass } from '@phosphor-icons/react';

const ORANGE = '#F36B1F';
const GRAY = '#D1D5DB';
const GREEN = '#2E7D32';
const RED = '#DC2626';

/* Presence metric keys in order P1-P6 */
const PRESENCE_KEYS = [
  'P1_easeScore',
  'P2_frictionRate',
  'P3_trialPenetration',
  'P4_frequencyMomentum',
  'P5_locationAssociation',
  'P6_locationLoyalty',
];

/* ---------- Horizontal Bar Card ---------- */
const MetricBarCard = ({ metricKey, allMetrics, brandNames, focusedBrand, delay = 0 }) => {
  const def = METRIC_DEFS[metricKey];
  const isInverted = def.invert;
  const isNet = def.format === 'net';

  const barData = useMemo(() => {
    const items = brandNames.map((brand) => {
      let raw = allMetrics[brand]?.presence?.[metricKey] ?? 0;
      return { brand, raw, display: raw * 100 };
    });

    // Sort: for inverted metrics (lower=better), sort ascending; otherwise descending
    if (isInverted) {
      items.sort((a, b) => a.raw - b.raw);
    } else {
      items.sort((a, b) => b.raw - a.raw);
    }
    return items;
  }, [allMetrics, brandNames, metricKey, isInverted]);

  const maxAbs = Math.max(...barData.map((d) => Math.abs(d.display)), 1);

  return (
    <div
      className="bg-card rounded-card p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="font-display text-lg text-text-primary tracking-wide mb-0.5">
        {def.label}
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">{def.desc}</p>

      <div className="space-y-2.5">
        {barData.map((item) => {
          const isFocused = item.brand === focusedBrand;
          const barColor = isFocused ? ORANGE : GRAY;

          if (isNet) {
            // Diverging bar for net scores
            const pct = (Math.abs(item.display) / maxAbs) * 50;
            const isPositive = item.display >= 0;
            return (
              <div key={item.brand} className="flex items-center gap-2">
                <span
                  className={`text-[11px] w-20 truncate text-right ${
                    isFocused ? 'font-semibold text-orange-primary' : 'text-text-secondary'
                  }`}
                >
                  {item.brand}
                </span>
                <div className="flex-1 h-5 relative flex">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                  {/* Bar */}
                  <div className="flex-1 flex items-center" style={{ direction: isPositive ? 'ltr' : 'rtl' }}>
                    <div
                      className="h-full rounded-[4px] transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isFocused
                          ? ORANGE
                          : isPositive
                          ? '#86EFAC'
                          : '#FCA5A5',
                        marginLeft: isPositive ? '50%' : 'auto',
                        marginRight: isPositive ? 'auto' : '50%',
                        position: 'absolute',
                        left: isPositive ? '50%' : 'auto',
                        right: isPositive ? 'auto' : '50%',
                      }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-text-primary w-14 text-right">
                  {fmtMetric(item.raw, 'net')}
                </span>
              </div>
            );
          }

          // Standard horizontal bar
          const barWidth = maxAbs > 0 ? (Math.abs(item.display) / maxAbs) * 100 : 0;
          return (
            <div key={item.brand} className="flex items-center gap-2">
              <span
                className={`text-[11px] w-20 truncate text-right ${
                  isFocused ? 'font-semibold text-orange-primary' : 'text-text-secondary'
                }`}
              >
                {item.brand}
              </span>
              <div className="flex-1 h-5 bg-gray-100 rounded-[5px] overflow-hidden relative">
                <div
                  className="h-full rounded-[5px] transition-all duration-700"
                  style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-[11px] font-semibold text-text-primary w-14 text-right">
                {fmtMetric(item.raw, def.format)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Comparison Table ---------- */
const ComparisonTable = ({ allMetrics, brandNames, focusedBrand }) => {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const items = brandNames.map((brand) => {
      const m = allMetrics[brand]?.presence ?? {};
      const row = { brand };
      PRESENCE_KEYS.forEach((k) => {
        row[k] = m[k] ?? 0;
      });
      row.score = m.score ?? 0;
      return row;
    });

    if (sortCol) {
      items.sort((a, b) =>
        sortDir === 'desc' ? b[sortCol] - a[sortCol] : a[sortCol] - b[sortCol]
      );
    } else {
      items.sort((a, b) => b.score - a.score);
    }
    return items;
  }, [allMetrics, brandNames, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="bg-card rounded-card p-5 animate-slide-up overflow-x-auto">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">
        Presence Metrics Comparison
      </h3>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-text-secondary">Brand</th>
            {PRESENCE_KEYS.map((k) => (
              <th
                key={k}
                className="text-right py-2 px-2 text-text-secondary cursor-pointer select-none hover:text-orange-primary transition-colors whitespace-nowrap"
                onClick={() => handleSort(k)}
                title={METRIC_DEFS[k].desc}
              >
                {METRIC_DEFS[k].short}
                {sortCol === k && (sortDir === 'desc' ? ' \u25BC' : ' \u25B2')}
              </th>
            ))}
            <th
              className="text-right py-2 px-3 text-text-secondary cursor-pointer select-none hover:text-orange-primary font-semibold"
              onClick={() => handleSort('score')}
            >
              Score{sortCol === 'score' && (sortDir === 'desc' ? ' \u25BC' : ' \u25B2')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isFocused = row.brand === focusedBrand;
            return (
              <tr
                key={row.brand}
                className={`border-b border-gray-100 ${
                  isFocused ? 'bg-orange-light font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                <td className={`py-2 px-3 ${isFocused ? 'text-orange-primary' : ''}`}>
                  {row.brand}
                </td>
                {PRESENCE_KEYS.map((k) => (
                  <td key={k} className="py-2 px-2 text-right">
                    {fmtMetric(row[k], METRIC_DEFS[k].format)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-semibold">
                  {(row.score * 100).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- Q18 Ease Distribution (Deep-Dive) ---------- */
const EaseDistribution = ({ data, focusedBrand }) => {
  const distData = useMemo(() => {
    const opts = data?.paData?.q18?.[focusedBrand]?.options;
    if (!opts) return [];
    return Object.entries(opts).map(([label, vals]) => ({
      label,
      value: (vals?.Total ?? 0) * 100,
    }));
  }, [data, focusedBrand]);

  if (!distData.length) return null;

  const COLORS = ['#166534', '#22C55E', '#FDE047', '#FB923C', '#DC2626'];
  const total = distData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-card rounded-card p-5 animate-slide-up">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-1">
        Ease of Access Distribution
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">
        Q18: How easy is it to dine at {focusedBrand}?
      </p>

      {/* Stacked horizontal bar */}
      <div className="h-10 flex rounded-[6px] overflow-hidden mb-4">
        {distData.map((seg, i) => {
          const width = total > 0 ? (seg.value / total) * 100 : 0;
          if (width < 0.5) return null;
          return (
            <div
              key={seg.label}
              className="h-full flex items-center justify-center text-[10px] font-semibold text-white transition-all duration-700"
              style={{
                width: `${width}%`,
                backgroundColor: COLORS[i % COLORS.length],
                minWidth: width > 3 ? undefined : 0,
              }}
              title={`${seg.label}: ${seg.value.toFixed(1)}%`}
            >
              {width > 8 ? `${seg.value.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {distData.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-text-secondary">
              {seg.label}: {seg.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Deep-Dive Detail Card ---------- */
const DeepDiveCard = ({ allMetrics, focusedBrand, leader }) => {
  const fb = allMetrics[focusedBrand]?.presence ?? {};
  const ld = leader && leader !== focusedBrand ? allMetrics[leader]?.presence ?? {} : null;

  return (
    <div className="bg-card rounded-card p-6 animate-slide-up">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-lg bg-orange-light flex items-center justify-center">
          <span className="font-display text-2xl text-orange-primary">
            {focusedBrand?.[0]}
          </span>
        </div>
        <div>
          <h2 className="font-display text-2xl text-text-primary">{focusedBrand}</h2>
          <p className="text-[11px] text-text-secondary">
            Presence Score: {(fb.score * 100).toFixed(1)}%
            {leader && leader !== focusedBrand && ` | Leader (${leader}): ${((ld?.score ?? 0) * 100).toFixed(1)}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {PRESENCE_KEYS.map((key) => {
          const def = METRIC_DEFS[key];
          const val = fb[key] ?? 0;
          const leaderVal = ld?.[key] ?? null;
          const diff = leaderVal !== null ? val - leaderVal : null;

          return (
            <div key={key} className="p-4 bg-gray-50 rounded-card">
              <p className="text-[10px] text-text-secondary mb-1 uppercase tracking-wide">
                {def.label}
              </p>
              <p className="font-display text-[28px] leading-none text-text-primary">
                {fmtMetric(val, def.format)}
              </p>
              {diff !== null && (
                <p
                  className={`text-[10px] mt-1 font-medium ${
                    (def.invert ? diff <= 0 : diff >= 0) ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {diff >= 0 ? '+' : ''}
                  {(diff * 100).toFixed(1)}pp vs leader
                </p>
              )}
              <p className="text-[9px] text-text-secondary mt-1">{def.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ========== PAGE COMPONENT ========== */
const Presence = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader } = useFilters();
  const { data, loading, error } = useData();
  const { setCurrentGuide } = useGuide();
  const [view, setView] = useState('overview');

  useEffect(() => {
    setCurrentGuide({ sections: guides['/presence'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/presence',
      modes: [
        { key: 'overview', label: 'Overview' },
        { key: 'comparison', label: 'Comparison' },
        { key: 'deepdive', label: 'Deep-Dive' },
      ],
      current: view,
      onChange: setView,
    });
    return () => setViewMode(null);
  }, [setViewMode, view]);

  if (loading || !allMetrics || !data) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-155px)]">
        <p className="text-text-secondary">Loading presence data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-155px)]">
        <p className="text-red-500">Failed to load data. Please try again.</p>
      </div>
    );
  }

  const fb = focusedBrand || brandNames[0];

  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      {/* Header */}
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">
          Presence
        </h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">
          How easy is it for customers to find and access the brand?
        </p>
        <div className="mt-2">
          <PageViewModeFallback />
        </div>
      </div>

      {/* Overview mode: 6 metric bar cards */}
      {view === 'overview' && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {PRESENCE_KEYS.map((key, i) => (
            <MetricBarCard
              key={key}
              metricKey={key}
              allMetrics={allMetrics}
              brandNames={brandNames}
              focusedBrand={fb}
              delay={i * 80}
            />
          ))}
        </div>
      )}

      {/* Comparison mode: table */}
      {view === 'comparison' && (
        <ComparisonTable
          allMetrics={allMetrics}
          brandNames={brandNames}
          focusedBrand={fb}
        />
      )}

      {/* Deep-dive mode */}
      {view === 'deepdive' && (
        <div className="space-y-6">
          <DeepDiveCard
            allMetrics={allMetrics}
            focusedBrand={fb}
            leader={leader}
          />
          <EaseDistribution data={data} focusedBrand={fb} />
        </div>
      )}
    </div>
  );
};

export default Presence;
