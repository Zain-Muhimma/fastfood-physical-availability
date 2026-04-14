import { useState, useEffect, useMemo } from 'react';
import { useViewMode } from '../components/ViewModeContext.jsx';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { ChartBar, Table, MagnifyingGlass } from '@phosphor-icons/react';
import ExpandableCard from '../components/ExpandableCard.jsx';

const ORANGE = '#F36B1F';
const GRAY = '#D1D5DB';
const GREEN = '#2E7D32';
const RED = '#DC2626';
const AMBER = '#F59E0B';

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
    <ExpandableCard title={def.label}>
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
            const pct = (Math.abs(item.display) / maxAbs) * 50;
            const isPositive = item.display >= 0;
            return (
              <div key={item.brand} className="flex items-center gap-2">
                <span
                  className={`text-[11px] w-24 truncate text-right ${
                    isFocused ? 'font-semibold text-orange-primary' : 'text-text-secondary'
                  }`}
                >
                  {item.brand}
                </span>
                <div className="flex-1 h-5 flex items-center">
                  {/* Left half (negative) */}
                  <div className="w-1/2 flex justify-end">
                    {!isPositive && (
                      <div
                        className="h-4 rounded-l-[4px]"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isFocused ? ORANGE : '#FCA5A5',
                        }}
                      />
                    )}
                  </div>
                  {/* Center line */}
                  <div className="w-px h-5 bg-gray-300 flex-shrink-0" />
                  {/* Right half (positive) */}
                  <div className="w-1/2">
                    {isPositive && (
                      <div
                        className="h-4 rounded-r-[4px]"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isFocused ? ORANGE : '#86EFAC',
                        }}
                      />
                    )}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold w-14 text-right ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
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
    </ExpandableCard>
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
    <ExpandableCard title="Presence Metrics Comparison">
    <div className="bg-card rounded-card p-6 animate-slide-up overflow-x-auto min-h-[calc(100vh-280px)]">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-6">
        Presence Metrics Comparison
      </h3>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Brand</th>
            {PRESENCE_KEYS.map((k) => (
              <th
                key={k}
                className="text-right py-3 px-3 text-text-secondary cursor-pointer select-none hover:text-orange-primary transition-colors whitespace-nowrap font-semibold"
                onClick={() => handleSort(k)}
                title={METRIC_DEFS[k].desc}
              >
                {METRIC_DEFS[k].short}
                {sortCol === k && (sortDir === 'desc' ? ' \u25BC' : ' \u25B2')}
              </th>
            ))}
            <th
              className="text-right py-3 px-4 text-text-secondary cursor-pointer select-none hover:text-orange-primary font-bold"
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
                className={`border-b border-gray-100 transition-colors ${
                  isFocused ? 'bg-orange-light font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                <td className={`py-4 px-4 ${isFocused ? 'text-orange-primary' : ''}`}>
                  {row.brand}
                </td>
                {PRESENCE_KEYS.map((k) => (
                  <td key={k} className="py-4 px-3 text-right">
                    {fmtMetric(row[k], METRIC_DEFS[k].format)}
                  </td>
                ))}
                <td className="py-4 px-4 text-right font-semibold">
                  {(row.score * 100).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </ExpandableCard>
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

/* ---------- helper: find Q18 option key by substring ---------- */
const findQ18Option = (opts, substring) => {
  if (!opts) return null;
  const lc = substring.toLowerCase();
  const keys = Object.keys(opts);
  const startsWith = keys.find(k => k.toLowerCase().startsWith(lc));
  if (startsWith) return startsWith;
  return keys.find(k => {
    const klc = k.toLowerCase();
    const idx = klc.indexOf(lc);
    return idx >= 0 && (idx === 0 || /[\s\/–—,]/.test(klc[idx - 1]));
  });
};

/* ---------- 1. Stacked Bar: Ease Distribution (all brands) ---------- */
const EaseStackedBars = ({ data, brandNames, focusedBrand }) => {
  const barData = useMemo(() => {
    return brandNames.map((brand) => {
      const opts = data?.paData?.q18?.[brand]?.options;
      const impossibleKey = findQ18Option(opts, 'Impossible');
      const inconvenientKey = findQ18Option(opts, 'Inconvenient');
      const convenientKey = findQ18Option(opts, 'Convenient');
      const impossible = impossibleKey ? (opts[impossibleKey]?.Total ?? 0) * 100 : 0;
      const inconvenient = inconvenientKey ? (opts[inconvenientKey]?.Total ?? 0) * 100 : 0;
      const convenient = convenientKey ? (opts[convenientKey]?.Total ?? 0) * 100 : 0;
      return { brand, impossible, inconvenient, convenient };
    }).sort((a, b) => b.convenient - a.convenient);
  }, [data, brandNames]);

  return (
    <ExpandableCard title="Ease of Access Distribution">
    <div
      className="bg-card rounded-card p-5 animate-slide-up col-span-full"
      style={{ animationDelay: '500ms' }}
    >
      <h3 className="font-display text-lg text-text-primary tracking-wide mb-0.5">
        Ease of Access Distribution
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">
        Q18: How easy is it to dine at each brand? (Impossible / Inconvenient / Convenient)
      </p>

      <div className="space-y-2.5">
        {barData.map((item) => {
          const isFocused = item.brand === focusedBrand;
          const total = item.impossible + item.inconvenient + item.convenient;
          const pctImp = total > 0 ? (item.impossible / total) * 100 : 0;
          const pctInc = total > 0 ? (item.inconvenient / total) * 100 : 0;
          const pctCon = total > 0 ? (item.convenient / total) * 100 : 0;
          return (
            <div key={item.brand} className="flex items-center gap-2">
              <span
                className={`text-[11px] w-24 truncate text-right ${
                  isFocused ? 'font-semibold text-orange-primary' : 'text-text-secondary'
                }`}
              >
                {item.brand}
              </span>
              <div className={`flex-1 h-5 flex rounded-[5px] overflow-hidden ${isFocused ? 'ring-2 ring-orange-primary/40' : ''}`}>
                {pctImp > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[9px] font-semibold text-white"
                    style={{ width: `${pctImp}%`, backgroundColor: RED }}
                    title={`Impossible: ${pctImp.toFixed(1)}%`}
                  >
                    {pctImp > 8 ? `${pctImp.toFixed(0)}%` : ''}
                  </div>
                )}
                {pctInc > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[9px] font-semibold text-white"
                    style={{ width: `${pctInc}%`, backgroundColor: AMBER }}
                    title={`Inconvenient: ${pctInc.toFixed(1)}%`}
                  >
                    {pctInc > 8 ? `${pctInc.toFixed(0)}%` : ''}
                  </div>
                )}
                {pctCon > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[9px] font-semibold text-white"
                    style={{ width: `${pctCon}%`, backgroundColor: GREEN }}
                    title={`Convenient: ${pctCon.toFixed(1)}%`}
                  >
                    {pctCon > 8 ? `${pctCon.toFixed(0)}%` : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: RED }} />
          <span className="text-[11px] text-text-secondary">Impossible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: AMBER }} />
          <span className="text-[11px] text-text-secondary">Inconvenient</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GREEN }} />
          <span className="text-[11px] text-text-secondary">Convenient</span>
        </div>
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ---------- 2. Regional Ease Breakdown ---------- */
const REGION_KEYS = ['Riyadh', 'Jeddah', 'Dammam / Al Khobar', 'Mecca / Madinah / Taif', 'Other Regions'];

const RegionalEaseBreakdown = ({ data, focusedBrand }) => {
  const regionData = useMemo(() => {
    const opts = data?.paData?.q18?.[focusedBrand]?.options;
    if (!opts) return [];
    const convenientKey = findQ18Option(opts, 'Convenient');
    if (!convenientKey) return [];
    const convenientObj = opts[convenientKey];
    if (!convenientObj) return [];

    return REGION_KEYS
      .map((region) => ({
        region,
        value: (convenientObj[region] ?? 0) * 100,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, focusedBrand]);

  if (!regionData.length) return null;

  const maxVal = Math.max(...regionData.map((d) => d.value), 1);

  return (
    <div
      className="bg-card rounded-card p-5 animate-slide-up"
      style={{ animationDelay: '600ms' }}
    >
      <h3 className="font-display text-lg text-text-primary tracking-wide mb-0.5">
        Regional Ease Breakdown
      </h3>
      <p className="text-[10px] text-text-secondary mb-4">
        Q18 Convenient score by region for {focusedBrand}
      </p>

      <div className="space-y-2.5">
        {regionData.map((item) => {
          const barWidth = (item.value / maxVal) * 100;
          return (
            <div key={item.region} className="flex items-center gap-2">
              <span className="text-[11px] w-36 truncate text-right text-text-secondary">
                {item.region}
              </span>
              <div className="flex-1 h-5 bg-gray-100 rounded-[5px] overflow-hidden">
                <div
                  className="h-full rounded-[5px] transition-all duration-700"
                  style={{ width: `${barWidth}%`, backgroundColor: ORANGE }}
                />
              </div>
              <span className="text-[11px] font-semibold text-text-primary w-14 text-right">
                {item.value.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- 3. Location Association vs Ease Scatter ---------- */
const LocationEaseScatter = ({ allMetrics, brandNames, focusedBrand }) => {
  const scatterData = useMemo(() => {
    return brandNames.map((brand) => {
      const p = allMetrics[brand]?.presence ?? {};
      return {
        brand,
        x: (p.P5_locationAssociation ?? 0) * 100,
        y: (p.P1_easeScore ?? 0) * 100,
      };
    });
  }, [allMetrics, brandNames]);

  const medianX = useMemo(() => {
    const sorted = [...scatterData].sort((a, b) => a.x - b.x);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1].x + sorted[mid].x) / 2
      : sorted[mid].x;
  }, [scatterData]);

  const medianY = useMemo(() => {
    const sorted = [...scatterData].sort((a, b) => a.y - b.y);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1].y + sorted[mid].y) / 2
      : sorted[mid].y;
  }, [scatterData]);

  const focusedPoint = scatterData.find(d => d.brand === focusedBrand);
  const insightText = useMemo(() => {
    if (!focusedPoint) return '';
    const highX = focusedPoint.x > medianX;
    const highY = focusedPoint.y > medianY;
    if (highX && highY) return 'Strong on both — stores are accessible AND mentally linked to convenience. PROTECT this alignment.';
    if (highX && !highY) return 'High location recall but low ease — buyers remember the brand as accessible but find it hard to visit. Investigate operational friction (parking, seating, hours).';
    if (!highX && highY) return 'Good ease but weak location memory — stores work but are not mentally linked to convenience. Feature location in distinctive brand assets.';
    return 'Weak on both — priority is expanding distribution footprint. Per EBI, physical availability is the #1 growth lever.';
  }, [focusedPoint, medianX, medianY]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-[11px]">
          <p className="font-semibold text-text-primary">{d.brand}</p>
          <p className="text-text-secondary">Location: {d.x.toFixed(1)}%</p>
          <p className="text-text-secondary">Ease: {d.y.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ExpandableCard title="Location Association vs Ease Score">
    <div className="grid grid-cols-2 gap-4">
      <div
        className="bg-card rounded-card p-5 animate-slide-up"
        style={{ animationDelay: '700ms' }}
      >
        <h3 className="font-display text-lg text-text-primary tracking-wide mb-0.5">
          Location Association vs Ease Score
        </h3>
        <p className="text-[10px] text-text-secondary mb-4">
          X = Location Association (P5) | Y = Ease Score (P1) | Dashed lines = median
        </p>

        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="Location"
              unit="%"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              label={{ value: 'Location Association (%)', position: 'bottom', fontSize: 10, fill: '#6B7280', offset: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Ease"
              unit="%"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              label={{ value: 'Ease Score (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6B7280', offset: 0 }}
            />
            <ZAxis range={[120, 120]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={medianX} stroke="#9CA3AF" strokeDasharray="4 4" label="" />
            <ReferenceLine y={medianY} stroke="#9CA3AF" strokeDasharray="4 4" label="" />
            <Scatter data={scatterData} shape="circle">
              {scatterData.map((entry) => (
                <Cell
                  key={entry.brand}
                  fill={entry.brand === focusedBrand ? ORANGE : GRAY}
                  stroke={entry.brand === focusedBrand ? ORANGE : '#9CA3AF'}
                  strokeWidth={entry.brand === focusedBrand ? 2 : 1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Brand labels below chart */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {scatterData.map((d) => (
            <span
              key={d.brand}
              className={`text-[10px] ${
                d.brand === focusedBrand ? 'font-semibold text-orange-primary' : 'text-text-secondary'
              }`}
            >
              {d.brand}
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Insight Panel */}
      <div className="bg-card rounded-card p-5 animate-slide-up" style={{ animationDelay: '750ms' }}>
        <h3 className="font-display text-base text-text-primary mb-3">Insight: {focusedBrand}</h3>
        <div className="space-y-3 text-[12px] text-text-secondary leading-relaxed">
          <p>{insightText}</p>
          {focusedPoint && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span>Location Association</span>
                <span className="font-semibold text-text-primary">{focusedPoint.x.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Ease Score</span>
                <span className="font-semibold text-text-primary">{focusedPoint.y.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Median Location</span>
                <span className="font-semibold text-text-primary">{medianX.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Median Ease</span>
                <span className="font-semibold text-text-primary">{medianY.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ========== PAGE COMPONENT ========== */
const Presence = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader, setFocusedBrand, activeSegment } = useFilters();
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

      {/* Overview mode: 6 metric bar cards + additional visuals */}
      {view === 'overview' && (
        <div className="space-y-4">
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
      {view === 'deepdive' && (() => {
        const fbData = allMetrics[fb]?.presence ?? {};
        const leaderData = allMetrics[leader]?.presence ?? {};

        // Ranking by presence score
        const ranked = [...brandNames].sort(
          (a, b) => (allMetrics[b]?.presence?.score ?? 0) - (allMetrics[a]?.presence?.score ?? 0),
        );
        const fbRank = ranked.indexOf(fb) + 1;

        // EBI data points
        const easeVal = (fbData.P1_easeScore ?? 0);
        const frictionRate = (fbData.P2_frictionRate ?? 0);
        const trialPen = (fbData.P3_trialPenetration ?? 0);
        const momentumVal = fbData.P4_frequencyMomentum ?? 0;

        return (
          <div className="space-y-4">
            {/* 3-column layout */}
            <div className="grid grid-cols-3 gap-4">
              {/* LEFT: Focused brand card */}
              <div className="bg-card rounded-card p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  {data?.brands?.find(b => b.name === fb)?.logo ? (
                    <img
                      src={data.brands.find(b => b.name === fb).logo}
                      alt={fb}
                      className="w-14 h-14 rounded-lg object-contain bg-gray-50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-xl text-orange-primary">{fb?.[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-text-primary">{fb}</h2>
                    <p className="text-[11px] text-text-secondary">Rank #{fbRank} of {brandNames.length}</p>
                  </div>
                  {fbRank <= 3 && <span className="text-orange-primary text-xl">&#9733;</span>}
                </div>

                <div className="text-center py-4 bg-orange-50 rounded-card mb-4">
                  <p className="font-display text-[48px] text-orange-primary">
                    {fmtMetric(fbData.score ?? 0, 'pct')}
                  </p>
                  <p className="text-[11px] text-text-secondary">Presence Score</p>
                  <p className="text-[12px] text-text-primary font-medium mt-1">Ease of Access</p>
                </div>

                <p className="font-display text-sm text-text-primary tracking-wide mb-2">What's Driving This Score</p>
                <div className="space-y-3">
                  {PRESENCE_KEYS.filter(k => k !== 'P1_easeScore').map((key) => {
                    const def = METRIC_DEFS[key];
                    const val = fbData[key] ?? 0;
                    const barVal = def.format === 'net' ? (val + 1) / 2 : val;
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
                              width: `${Math.max(0, barVal * 100)}%`,
                              backgroundColor: ORANGE,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE: Brand ranking sidebar */}
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
                        {fmtMetric(allMetrics[brand]?.presence?.score ?? 0, 'pct')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT: Strategic Actions — gap vs leader + EBI insights */}
              <div className="bg-card rounded-card p-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
                <h3 className="font-display text-lg text-text-primary mb-4">Strategic Actions</h3>

                {fb === leader ? (
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-[12px] text-green-800 font-medium">
                      {fb} is the category leader in presence with a score of{' '}
                      {fmtMetric(fbData.score ?? 0, 'pct')}.
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 rounded-lg p-4 mb-4">
                    <p className="text-[12px] text-orange-800 font-medium">
                      {fb} trails the leader ({leader}) by{' '}
                      {fmtMetric((leaderData.score ?? 0) - (fbData.score ?? 0), 'pct')} in overall
                      presence.
                    </p>
                  </div>
                )}

                <h4 className="text-[12px] font-semibold text-text-primary mb-3">
                  Gap vs Leader ({leader})
                </h4>
                <div className="space-y-3 mb-6">
                  {PRESENCE_KEYS.map((key) => {
                    const def = METRIC_DEFS[key];
                    const gap = (fbData[key] ?? 0) - (leaderData[key] ?? 0);
                    const isPositive = def.invert ? gap <= 0 : gap >= 0;
                    return (
                      <div key={key} className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary">{def.short}</span>
                        <span
                          className={`font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {gap >= 0 ? '+' : ''}
                          {(gap * 100).toFixed(1)}pp
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Below columns: distribution charts */}
            <EaseStackedBars data={data} brandNames={brandNames} focusedBrand={fb} />
            <LocationEaseScatter allMetrics={allMetrics} brandNames={brandNames} focusedBrand={fb} />

            {/* EBI Strategic Actions — placed AFTER all charts */}
            <div className="bg-card rounded-card p-5 animate-slide-up">
              <h3 className="font-display text-lg text-text-primary mb-3">EBI Strategic Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  easeVal < 0.5 && { badge: 'GROW', bg: 'bg-red-50', border: 'border-red-300', badgeBg: 'bg-red-500', title: 'Expand Distribution', desc: 'Expand distribution footprint — per EBI, physical availability to more category buyers is the primary growth lever' },
                  frictionRate > 0.15 && { badge: 'FRICTION', bg: 'bg-amber-50', border: 'border-amber-300', badgeBg: 'bg-amber-500', title: 'High Friction', desc: `${fmtMetric(frictionRate, 'pct')} find access difficult — per Double Jeopardy, small brands cannot afford to lose any access points` },
                  momentumVal < 0 && { badge: 'MOMENTUM', bg: 'bg-orange-50', border: 'border-orange-300', badgeBg: 'bg-orange-500', title: 'Declining Frequency', desc: 'Declining visit frequency — investigate whether competitors have expanded availability in your catchment areas' },
                  trialPen < 0.7 && { badge: 'REACH', bg: 'bg-blue-50', border: 'border-blue-300', badgeBg: 'bg-blue-500', title: 'Low Trial Penetration', desc: 'Low trial penetration — per EBI, growth comes from gaining new buyers (penetration) not increasing loyalty of existing ones' },
                  easeVal >= 0.7 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Strong Ease of Access', desc: `${fmtMetric(easeVal, 'pct')} — above 70% benchmark. Protect distribution coverage and maintain operational standards.` },
                  frictionRate <= 0.05 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Low Friction', desc: `Only ${fmtMetric(frictionRate, 'pct')} find access difficult. Maintain this by monitoring new competitor openings.` },
                  trialPen >= 0.9 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'High Trial', desc: `${fmtMetric(trialPen, 'pct')} have tried the brand — strong historical penetration. Focus on converting trialists to regulars.` },
                  momentumVal > 0.05 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Positive Momentum', desc: `Visit frequency growing at ${fmtMetric(momentumVal, 'net')} — brand is gaining physical availability share.` },
                  { badge: 'EBI', bg: 'bg-gray-50', border: 'border-gray-300', badgeBg: 'bg-gray-500', title: 'Core Principle', desc: 'Brands grow by being easy to buy. Distribution breadth is the #1 growth lever — every additional outlet reaches new category buyers.' },
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
      })()}
    </div>
  );
};

export default Presence;
