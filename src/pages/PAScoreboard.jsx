import { useState, useEffect, useMemo } from 'react';
import { useViewMode } from '../components/ViewModeContext.jsx';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { METRIC_DEFS, fmtMetric } from '../data/metrics.js';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Trophy, TrendUp, TrendDown, ArrowRight } from '@phosphor-icons/react';
import ExpandableCard from '../components/ExpandableCard.jsx';

const ORANGE = '#F36B1F';
const GRAY = '#D1D5DB';
const GREEN = '#2E7D32';
const BLUE = '#1565C0';
const RED = '#C62828';
// Dimension colors — consistent everywhere
const DIM_COLORS = { presence: '#F36B1F', prominence: '#FDB55B', portfolio: '#707070' };

/* ── Brand Ranking Card (horizontal, with logos) ── */
const BrandRankingStrip = ({ allMetrics, brandNames, focusedBrand, data }) => {
  const ranked = useMemo(() => {
    return [...brandNames]
      .map(b => {
        const m = allMetrics[b];
        const overall = ((m?.presence?.score ?? 0) + (m?.prominence?.score ?? 0) + (m?.portfolio?.score ?? 0)) / 3;
        return { brand: b, overall };
      })
      .sort((a, b) => b.overall - a.overall);
  }, [allMetrics, brandNames]);

  const logoMap = {};
  data?.brands?.forEach(b => { logoMap[b.name] = b.logo; });

  return (
    <ExpandableCard title="Brand Ranking">
    <div className="bg-card rounded-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-text-primary tracking-wide">Brand Ranking</h3>
        <span className="text-[11px] text-text-secondary">{brandNames.length} brands</span>
      </div>
      <div className="grid pb-1" style={{ gridTemplateColumns: `repeat(${ranked.length}, 1fr)`, gap: '8px' }}>
        {ranked.map((item, i) => {
          const isFocused = item.brand === focusedBrand;
          return (
            <div
              key={item.brand}
              className={`text-center p-3 rounded-card transition-all ${
                isFocused ? 'bg-orange-light ring-1 ring-orange-primary' : 'bg-gray-50'
              }`}
            >
              <p className={`text-[10px] font-bold mb-1 ${isFocused ? 'text-orange-primary' : 'text-text-secondary'}`}>
                #{i + 1}
              </p>
              <div className="w-10 h-10 mx-auto mb-1.5 rounded-full overflow-hidden bg-white flex items-center justify-center">
                {logoMap[item.brand] ? (
                  <img src={logoMap[item.brand]} alt={item.brand} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <span className="text-[11px] font-bold text-gray-400">{item.brand[0]}</span>
                )}
              </div>
              <p className={`text-[10px] font-medium truncate ${isFocused ? 'text-orange-primary' : 'text-text-primary'}`}>
                {item.brand}
              </p>
              <p className={`font-display text-[18px] leading-none mt-0.5 ${isFocused ? 'text-orange-primary' : 'text-text-primary'}`}>
                {(item.overall * 100).toFixed(1)}
                <span className="text-[10px] font-sans">%</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
    </ExpandableCard>
  );
};

/* ── Strategic Read ── */
const StrategicRead = ({ allMetrics, focusedBrand, brandNames, leader }) => {
  const fb = allMetrics[focusedBrand];
  const ld = allMetrics[leader];
  if (!fb || !ld) return null;

  const fbOverall = (fb.presence.score + fb.prominence.score + fb.portfolio.score) / 3;
  const ldOverall = (ld.presence.score + ld.prominence.score + ld.portfolio.score) / 3;

  // Find strongest and weakest dimension
  const dims = [
    { key: 'Presence', score: fb.presence.score },
    { key: 'Prominence', score: fb.prominence.score },
    { key: 'Portfolio', score: fb.portfolio.score },
  ].sort((a, b) => b.score - a.score);

  // Rank among brands
  const overallRanked = [...brandNames]
    .map(b => {
      const m = allMetrics[b];
      return { brand: b, overall: ((m?.presence?.score ?? 0) + (m?.prominence?.score ?? 0) + (m?.portfolio?.score ?? 0)) / 3 };
    })
    .sort((a, b) => b.overall - a.overall);
  const rank = overallRanked.findIndex(r => r.brand === focusedBrand) + 1;

  const gap = fbOverall - ldOverall;

  const insights = [
    `**${focusedBrand}** ranks **#${rank}** out of ${brandNames.length} brands with an overall PA score of **${(fbOverall * 100).toFixed(1)}%**, ${gap >= 0 ? 'leading' : `trailing the leader ${leader} by ${(Math.abs(gap) * 100).toFixed(1)}pp`}.`,
    `Strongest dimension is **${dims[0].key}** at ${(dims[0].score * 100).toFixed(1)}%. Growth lies in **${dims[2].key}** (${(dims[2].score * 100).toFixed(1)}%) — the largest opportunity gap.`,
    `Ease Score of ${(fb.presence.P1_easeScore * 100).toFixed(1)}% means ${fb.presence.P1_easeScore > 0.6 ? 'most category buyers find it convenient to dine in' : 'a significant portion of buyers find access difficult'}.`,
    `Positive Standout of ${(fb.prominence.PR1_impressionScore * 100).toFixed(1)}% means ${fb.prominence.PR1_impressionScore > 0.6 ? 'the brand stands out favourably at point of purchase' : 'the brand does not stand out enough to be noticed by category buyers'}.`,
  ];

  return (
    <div className="bg-card rounded-card p-5 animate-slide-up">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-3">Strategic Read</h3>
      <div className="space-y-2.5">
        {insights.map((text, i) => (
          <div key={i} className="flex gap-2.5 text-[12px] text-text-secondary leading-relaxed">
            <ArrowRight size={14} className="text-orange-primary flex-shrink-0 mt-0.5" weight="bold" />
            <p dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>') }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Strongest & Weakest PA ── */
const StrengthWeakness = ({ allMetrics, focusedBrand, brandNames }) => {
  const fb = allMetrics[focusedBrand];
  if (!fb) return null;

  // For each metric, compute the focused brand's RANK among all 10 brands.
  // A metric is "strong" when the brand ranks high (close to #1) among competitors.
  // For inverted metrics (Friction Rate), lower raw value = better rank.
  const all = Object.entries(METRIC_DEFS).map(([key, def]) => {
    const fbVal = fb[def.dim]?.[key] ?? 0;

    // Get all brands' values for this metric
    const brandVals = brandNames.map(b => ({
      brand: b,
      val: allMetrics[b]?.[def.dim]?.[key] ?? 0,
    }));

    // Sort: for inverted metrics (lower=better), sort ascending; otherwise descending
    if (def.invert) {
      brandVals.sort((a, b) => a.val - b.val);
    } else if (def.format === 'net') {
      brandVals.sort((a, b) => b.val - a.val);
    } else {
      brandVals.sort((a, b) => b.val - a.val);
    }

    const rank = brandVals.findIndex(b => b.brand === focusedBrand) + 1;

    return {
      key, label: def.label, short: def.short, dim: def.dim,
      value: fbVal, format: def.format, invert: def.invert,
      rank, // 1 = best, 10 = worst
    };
  });

  // Strongest = lowest rank number (best performing vs competitors)
  const sorted = [...all].sort((a, b) => a.rank - b.rank);
  const top3 = sorted.slice(0, 3);
  // Weakest = highest rank number (worst performing vs competitors)
  const bottom3 = sorted.slice(-3).reverse();

  const renderItem = (item, color) => (
    <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: color }}>
          {item.rank}
        </span>
        <span className="text-[11px] text-text-primary font-medium">{item.label}</span>
        <span className="text-[9px] text-text-secondary uppercase">{item.dim}</span>
      </div>
      <span className="text-[12px] font-semibold text-text-primary">{fmtMetric(item.value, item.format)}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4 animate-slide-up">
      <div className="bg-card rounded-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendUp size={18} className="text-green-positive" weight="bold" />
          <h3 className="font-display text-lg text-text-primary tracking-wide">Strongest</h3>
        </div>
        {top3.map(m => renderItem(m, GREEN))}
      </div>
      <div className="bg-card rounded-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendDown size={18} className="text-red-negative" weight="bold" />
          <h3 className="font-display text-lg text-text-primary tracking-wide">Weakest</h3>
        </div>
        {bottom3.map(m => renderItem(m, RED))}
      </div>
    </div>
  );
};

/* ── Customer Journey Funnel ── */
const FUNNEL_STAGES = [
  { key: 'Unaware', label: 'Unaware', color: '#9CA3AF' },
  { key: 'Know but untried', label: 'Know', color: '#D1D5DB' },
  { key: 'Lapsed', label: 'Lapsed', color: '#FDE047' },
  { key: 'Occasional', label: 'Occasional', color: '#22C55E' },
  { key: 'Regular', label: 'Regular', color: '#166534' },
];

const CustomerFunnel = ({ data, focusedBrand }) => {
  const opts = data?.paData?.q15?.[focusedBrand]?.options;
  if (!opts) return null;

  const stages = FUNNEL_STAGES.map(s => ({
    ...s,
    value: (opts[s.key]?.Total ?? 0) * 100,
  }));

  return (
    <div className="bg-card rounded-card p-5 animate-slide-up">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-1">Customer Journey Funnel</h3>
      <p className="text-[10px] text-text-secondary mb-4">{focusedBrand} — relationship stages from survey</p>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const maxWidth = Math.max(...stages.map(x => x.value), 1);
          const width = (s.value / maxWidth) * 100;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-[10px] text-text-secondary w-16 text-right">{s.label}</span>
              <div className="flex-1 h-7 bg-gray-100 rounded-[4px] overflow-hidden relative">
                <div className="h-full rounded-[4px]" style={{ width: `${width}%`, backgroundColor: s.color }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-text-primary">
                  {s.value.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Radar Comparison (for Overall PA tab) — all 18 metrics ── */
const RADAR_METRICS = Object.entries(METRIC_DEFS).map(([key, def]) => ({
  key, dim: def.dim, label: def.short,
}));

const RadarComparison = ({ allMetrics, focusedBrand, leader }) => {
  const radarData = RADAR_METRICS.map(m => ({
    metric: m.label,
    [focusedBrand]: (allMetrics[focusedBrand]?.[m.dim]?.[m.key] ?? 0) * 100,
    ...(leader && leader !== focusedBrand ? { [leader]: (allMetrics[leader]?.[m.dim]?.[m.key] ?? 0) * 100 } : {}),
  }));

  return (
    <ExpandableCard title={`${focusedBrand} vs ${leader && leader !== focusedBrand ? leader : 'Leader'} — Radar`}>
    <div className="bg-card rounded-card p-5 animate-slide-up">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">
        {focusedBrand} vs {leader && leader !== focusedBrand ? leader : 'Leader'}
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
          <Radar name={focusedBrand} dataKey={focusedBrand} stroke={ORANGE} fill={ORANGE} fillOpacity={0.25} />
          {leader && leader !== focusedBrand && (
            <Radar name={leader} dataKey={leader} stroke={BLUE} fill={BLUE} fillOpacity={0.15} />
          )}
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
    </ExpandableCard>
  );
};

/* ── Full Ranking Table (for Overall PA tab) ── */
const FullRankingTable = ({ allMetrics, brandNames, focusedBrand }) => {
  const rows = useMemo(() => {
    return [...brandNames]
      .map(b => {
        const m = allMetrics[b];
        return {
          brand: b,
          presence: m?.presence?.score ?? 0,
          prominence: m?.prominence?.score ?? 0,
          portfolio: m?.portfolio?.score ?? 0,
        };
      })
      .sort((a, b) => b.presence - a.presence);
  }, [allMetrics, brandNames]);

  return (
    <ExpandableCard title="All Brands — Dimension Scores">
    <div className="bg-card rounded-card p-5 animate-slide-up">
      <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">All Brands — Dimension Scores</h3>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 px-3 text-text-secondary">#</th>
            <th className="text-left py-2 px-3 text-text-secondary">Brand</th>
            <th className="text-right py-2 px-3 text-text-secondary">Presence</th>
            <th className="text-right py-2 px-3 text-text-secondary">Prominence</th>
            <th className="text-right py-2 px-3 text-text-secondary">Portfolio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isFocused = row.brand === focusedBrand;
            return (
              <tr key={row.brand} className={`border-b border-gray-100 ${isFocused ? 'bg-orange-light font-semibold' : 'hover:bg-gray-50'}`}>
                <td className="py-2 px-3">{i === 0 ? <Trophy size={14} weight="fill" className="text-orange-primary" /> : i + 1}</td>
                <td className={`py-2 px-3 ${isFocused ? 'text-orange-primary' : ''}`}>{row.brand}</td>
                <td className="py-2 px-3 text-right">{(row.presence * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right">{(row.prominence * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right">{(row.portfolio * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </ExpandableCard>
  );
};

/* ── Metric Breakdown (for Overall PA tab) ── */
const MetricBreakdown = ({ fbMetrics, focusedBrand }) => (
  <ExpandableCard title={`Metric Breakdown: ${focusedBrand}`}>
  <div className="bg-card rounded-card p-5 animate-slide-up">
    <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">Metric Breakdown: {focusedBrand}</h3>
    <div className="grid grid-cols-3 gap-6">
      {['presence', 'prominence', 'portfolio'].map(dim => {
        const dimKeys = Object.keys(METRIC_DEFS).filter(k => METRIC_DEFS[k].dim === dim);
        return (
          <div key={dim}>
            <h4 className="font-display text-sm text-text-primary tracking-wide uppercase mb-3">{dim}</h4>
            <div className="space-y-2">
              {dimKeys.map(key => {
                const def = METRIC_DEFS[key];
                const val = fbMetrics?.[dim]?.[key] ?? 0;
                return (
                  <div key={key} className="flex justify-between items-center text-[12px]">
                    <span className="text-text-secondary">{def.label}</span>
                    <span className="font-semibold text-text-primary">{fmtMetric(val, def.format)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
  </ExpandableCard>
);

/* ========== PAGE COMPONENT ========== */
const PAScoreboard = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames, allMetrics, leader } = useFilters();
  const { data, loading, error } = useData();
  const { setCurrentGuide } = useGuide();
  const [view, setView] = useState('overview');

  useEffect(() => {
    setCurrentGuide({ sections: guides['/'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/',
      modes: [
        { key: 'overview', label: 'Overview' },
        { key: 'overall', label: 'Overall PA' },
      ],
      current: view,
      onChange: setView,
    });
    return () => setViewMode(null);
  }, [setViewMode, view]);

  if (loading || !allMetrics || !data) {
    return <div className="p-6 flex items-center justify-center h-[calc(100vh-155px)]"><p className="text-text-secondary">Loading...</p></div>;
  }
  if (error) {
    return <div className="p-6 flex items-center justify-center h-[calc(100vh-155px)]"><p className="text-red-500">Failed to load data.</p></div>;
  }

  const fb = focusedBrand || brandNames[0];
  const fbMetrics = allMetrics[fb];
  const presenceVal = fbMetrics?.presence?.score ?? 0;
  const prominenceVal = fbMetrics?.prominence?.score ?? 0;
  const portfolioVal = fbMetrics?.portfolio?.score ?? 0;

  // Blueprint KPI cards: show PRIMARY metric per dimension (P1, PR1, PO1)
  const p1Val = fbMetrics?.presence?.P1_easeScore ?? 0;
  const pr1Val = fbMetrics?.prominence?.PR1_impressionScore ?? 0;
  const po1Val = fbMetrics?.portfolio?.PO1_varietyPerception ?? 0;
  const leaderMetrics = allMetrics[leader];
  const p1Leader = leaderMetrics?.presence?.P1_easeScore ?? 0;
  const pr1Leader = leaderMetrics?.prominence?.PR1_impressionScore ?? 0;
  const po1Leader = leaderMetrics?.portfolio?.PO1_varietyPerception ?? 0;

  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">PA Scoreboard</h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">Physical Availability overview for {fb}</p>
        <div className="mt-2"><PageViewModeFallback /></div>
      </div>

      {view === 'overview' ? (
        <div className="space-y-5">
          {/* 1. Focused Brand KPI Cards — Blueprint: show P1, PR1, PO1 with vs-leader delta */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Presence', sub: 'Ease Score (P1)', val: p1Val, ldrVal: p1Leader, color: DIM_COLORS.presence },
              { label: 'Prominence', sub: 'Positive Standout', val: pr1Val, ldrVal: pr1Leader, color: DIM_COLORS.prominence },
              { label: 'Portfolio', sub: 'Variety Perception (PO1)', val: po1Val, ldrVal: po1Leader, color: DIM_COLORS.portfolio },
            ].map((card, i) => {
              const delta = card.val - card.ldrVal;
              return (
                <div key={card.label} className="bg-card rounded-card p-5 text-center animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-1">{card.label}</p>
                  <p className="font-display text-[42px] leading-none" style={{ color: card.color }}>{(card.val * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-text-secondary mt-1">{card.sub}</p>
                  {leader && leader !== fb && (
                    <p className={`text-[10px] font-semibold mt-0.5 ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}pp vs {leader}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. Brand Ranking Strip */}
          <BrandRankingStrip allMetrics={allMetrics} brandNames={brandNames} focusedBrand={fb} data={data} />

          {/* 3. Strategic Read */}
          <StrategicRead allMetrics={allMetrics} focusedBrand={fb} brandNames={brandNames} leader={leader} />

          {/* 4. Strongest & Weakest PA */}
          <StrengthWeakness allMetrics={allMetrics} focusedBrand={fb} brandNames={brandNames} />

        </div>
      ) : (
        /* Overall PA tab */
        <div className="space-y-5">
          {/* 3 Dimension cards in a row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Presence', val: presenceVal, color: DIM_COLORS.presence, desc: 'Ease of Access' },
              { label: 'Prominence', val: prominenceVal, color: DIM_COLORS.prominence, desc: 'Positive Standout' },
              { label: 'Portfolio', val: portfolioVal, color: DIM_COLORS.portfolio, desc: 'Range Coverage' },
            ].map((d, i) => (
              <div key={d.label} className="bg-card rounded-card p-5 text-center animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-1">{d.label}</p>
                <p className="font-display text-[42px] leading-none" style={{ color: d.color }}>{(d.val * 100).toFixed(1)}%</p>
                <p className="text-[11px] text-text-secondary mt-1">{d.desc}</p>
              </div>
            ))}
          </div>

          {/* Radar + Ranking Table side by side */}
          <div className="grid grid-cols-2 gap-4">
            <RadarComparison allMetrics={allMetrics} focusedBrand={fb} leader={leader} />
            <FullRankingTable allMetrics={allMetrics} brandNames={brandNames} focusedBrand={fb} />
          </div>

          {/* Full 18-metric comparison: all brands */}
          <ExpandableCard title="All Metrics — 10 Brands">
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">All Metrics — 10 Brands</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-2 text-text-secondary sticky left-0 bg-white">Metric</th>
                    {[...brandNames].sort((a, b) => {
                      const aO = ((allMetrics[a]?.presence?.score ?? 0) + (allMetrics[a]?.prominence?.score ?? 0) + (allMetrics[a]?.portfolio?.score ?? 0)) / 3;
                      const bO = ((allMetrics[b]?.presence?.score ?? 0) + (allMetrics[b]?.prominence?.score ?? 0) + (allMetrics[b]?.portfolio?.score ?? 0)) / 3;
                      return bO - aO;
                    }).map(b => (
                      <th key={b} className={`text-right py-2 px-2 whitespace-nowrap ${b === fb ? 'text-orange-primary font-bold' : 'text-text-secondary'}`}>
                        {b}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(METRIC_DEFS).map(([key, def]) => {
                    const sortedBrands = [...brandNames].sort((a, b) => {
                      const aO = ((allMetrics[a]?.presence?.score ?? 0) + (allMetrics[a]?.prominence?.score ?? 0) + (allMetrics[a]?.portfolio?.score ?? 0)) / 3;
                      const bO = ((allMetrics[b]?.presence?.score ?? 0) + (allMetrics[b]?.prominence?.score ?? 0) + (allMetrics[b]?.portfolio?.score ?? 0)) / 3;
                      return bO - aO;
                    });
                    const vals = sortedBrands.map(b => allMetrics[b]?.[def.dim]?.[key] ?? 0);
                    const sorted = [...vals].sort((a, b) => def.invert ? a - b : b - a);
                    const top3 = sorted.slice(0, 3);
                    const bot3 = sorted.slice(-3);

                    return (
                      <tr key={key} className="border-b border-gray-50">
                        <td className="py-1.5 px-2 text-text-secondary font-medium sticky left-0 bg-white whitespace-nowrap">
                          {def.short}
                          <span className="text-[9px] text-gray-400 ml-1 uppercase">{def.dim[0]}</span>
                        </td>
                        {sortedBrands.map(b => {
                          const v = allMetrics[b]?.[def.dim]?.[key] ?? 0;
                          const isTop = top3.includes(v) && (def.invert ? v <= top3[top3.length - 1] : v >= top3[top3.length - 1]);
                          const isBot = bot3.includes(v) && (def.invert ? v >= bot3[0] : v <= bot3[0]);
                          return (
                            <td key={b} className={`py-1.5 px-2 text-right ${
                              b === fb ? 'font-bold' : ''
                            } ${isTop ? 'text-green-700 bg-green-50' : isBot ? 'text-red-700 bg-red-50' : 'text-text-primary'}`}>
                              {fmtMetric(v, def.format)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </ExpandableCard>

          {/* Gap vs Leader for focused brand */}
          <ExpandableCard title={`${fb} vs Leader (${leader}) — Gap Analysis`}>
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">{fb} vs Leader ({leader}) — Gap Analysis</h3>
            <div className="grid grid-cols-3 gap-6">
              {['presence', 'prominence', 'portfolio'].map(dim => {
                const dimKeys = Object.keys(METRIC_DEFS).filter(k => METRIC_DEFS[k].dim === dim);
                return (
                  <div key={dim}>
                    <h4 className="font-display text-sm text-text-primary uppercase tracking-wide mb-3">{dim}</h4>
                    <div className="space-y-2">
                      {dimKeys.map(key => {
                        const def = METRIC_DEFS[key];
                        const fbVal = fbMetrics?.[dim]?.[key] ?? 0;
                        const ldVal = allMetrics[leader]?.[dim]?.[key] ?? 0;
                        const gap = fbVal - ldVal;
                        return (
                          <div key={key} className="flex items-center justify-between text-[11px]">
                            <span className="text-text-secondary">{def.short}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">{fmtMetric(fbVal, def.format)}</span>
                              <span className={`text-[10px] font-semibold ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {gap >= 0 ? '+' : ''}{(gap * 100).toFixed(1)}pp
                              </span>
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
          </ExpandableCard>

          {/* EBI Strategic Actions */}
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <h3 className="font-display text-lg text-text-primary mb-3">EBI Strategic Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                presenceVal < 0.5 && { badge: 'PRESENCE', bg: 'bg-red-50', border: 'border-red-300', badgeBg: 'bg-red-500', title: 'Low Ease of Access', desc: 'Ease of Access below 50% — distribution expansion is the top priority per EBI' },
                prominenceVal < 0.5 && { badge: 'PROMINENCE', bg: 'bg-amber-50', border: 'border-amber-300', badgeBg: 'bg-amber-500', title: 'Brand Not Noticed', desc: 'Brand not noticed — invest in distinctive assets to increase salience at point of purchase' },
                portfolioVal < 0.1 && { badge: 'PORTFOLIO', bg: 'bg-blue-50', border: 'border-blue-300', badgeBg: 'bg-blue-500', title: 'Narrow Range', desc: 'Narrow range coverage — expand menu to cover more category buying occasions' },
                presenceVal >= 0.7 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'Strong Presence', desc: `${fmtMetric(presenceVal, 'pct')} — above 70%. Protect distribution network and maintain operational standards.` },
                prominenceVal >= 0.65 && { badge: 'STRONG', bg: 'bg-green-50', border: 'border-green-300', badgeBg: 'bg-green-600', title: 'High Prominence', desc: `${fmtMetric(prominenceVal, 'pct')} — brand stands out at point of purchase. Maintain distinctive brand assets.` },
                { badge: 'EBI', bg: 'bg-gray-50', border: 'border-gray-300', badgeBg: 'bg-gray-500', title: 'Core Principle', desc: 'Physical Availability = being easy to find + easy to notice + offering what buyers need. Per Ehrenberg-Bass, brands grow by reaching more category buyers through broader distribution, not by targeting segments.' },
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
      )}
    </div>
  );
};

export default PAScoreboard;
