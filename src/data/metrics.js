// Physical Availability Metrics Engine
// Works with pre-computed percentage data from pa_data.json

const getVal = (obj, ...keys) => {
  let current = obj;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return 0;
    current = current[key];
  }
  return typeof current === 'number' ? current : 0;
};

const findOption = (options, substring) => {
  if (!options) return null;
  const lc = substring.toLowerCase();
  const keys = Object.keys(options);
  // First try: starts with the substring
  const startsWith = keys.find(k => k.toLowerCase().startsWith(lc));
  if (startsWith) return startsWith;
  // Fallback: contains substring (but avoid false positives like "Inconvenient" matching "convenient")
  return keys.find(k => {
    const klc = k.toLowerCase();
    const idx = klc.indexOf(lc);
    // Must match at word boundary (start of string or after space/punctuation)
    return idx >= 0 && (idx === 0 || /[\s\/–—,]/.test(klc[idx - 1]));
  });
};

// PRESENCE (P1-P6)
export const easeScore = (data, brand, seg = 'Total') => {
  const opts = data?.q18?.[brand]?.options;
  if (!opts) return 0;
  const key = findOption(opts, 'Convenient');
  return key ? getVal(opts, key, seg) : 0;
};

export const frictionRate = (data, brand, seg = 'Total') => {
  const opts = data?.q18?.[brand]?.options;
  if (!opts) return 0;
  const key = findOption(opts, 'Impossible');
  return key ? getVal(opts, key, seg) : 0;
};

export const trialPenetration = (data, brand, seg = 'Total') => {
  const opts = data?.q15?.[brand]?.options;
  if (!opts) return 0;
  return getVal(opts, 'Lapsed', seg) + getVal(opts, 'Occasional', seg) + getVal(opts, 'Regular', seg);
};

export const frequencyMomentum = (data, brand, seg = 'Total') => {
  const opts = data?.q17?.[brand]?.options;
  if (!opts) return 0;
  const moreKey = findOption(opts, 'More frequent');
  const lessKey = findOption(opts, 'Less frequent');
  return (moreKey ? getVal(opts, moreKey, seg) : 0) - (lessKey ? getVal(opts, lessKey, seg) : 0);
};

export const locationAssociation = (data, brand, seg = 'Total') => {
  return getVal(data, 'q24', 'Location', brand, seg);
};

export const locationLoyalty = (data, seg = 'Total') => {
  const reasons = data?.q25?.reasons;
  if (!reasons) return 0;
  const key = Object.keys(reasons).find(k => k.toLowerCase().includes('location'));
  return key ? getVal(reasons, key, seg) : 0;
};

// PROMINENCE (PR1-PR6)
export const impressionScore = (data, brand, seg = 'Total') => {
  const opts = data?.q19?.[brand]?.options;
  if (!opts) return 0;
  const key = findOption(opts, 'Positive');
  return key ? getVal(opts, key, seg) : 0;
};

export const valueStandout = (data, brand, seg = 'Total') => {
  const opts = data?.q20?.[brand]?.options;
  if (!opts) return 0;
  const key = findOption(opts, 'Much better') || findOption(opts, 'good value');
  return key ? getVal(opts, key, seg) : 0;
};

export const perceivedMomentum = (data, brand, seg = 'Total') => {
  const opts = data?.q21?.[brand]?.options;
  if (!opts) return 0;
  const key = findOption(opts, 'More popular') || findOption(opts, 'growing');
  return key ? getVal(opts, key, seg) : 0;
};

export const adCutThrough = (data, brand, seg = 'Total') => {
  return getVal(data, 'q16', brand, seg);
};

export const netAdvocacy = (data, brand, seg = 'Total') => {
  const opts = data?.q22?.[brand]?.options;
  if (!opts) return 0;
  const recKey = findOption(opts, 'You recommended');
  const othRecKey = findOption(opts, 'Others recommended');
  const avoidKey = findOption(opts, 'You suggested');
  const othAvoidKey = findOption(opts, 'Others suggested');
  const pos = (recKey ? getVal(opts, recKey, seg) : 0) + (othRecKey ? getVal(opts, othRecKey, seg) : 0);
  const neg = (avoidKey ? getVal(opts, avoidKey, seg) : 0) + (othAvoidKey ? getVal(opts, othAvoidKey, seg) : 0);
  return pos - neg;
};

export const reputationSalience = (data, brand, seg = 'Total') => {
  return getVal(data, 'q24', 'Reputation', brand, seg);
};

// PORTFOLIO (PO1-PO6)
export const varietyPerception = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Variety', brand, seg);
export const innovationPerception = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Innovation', brand, seg);
export const tasteQuality = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Taste', brand, seg);
export const healthOptionBreadth = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Health', brand, seg);
export const priceAccessibility = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Price', brand, seg);

export const portfolioDistinctiveness = (data, seg = 'Total') => {
  const reasons = data?.q25?.reasons;
  if (!reasons) return 0;
  const key = Object.keys(reasons).find(k => k.toLowerCase().includes('unique'));
  return key ? getVal(reasons, key, seg) : 0;
};

// DIMENSION SCORES
export const presenceScore = (data, brand, seg = 'Total') => {
  const p1 = easeScore(data, brand, seg);
  const p2 = 1 - frictionRate(data, brand, seg);
  const p3 = trialPenetration(data, brand, seg);
  const p4 = (frequencyMomentum(data, brand, seg) + 1) / 2;
  const p5 = locationAssociation(data, brand, seg);
  const p6 = locationLoyalty(data, seg);
  return (p1 + p2 + p3 + p4 + p5 + p6) / 6;
};

export const prominenceScore = (data, brand, seg = 'Total') => {
  const pr1 = impressionScore(data, brand, seg);
  const pr2 = valueStandout(data, brand, seg);
  const pr3 = perceivedMomentum(data, brand, seg);
  const pr4 = adCutThrough(data, brand, seg);
  const pr5 = (netAdvocacy(data, brand, seg) + 1) / 2;
  const pr6 = reputationSalience(data, brand, seg);
  return (pr1 + pr2 + pr3 + pr4 + pr5 + pr6) / 6;
};

export const portfolioScore = (data, brand, seg = 'Total') => {
  const po1 = varietyPerception(data, brand, seg);
  const po2 = innovationPerception(data, brand, seg);
  const po3 = tasteQuality(data, brand, seg);
  const po4 = healthOptionBreadth(data, brand, seg);
  const po5 = priceAccessibility(data, brand, seg);
  const po6 = portfolioDistinctiveness(data, seg);
  return (po1 + po2 + po3 + po4 + po5 + po6) / 6;
};

// MASTER COMPUTATION
export const computeBrandMetrics = (data, brand, seg = 'Total') => ({
  presence: {
    P1_easeScore: easeScore(data, brand, seg),
    P2_frictionRate: frictionRate(data, brand, seg),
    P3_trialPenetration: trialPenetration(data, brand, seg),
    P4_frequencyMomentum: frequencyMomentum(data, brand, seg),
    P5_locationAssociation: locationAssociation(data, brand, seg),
    P6_locationLoyalty: locationLoyalty(data, seg),
    score: presenceScore(data, brand, seg),
  },
  prominence: {
    PR1_impressionScore: impressionScore(data, brand, seg),
    PR2_valueStandout: valueStandout(data, brand, seg),
    PR3_perceivedMomentum: perceivedMomentum(data, brand, seg),
    PR4_adCutThrough: adCutThrough(data, brand, seg),
    PR5_netAdvocacy: netAdvocacy(data, brand, seg),
    PR6_reputationSalience: reputationSalience(data, brand, seg),
    score: prominenceScore(data, brand, seg),
  },
  portfolio: {
    PO1_varietyPerception: varietyPerception(data, brand, seg),
    PO2_innovationPerception: innovationPerception(data, brand, seg),
    PO3_tasteQuality: tasteQuality(data, brand, seg),
    PO4_healthOptionBreadth: healthOptionBreadth(data, brand, seg),
    PO5_priceAccessibility: priceAccessibility(data, brand, seg),
    PO6_portfolioDistinctiveness: portfolioDistinctiveness(data, seg),
    score: portfolioScore(data, brand, seg),
  },
});

export const computeAllBrandsMetrics = (data, brands, seg = 'Total') => {
  const result = {};
  brands.forEach(brand => { result[brand] = computeBrandMetrics(data, brand, seg); });
  return result;
};

export const findLeader = (allMetrics) => {
  let leader = null;
  let maxScore = -1;
  Object.entries(allMetrics).forEach(([brand, m]) => {
    const avg = (m.presence.score + m.prominence.score + m.portfolio.score) / 3;
    if (avg > maxScore) { maxScore = avg; leader = brand; }
  });
  return leader;
};

// Metric metadata for display
export const METRIC_DEFS = {
  P1_easeScore: { label: 'Ease Score', short: 'Ease', desc: '% finding it convenient to dine in', dim: 'presence', format: 'pct' },
  P2_frictionRate: { label: 'Friction Rate', short: 'Friction', desc: '% finding it impossible to access', dim: 'presence', format: 'pct', invert: true },
  P3_trialPenetration: { label: 'Trial Penetration', short: 'Trial', desc: '% who have ever tried the brand', dim: 'presence', format: 'pct' },
  P4_frequencyMomentum: { label: 'Frequency Momentum', short: 'Momentum', desc: 'Net change in visit frequency vs last year', dim: 'presence', format: 'net' },
  P5_locationAssociation: { label: 'Location Association', short: 'Location', desc: '% associating brand with accessibility', dim: 'presence', format: 'pct' },
  P6_locationLoyalty: { label: 'Location Loyalty', short: 'Loc. Loyalty', desc: '% of main-brand users citing location convenience', dim: 'presence', format: 'pct' },
  PR1_impressionScore: { label: 'Impression Score', short: 'Impression', desc: '% with positive overall impression', dim: 'prominence', format: 'pct' },
  PR2_valueStandout: { label: 'Value Standout', short: 'Value', desc: '% rating value as better than expected', dim: 'prominence', format: 'pct' },
  PR3_perceivedMomentum: { label: 'Perceived Momentum', short: 'Momentum', desc: '% perceiving brand as growing', dim: 'prominence', format: 'pct' },
  PR4_adCutThrough: { label: 'Ad Cut-Through', short: 'Ad Recall', desc: '% recalling recent advertising', dim: 'prominence', format: 'pct' },
  PR5_netAdvocacy: { label: 'Net Advocacy', short: 'Advocacy', desc: 'Net word-of-mouth (recommend minus avoid)', dim: 'prominence', format: 'net' },
  PR6_reputationSalience: { label: 'Reputation Salience', short: 'Reputation', desc: '% associating brand with strong reputation', dim: 'prominence', format: 'pct' },
  PO1_varietyPerception: { label: 'Variety Perception', short: 'Variety', desc: '% associating brand with menu variety', dim: 'portfolio', format: 'pct' },
  PO2_innovationPerception: { label: 'Innovation Perception', short: 'Innovation', desc: '% associating brand with innovation', dim: 'portfolio', format: 'pct' },
  PO3_tasteQuality: { label: 'Taste Quality', short: 'Taste', desc: '% associating brand with taste', dim: 'portfolio', format: 'pct' },
  PO4_healthOptionBreadth: { label: 'Health Options', short: 'Health', desc: '% associating brand with healthy options', dim: 'portfolio', format: 'pct' },
  PO5_priceAccessibility: { label: 'Price Accessibility', short: 'Price', desc: '% associating brand with good price/value', dim: 'portfolio', format: 'pct' },
  PO6_portfolioDistinctiveness: { label: 'Portfolio Distinctiveness', short: 'Unique', desc: '% of main-brand users citing unique menu', dim: 'portfolio', format: 'pct' },
};

export const fmtMetric = (value, format) => {
  if (format === 'net') return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
  return `${(value * 100).toFixed(1)}%`;
};
