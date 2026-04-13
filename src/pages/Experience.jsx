import { useState, useEffect, useMemo } from 'react';
import { useViewMode } from '../components/ViewModeContext.jsx';
import { useFilters, useData, useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';
import PageViewModeFallback from '../components/PageViewModeFallback.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

const ORANGE = '#F36B1F';
const GREEN = '#2E7D32';
const RED = '#C62828';
const BLUE = '#1565C0';
const GRAY = '#9CA3AF';

// Alignment categories per Blueprint
const getAlignment = (surveyPct, reviewPosPct, surveyMedian) => {
  const highSurvey = surveyPct >= surveyMedian;
  const highReview = reviewPosPct >= 0.6;
  if (highSurvey && highReview) return { cat: 'Reinforced', color: GREEN, bg: 'bg-green-50', border: 'border-green-300', icon: '✅', action: 'Protect' };
  if (highSurvey && !highReview) return { cat: 'Broken Promise', color: RED, bg: 'bg-red-50', border: 'border-red-300', icon: '⚠️', action: 'Fix Operations' };
  if (!highSurvey && highReview) return { cat: 'Missed Opportunity', color: BLUE, bg: 'bg-blue-50', border: 'border-blue-300', icon: '💡', action: 'Amplify' };
  return { cat: 'Low Priority', color: GRAY, bg: 'bg-gray-50', border: 'border-gray-300', icon: '⏸️', action: 'Park' };
};

// Map review attributes to Q24 survey attributes
const ATTR_TO_Q24 = {
  'Taste and Flavour of Food': 'Taste',
  'Quality of Ingredients': null,
  'Price and Value for Money': 'Price',
  'Special Offers and Promotions': null,
  'Menu Variety and Options': 'Variety',
  'Healthy and Nutritional Options': 'Health',
  'Innovation and Unique Offerings': 'Innovation',
  'Location and Accessibility': 'Location',
  'Ambiance and Comfort': null,
  'Cleanliness and Hygiene': null,
  'Customer Service and Friendliness': null,
  'Speed of Service and Convenience': null,
  'Brand Reputation and Reviews': 'Reputation',
  'Popularity and Market Presence': null,
  'Clientele and Social Environment': null,
};

// Normalize brand names between review data and survey data
const normalizeBrandForSurvey = (reviewBrand) => {
  const map = { "McDonald's": "McDonalds", "Kfc": "KFC", "Shawarma House": "Bayt Al-Shawarma" };
  return map[reviewBrand] || reviewBrand;
};

const Experience = () => {
  const { setViewMode } = useViewMode();
  const { focusedBrand, brandNames } = useFilters();
  const { data, loading } = useData();
  const { setCurrentGuide } = useGuide();
  const [view, setView] = useState('overview');

  useEffect(() => {
    setCurrentGuide({ sections: guides['/experience'].sections });
    return () => setCurrentGuide(null);
  }, [setCurrentGuide]);

  useEffect(() => {
    setViewMode({
      path: '/experience',
      modes: [
        { key: 'overview', label: 'Overview' },
        { key: 'table', label: 'Alignment Table' },
        { key: 'deepdive', label: 'Deep-Dive' },
      ],
      current: view,
      onChange: setView,
    });
    return () => setViewMode(null);
  }, [setViewMode, view]);

  const reviews = data?.reviewsData;

  // Find matching brand in review data
  const reviewBrand = useMemo(() => {
    if (!reviews?.meta?.brands || !focusedBrand) return null;
    // Map survey brand to review brand
    const revMap = { "McDonalds": "McDonald's", "KFC": "Kfc", "Bayt Al-Shawarma": "Shawarma House" };
    return revMap[focusedBrand] || focusedBrand;
  }, [reviews, focusedBrand]);

  // Compute alignment data for focused brand
  const alignmentData = useMemo(() => {
    if (!reviews || !reviewBrand || !data?.paData) return [];
    const attrSent = reviews.attributeSentiment;
    const attrDist = reviews.attributeDistribution;
    const surveyData = data.paData.q24;
    const attrs = reviews.meta.attributes;

    // Get survey values for this brand
    const surveyVals = {};
    Object.entries(ATTR_TO_Q24).forEach(([reviewAttr, q24Key]) => {
      if (q24Key && surveyData?.[q24Key]) {
        const survBrand = normalizeBrandForSurvey(reviewBrand) === focusedBrand ? focusedBrand : normalizeBrandForSurvey(reviewBrand);
        surveyVals[reviewAttr] = surveyData[q24Key]?.[survBrand]?.Total || surveyData[q24Key]?.[focusedBrand]?.Total || 0;
      }
    });

    // Median survey value for this brand
    const surveyValues = Object.values(surveyVals).filter(v => v > 0);
    const sortedSurvey = [...surveyValues].sort((a, b) => a - b);
    const surveyMedian = sortedSurvey.length > 0 ? sortedSurvey[Math.floor(sortedSurvey.length / 2)] : 0.1;

    return attrs.map(attr => {
      const brandSent = attrSent?.[attr]?.[reviewBrand];
      if (!brandSent) return null;
      const total = brandSent.positive + brandSent.negative + brandSent.neutral;
      if (total < 0.001) return null;
      const posPct = brandSent.positive / total;
      const negPct = brandSent.negative / total;
      const surveyPct = surveyVals[attr] || 0;
      const alignment = getAlignment(surveyPct, posPct, surveyMedian);
      const attrShare = attrDist?.[attr]?.[reviewBrand] || 0;

      return {
        attribute: attr,
        shortAttr: attr.replace(' and ', ' & ').replace(' of ', ' ').replace('Customer Service & Friendliness', 'Service').replace('Speed of Service & Convenience', 'Speed'),
        surveyPct,
        reviewPosPct: posPct,
        reviewNegPct: negPct,
        reviewVolume: attrShare,
        ...alignment,
      };
    }).filter(Boolean);
  }, [reviews, reviewBrand, data, focusedBrand]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'Reinforced': 0, 'Broken Promise': 0, 'Missed Opportunity': 0, 'Low Priority': 0 };
    alignmentData.forEach(d => { counts[d.cat]++; });
    return counts;
  }, [alignmentData]);

  // Sentiment summary
  const sentimentSummary = useMemo(() => {
    if (!reviews?.sentimentDistribution || !reviewBrand) return null;
    return {
      positive: reviews.sentimentDistribution.Positive?.[reviewBrand] || 0,
      negative: reviews.sentimentDistribution.Negative?.[reviewBrand] || 0,
      neutral: reviews.sentimentDistribution.Neutral?.[reviewBrand] || 0,
    };
  }, [reviews, reviewBrand]);

  if (loading) return <div className="p-6"><p className="text-text-secondary">Loading...</p></div>;

  if (!reviews) {
    return (
      <div className="p-6 min-h-[calc(100vh-155px)]">
        <div className="flex flex-col flex-shrink-0 mb-3">
          <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Experience vs Memory</h1>
          <p className="text-[11px] text-text-secondary font-medium mt-1">Compares survey associations (Memory) with Google Reviews sentiment (Experience)</p>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-300px)]">
          <div className="bg-card rounded-card p-10 text-center max-w-lg"><p className="text-text-secondary">Review data not available.</p></div>
        </div>
      </div>
    );
  }

  const fb = focusedBrand || brandNames[0];

  return (
    <div className="p-6 min-h-[calc(100vh-155px)]">
      <div className="flex flex-col flex-shrink-0 mb-3">
        <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Experience vs Memory</h1>
        <p className="text-[11px] text-text-secondary font-medium mt-1">
          Compares survey brand associations (Memory) with Google Reviews sentiment (Experience) for {fb}
        </p>
        <div className="mt-2"><PageViewModeFallback /></div>
      </div>

      {view === 'overview' ? (
        <div className="space-y-5">
          {/* Alignment category cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { cat: 'Reinforced', icon: '✅', color: GREEN, bg: 'bg-green-50', desc: 'Memory = Experience' },
              { cat: 'Broken Promise', icon: '⚠️', color: RED, bg: 'bg-red-50', desc: 'High memory, low experience' },
              { cat: 'Missed Opportunity', icon: '💡', color: BLUE, bg: 'bg-blue-50', desc: 'Low memory, high experience' },
              { cat: 'Low Priority', icon: '⏸️', color: GRAY, bg: 'bg-gray-50', desc: 'Low on both' },
            ].map(c => (
              <div key={c.cat} className={`${c.bg} rounded-card p-4 text-center animate-slide-up`}>
                <p className="text-2xl mb-1">{c.icon}</p>
                <p className="font-display text-[32px] leading-none" style={{ color: c.color }}>{categoryCounts[c.cat]}</p>
                <p className="text-[11px] font-semibold text-text-primary mt-1">{c.cat}</p>
                <p className="text-[9px] text-text-secondary">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Sentiment overview */}
          {sentimentSummary && (
            <div className="bg-card rounded-card p-5 animate-slide-up">
              <h3 className="font-display text-xl text-text-primary tracking-wide mb-3">{fb} — Overall Review Sentiment</h3>
              <div className="flex items-center gap-2 h-8 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${sentimentSummary.positive * 100}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${sentimentSummary.negative * 100}%` }} />
                <div className="h-full bg-gray-300 rounded-r-full" style={{ width: `${sentimentSummary.neutral * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[11px]">
                <span className="text-green-700">Positive: {(sentimentSummary.positive * 100).toFixed(1)}%</span>
                <span className="text-red-700">Negative: {(sentimentSummary.negative * 100).toFixed(1)}%</span>
                <span className="text-gray-500">Neutral: {(sentimentSummary.neutral * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Quadrant scatter */}
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-3">Attribute Alignment Quadrant</h3>
            <p className="text-[10px] text-text-secondary mb-3">X = Survey Association (Memory) | Y = Review Positive % (Experience) | Dot size = Review volume</p>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <XAxis type="number" dataKey="x" name="Survey %" tick={{ fontSize: 10 }} domain={[0, 'auto']}
                  label={{ value: 'Survey Association (Memory)', position: 'bottom', fontSize: 10, offset: -5 }} />
                <YAxis type="number" dataKey="y" name="Review %" tick={{ fontSize: 10 }} domain={[0, 1]}
                  label={{ value: 'Review Positive % (Experience)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ZAxis type="number" dataKey="z" range={[40, 200]} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]?.payload) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-2 text-[11px] shadow-lg">
                      <p className="font-semibold">{d.attribute}</p>
                      <p>Survey: {(d.x * 100).toFixed(1)}% | Review Pos: {(d.y * 100).toFixed(1)}%</p>
                      <p style={{ color: d.dotColor }}>Category: {d.cat}</p>
                    </div>
                  );
                }} />
                <Scatter data={alignmentData.map(d => ({
                  x: d.surveyPct,
                  y: d.reviewPosPct,
                  z: d.reviewVolume * 1000,
                  attribute: d.attribute,
                  cat: d.cat,
                  dotColor: d.color,
                }))} >
                  {alignmentData.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Attribute cards grouped by alignment */}
          {['Reinforced', 'Broken Promise', 'Missed Opportunity'].map(cat => {
            const items = alignmentData.filter(d => d.cat === cat);
            if (items.length === 0) return null;
            const catInfo = items[0];
            return (
              <div key={cat} className="bg-card rounded-card p-5 animate-slide-up">
                <h3 className="font-display text-lg text-text-primary tracking-wide mb-3">
                  {catInfo.icon} {cat} ({items.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {items.map(item => (
                    <div key={item.attribute} className={`p-3 rounded-[8px] border ${catInfo.border} ${catInfo.bg}`}>
                      <p className="text-[11px] font-semibold text-text-primary mb-2">{item.attribute}</p>
                      <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                        <span>Survey</span><span>{(item.surveyPct * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full mb-2">
                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(item.surveyPct * 500, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                        <span>Review Pos.</span><span>{(item.reviewPosPct * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${item.reviewPosPct * 100}%`, backgroundColor: catInfo.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === 'table' ? (
        <div className="bg-card rounded-card p-5 animate-slide-up">
          <h3 className="font-display text-xl text-text-primary tracking-wide mb-4">Full Attribute Alignment Table — {fb}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 text-text-secondary">Attribute</th>
                  <th className="text-right py-2 px-3 text-text-secondary">Survey %</th>
                  <th className="text-right py-2 px-3 text-text-secondary">Review Pos %</th>
                  <th className="text-right py-2 px-3 text-text-secondary">Review Neg %</th>
                  <th className="text-right py-2 px-3 text-text-secondary">Volume</th>
                  <th className="text-left py-2 px-3 text-text-secondary">Category</th>
                  <th className="text-left py-2 px-3 text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {alignmentData.sort((a, b) => b.reviewVolume - a.reviewVolume).map(d => (
                  <tr key={d.attribute} className={`border-b border-gray-100 ${d.bg}`}>
                    <td className="py-2 px-3 font-medium">{d.attribute}</td>
                    <td className="py-2 px-3 text-right">{d.surveyPct > 0 ? `${(d.surveyPct * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-2 px-3 text-right text-green-700">{(d.reviewPosPct * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-red-700">{(d.reviewNegPct * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right">{(d.reviewVolume * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-semibold" style={{ color: d.color }}>{d.icon} {d.cat}</span>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-text-secondary">{d.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Deep-dive: sample reviews for focused brand */
        <div className="space-y-5">
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-lg bg-orange-light flex items-center justify-center">
                <span className="font-display text-xl text-orange-primary">{fb?.[0]}</span>
              </div>
              <div>
                <h2 className="font-display text-2xl text-text-primary">{fb}</h2>
                <p className="text-[11px] text-text-secondary">Review Deep-Dive — {reviews.meta.totalReviews.toLocaleString()} total reviews</p>
              </div>
            </div>

            {/* Attribute breakdown bars */}
            <h3 className="font-display text-lg text-text-primary mb-3">Attribute Sentiment Breakdown</h3>
            <div className="space-y-2">
              {alignmentData
                .sort((a, b) => b.reviewVolume - a.reviewVolume)
                .map(d => {
                  const total = d.reviewVolume;
                  if (total < 0.005) return null;
                  return (
                    <div key={d.attribute} className="flex items-center gap-2">
                      <span className="text-[10px] w-40 truncate text-text-secondary">{d.attribute}</span>
                      <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-gray-100">
                        <div className="h-full bg-green-500" style={{ width: `${d.reviewPosPct * 100}%` }} />
                        <div className="h-full bg-red-500" style={{ width: `${d.reviewNegPct * 100}%` }} />
                        <div className="h-full bg-gray-300" style={{ width: `${(1 - d.reviewPosPct - d.reviewNegPct) * 100}%` }} />
                      </div>
                      <span className="text-[10px] w-12 text-right text-text-secondary">{(d.reviewVolume * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Sample reviews */}
          <div className="bg-card rounded-card p-5 animate-slide-up">
            <h3 className="font-display text-lg text-text-primary mb-3">Sample Reviews</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {reviews.sampleReviews
                ?.filter(r => r.brand === reviewBrand)
                .slice(0, 30)
                .map((r, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-[8px] text-[11px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                        r.sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                        r.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>{r.sentiment}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px]">{r.attribute}</span>
                      <span className="text-text-secondary ml-auto">{r.date}</span>
                    </div>
                    <p className="text-text-primary">{r.justification}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experience;
