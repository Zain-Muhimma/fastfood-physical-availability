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

export const locationLoyalty = (data, brand, seg = 'Total') => {
  // Per-brand Q25 (cross-tabulated with Q15b main brand)
  const perBrand = data?.q25_per_brand?.[brand]?.reasons;
  if (perBrand) {
    const key = Object.keys(perBrand).find(k => k.toLowerCase().includes('location'));
    return key ? getVal(perBrand, key, seg) : 0;
  }
  // Fallback to global Q25
  const reasons = data?.q25?.reasons;
  if (!reasons) return 0;
  const key = Object.keys(reasons).find(k => k.toLowerCase().includes('location'));
  return key ? getVal(reasons, key, seg) : 0;
};

// PROMINENCE — "How easy the brand is to notice at the point of purchase"
// PRIMARY: PR1 (Impression/Standout) = dimension score
// DRIVER: PR2 (Market Presence/Visibility from Q24_14)
// SUPPORTING SIGNAL: PR3 (Ad Recall) — shown but not part of score

export const impressionScore = (data, brand, seg = 'Total') => {
  const opts = data?.q19?.[brand]?.options;
  if (!opts) return 0;
  const key = findOption(opts, 'Positive');
  return key ? getVal(opts, key, seg) : 0;
};

export const marketPresence = (data, brand, seg = 'Total') => {
  return getVal(data, 'q24', 'Popularity', brand, seg);
};

export const adCutThrough = (data, brand, seg = 'Total') => {
  return getVal(data, 'q16', brand, seg);
};

// MOVED FROM PROMINENCE — kept as exported functions for Portfolio/Supporting use
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

// PORTFOLIO (PO1-PO6)
export const varietyPerception = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Variety', brand, seg);
export const innovationPerception = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Innovation', brand, seg);
export const tasteQuality = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Taste', brand, seg);
export const healthOptionBreadth = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Health', brand, seg);
export const priceAccessibility = (data, brand, seg = 'Total') => getVal(data, 'q24', 'Price', brand, seg);

export const portfolioDistinctiveness = (data, brand, seg = 'Total') => {
  const perBrand = data?.q25_per_brand?.[brand]?.reasons;
  if (perBrand) {
    const key = Object.keys(perBrand).find(k => k.toLowerCase().includes('unique'));
    return key ? getVal(perBrand, key, seg) : 0;
  }
  const reasons = data?.q25?.reasons;
  if (!reasons) return 0;
  const key = Object.keys(reasons).find(k => k.toLowerCase().includes('unique'));
  return key ? getVal(reasons, key, seg) : 0;
};

// DIMENSION SCORES — strict Blueprint: use PRIMARY metric only
export const presenceScore = (data, brand, seg = 'Total') => easeScore(data, brand, seg);
export const prominenceScore = (data, brand, seg = 'Total') => impressionScore(data, brand, seg);
export const portfolioScore = (data, brand, seg = 'Total') => varietyPerception(data, brand, seg);

// MASTER COMPUTATION
export const computeBrandMetrics = (data, brand, seg = 'Total') => ({
  presence: {
    P1_easeScore: easeScore(data, brand, seg),
    P2_frictionRate: frictionRate(data, brand, seg),
    P3_trialPenetration: trialPenetration(data, brand, seg),
    P4_frequencyMomentum: frequencyMomentum(data, brand, seg),
    P5_locationAssociation: locationAssociation(data, brand, seg),
    P6_locationLoyalty: locationLoyalty(data, brand, seg),
    score: presenceScore(data, brand, seg),
  },
  prominence: {
    PR1_impressionScore: impressionScore(data, brand, seg),
    PR2_marketPresence: marketPresence(data, brand, seg),
    PR3_adCutThrough: adCutThrough(data, brand, seg),
    score: prominenceScore(data, brand, seg),
  },
  portfolio: {
    PO1_varietyPerception: varietyPerception(data, brand, seg),
    PO2_innovationPerception: innovationPerception(data, brand, seg),
    PO3_tasteQuality: tasteQuality(data, brand, seg),
    PO4_healthOptionBreadth: healthOptionBreadth(data, brand, seg),
    PO5_priceAccessibility: priceAccessibility(data, brand, seg),
    PO6_portfolioDistinctiveness: portfolioDistinctiveness(data, brand, seg),
    PO7_valueStandout: valueStandout(data, brand, seg),
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
    // Leader = highest Presence score (P1 Ease — the primary PA metric)
    const score = m.presence.score;
    if (score > maxScore) { maxScore = score; leader = brand; }
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
  PR1_impressionScore: { label: 'Positive Standout', short: 'Standout', desc: '% with positive overall impression — brand stands out favourably', dim: 'prominence', format: 'pct', role: 'score' },
  PR2_marketPresence: { label: 'Market Presence', short: 'Presence', desc: '% associating brand with popularity and market visibility', dim: 'prominence', format: 'pct', role: 'driver' },
  PR3_adCutThrough: { label: 'Ad Cut-Through', short: 'Ad Recall', desc: '% recalling recent advertising — supporting signal', dim: 'prominence', format: 'pct', role: 'supporting' },
  PO1_varietyPerception: { label: 'Variety Perception', short: 'Variety', desc: '% associating brand with menu variety', dim: 'portfolio', format: 'pct' },
  PO2_innovationPerception: { label: 'Innovation Perception', short: 'Innovation', desc: '% associating brand with innovation', dim: 'portfolio', format: 'pct' },
  PO3_tasteQuality: { label: 'Taste Quality', short: 'Taste', desc: '% associating brand with taste', dim: 'portfolio', format: 'pct' },
  PO4_healthOptionBreadth: { label: 'Health Options', short: 'Health', desc: '% associating brand with healthy options', dim: 'portfolio', format: 'pct' },
  PO5_priceAccessibility: { label: 'Price Accessibility', short: 'Price', desc: '% associating brand with good price/value', dim: 'portfolio', format: 'pct' },
  PO6_portfolioDistinctiveness: { label: 'Portfolio Distinctiveness', short: 'Unique', desc: '% of main-brand users citing unique menu', dim: 'portfolio', format: 'pct' },
  PO7_valueStandout: { label: 'Value Standout', short: 'Value', desc: '% rating value as better than expected', dim: 'portfolio', format: 'pct' },
};

export const fmtMetric = (value, format) => {
  if (format === 'net') return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
  return `${(value * 100).toFixed(1)}%`;
};
