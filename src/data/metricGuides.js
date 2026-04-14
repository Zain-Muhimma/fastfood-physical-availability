// "How to Read" guide content per page

export const guides = {
  '/': {
    title: 'Executive Summary',
    sections: [
      {
        title: 'Three Dimensions',
        type: 'definitions',
        items: [
          { term: 'Presence Score', def: 'Equal to the Ease of Access score (P1) — the % of category buyers who say it is convenient to dine at this brand. This is the single most direct measure of physical availability.' },
          { term: 'Prominence Score', def: 'Equal to the Positive Standout score (PR1) — the % of category buyers with a positive overall impression. Measures how easily the brand is noticed at the point of purchase.' },
          { term: 'Portfolio Score', def: 'Equal to the Variety Perception score (PO1) — the % of category buyers who associate the brand with menu variety. Measures whether the range meets buyer needs.' },
        ],
      },
      {
        title: 'How to Interpret',
        type: 'definitions',
        items: [
          { term: 'Brand Ranking', def: 'All 10 brands ranked by Presence score (Ease of Access). The focused brand is highlighted in orange.' },
          { term: 'Strategic Read', def: 'Auto-generated insights showing rank position, strongest/weakest dimension, and key metric highlights for the focused brand.' },
          { term: 'Strongest / Weakest', def: 'The top 3 and bottom 3 metrics for the focused brand, ranked by competitive position among all 10 brands (not absolute value).' },
        ],
      },
      {
        title: 'Dimension Colors',
        type: 'legend',
        items: [
          { color: '#F36B1F', label: 'Presence', desc: 'Orange — Ease of Access dimension' },
          { color: '#FDB55B', label: 'Prominence', desc: 'Golden — Positive Standout dimension' },
          { color: '#707070', label: 'Portfolio', desc: 'Grey — Range Coverage dimension' },
        ],
      },
    ],
  },
  '/presence': {
    title: 'Presence',
    sections: [
      {
        title: 'Score',
        type: 'definitions',
        items: [
          { term: 'Presence Score = Ease of Access (P1)', def: 'The % of category buyers who say it is convenient and easy to dine at this brand. This is the headline metric — the Presence Score IS the Ease of Access score. >70% = strong. 50-70% = moderate. <50% = weak.' },
        ],
      },
      {
        title: 'Drivers (what explains the score)',
        type: 'definitions',
        items: [
          { term: 'P2. Friction Rate', def: '% who say it is impossible or extremely difficult to access. Lower is better. <10% = acceptable. 10-20% = attention needed. >20% = critical distribution gap.' },
          { term: 'P3. Trial Penetration', def: '% who have ever tried the brand (Lapsed + Occasional + Regular visitors combined). Higher = stronger historical reach.' },
          { term: 'P4. Frequency Momentum', def: 'Net change in visit frequency vs last year (% visiting more minus % visiting less). Positive = growing. Negative = declining.' },
          { term: 'P5. Location Association', def: '% who associate the brand with convenient locations and accessibility.' },
          { term: 'P6. Location Loyalty', def: '% of main-brand users who choose the brand because it is close to home/work. Per-brand metric (varies by brand).' },
        ],
      },
      {
        title: 'Ease Score Thresholds',
        type: 'legend',
        items: [
          { color: '#2E7D32', label: '>70%', desc: 'Strong presence — brand is easy to find and access' },
          { color: '#F36B1F', label: '50-70%', desc: 'Moderate presence — room to improve distribution' },
          { color: '#C62828', label: '<50%', desc: 'Weak presence — significant availability problem' },
        ],
      },
    ],
  },
  '/prominence': {
    title: 'Prominence',
    sections: [
      {
        title: 'Score',
        type: 'definitions',
        items: [
          { term: 'Prominence Score = Positive Standout (PR1)', def: 'The % of category buyers with a positive overall impression. This is the headline metric — the Prominence Score IS the Positive Standout score. Measures how easy the brand is to notice at the point of purchase.' },
        ],
      },
      {
        title: 'Drivers (what explains the score)',
        type: 'definitions',
        items: [
          { term: 'PR2. Market Presence', def: '% associating the brand with popularity and market visibility (Q24_14). Captures whether the brand feels like it is "everywhere."' },
          { term: 'PR3. Ad Cut-Through', def: '% recalling recent advertising. A supporting signal — measures whether marketing spend is generating brand visibility. Not part of the score.' },
        ],
      },
      {
        title: 'What Prominence is NOT',
        type: 'definitions',
        items: [
          { term: 'Not value perception', def: 'Value for money (Q20) has been moved to Portfolio as it reflects product offering, not visibility.' },
          { term: 'Not word-of-mouth', def: 'Net advocacy and reputation are brand perception metrics, not physical availability metrics. They have been removed from this dimension.' },
        ],
      },
    ],
  },
  '/portfolio': {
    title: 'Portfolio',
    sections: [
      {
        title: 'Score',
        type: 'definitions',
        items: [
          { term: 'Portfolio Score = Variety Perception (PO1)', def: 'The % of category buyers who associate the brand with menu variety and options. This is the headline metric — the Portfolio Score IS the Variety Perception score.' },
        ],
      },
      {
        title: 'Drivers (what explains the score)',
        type: 'definitions',
        items: [
          { term: 'PO2. Innovation', def: '% associating the brand with innovation and unique offerings. Signals whether the portfolio is evolving.' },
          { term: 'PO3. Taste Quality', def: '% associating the brand with taste and flavour. The core product quality that makes any portfolio worth buying.' },
          { term: 'PO4. Health Options', def: '% associating the brand with healthy and nutritional options. A growing category need.' },
          { term: 'PO5. Price Accessibility', def: '% associating the brand with good price and value for money.' },
          { term: 'PO6. Unique Appeal', def: '% of main-brand users citing unique menu as reason for choosing this brand. Per-brand metric.' },
          { term: 'PO7. Value Standout', def: '% rating value as much better than expected (moved from Prominence). Measures whether the brand exceeds value expectations.' },
        ],
      },
      {
        title: 'Heatmap Colors',
        type: 'legend',
        items: [
          { color: '#166534', label: '>30%', desc: 'Strong association' },
          { color: '#CA8A04', label: '15-30%', desc: 'Moderate association' },
          { color: '#EA580C', label: '5-15%', desc: 'Weak association' },
          { color: '#9CA3AF', label: '<5%', desc: 'Negligible' },
        ],
      },
    ],
  },
  '/experience': {
    title: 'Experience vs Memory',
    sections: [
      {
        title: 'What This Page Shows',
        type: 'definitions',
        items: [
          { term: 'Memory (Survey)', def: 'What category buyers associate with the brand from Q24 survey data (15 attributes). This is what people REMEMBER about the brand.' },
          { term: 'Experience (Reviews)', def: 'What customers actually experience based on Google Reviews sentiment analysis (119,778 reviews across 10 brands). This is what people LIVE.' },
          { term: 'Alignment', def: 'Whether real-world experience matches brand perception. Misalignment signals operational or marketing gaps.' },
        ],
      },
      {
        title: 'Alignment Categories',
        type: 'definitions',
        items: [
          { term: 'Reinforced Strength', def: 'High survey association AND ≥60% positive reviews. Brand delivers on its promise. Action: PROTECT.' },
          { term: 'Broken Promise', def: 'High survey association BUT <60% positive reviews (or >15% negative). Brand builds expectations it cannot deliver. Action: FIX OPERATIONS before advertising.' },
          { term: 'Missed Opportunity', def: 'Low survey association BUT ≥60% positive reviews. Brand delivers well but buyers do not know it. Action: AMPLIFY in advertising.' },
          { term: 'Low Priority', def: 'Low on both. Not actively helping or hurting. Action: PARK.' },
        ],
      },
      {
        title: 'Quadrant Colors',
        type: 'legend',
        items: [
          { color: '#2E7D32', label: 'Reinforced', desc: 'Protect — maintain consistency' },
          { color: '#C62828', label: 'Broken Promise', desc: 'Fix operations before advertising' },
          { color: '#1565C0', label: 'Missed Opportunity', desc: 'Amplify in advertising' },
          { color: '#9CA3AF', label: 'Low Priority', desc: 'Park — do not invest' },
        ],
      },
    ],
  },
  '/competitive': {
    title: 'Competitive Gap',
    sections: [
      {
        title: 'What This Page Shows',
        type: 'definitions',
        items: [
          { term: 'Gap vs Leader', def: 'Difference between the focused brand and the category leader (brand with highest Presence score) on each dimension and metric. Green = ahead. Red = behind.' },
          { term: 'Leader', def: 'The brand with the highest Presence (Ease of Access) score. Currently used as the benchmark for all gap calculations.' },
        ],
      },
      {
        title: 'Brand Ranking',
        type: 'definitions',
        items: [
          { term: 'Physical Availability Ranking', def: 'All 10 brands shown with three grouped bars per brand — Presence (orange), Prominence (golden), Portfolio (grey). Sorted by Presence score.' },
        ],
      },
      {
        title: 'Dimension Colors',
        type: 'legend',
        items: [
          { color: '#F36B1F', label: 'Presence', desc: 'Ease of Access — can buyers find the brand?' },
          { color: '#FDB55B', label: 'Prominence', desc: 'Positive Standout — does the brand get noticed?' },
          { color: '#707070', label: 'Portfolio', desc: 'Range Coverage — does the menu meet needs?' },
        ],
      },
      {
        title: 'Conditional Colors (Comparison Table)',
        type: 'legend',
        items: [
          { color: '#2E7D32', label: 'Top 3', desc: 'Among the best performers for this metric' },
          { color: '#C62828', label: 'Bottom 3', desc: 'Among the weakest — attention needed' },
        ],
      },
    ],
  },
  '/early-warning': {
    title: 'Early Warning',
    sections: [
      {
        title: 'About This Page',
        type: 'definitions',
        items: [
          { term: 'Wave Tracking', def: 'This page will compare metrics across survey waves to detect declining trends. Currently showing Wave 3 baseline data only. Requires Wave 4 data to activate.' },
          { term: 'Traffic Lights', def: 'When activated: Green = stable or improving. Amber = 0 to -2pp decline. Red = >2pp decline between waves.' },
        ],
      },
    ],
  },
};
