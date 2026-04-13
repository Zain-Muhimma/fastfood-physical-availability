// "How to Read" guide content per page

export const guides = {
  '/': {
    title: 'PA Scoreboard',
    sections: [
      {
        title: 'Dimension Scores',
        type: 'definitions',
        items: [
          { term: 'Presence Score', def: 'Average of 6 metrics measuring whether category buyers can physically access the brand. Higher = easier to find and visit.' },
          { term: 'Prominence Score', def: 'Average of 6 metrics measuring whether the brand stands out at point of purchase. Higher = more noticed and recommended.' },
          { term: 'Portfolio Score', def: 'Average of 6 metrics measuring whether the menu offering meets buyer needs. Higher = better product-market fit.' },
        ],
      },
      {
        title: 'Ranking Colors',
        type: 'legend',
        items: [
          { color: '#F36B1F', label: 'Focused Brand', desc: 'Currently selected brand highlighted in orange' },
          { color: '#D1D5DB', label: 'Other Brands', desc: 'Comparison brands shown in grey' },
        ],
      },
    ],
  },
  '/presence': {
    title: 'Presence',
    sections: [
      {
        title: 'Presence Metrics (P1-P6)',
        type: 'definitions',
        items: [
          { term: 'P1. Ease Score', def: '% of category buyers who say it is convenient and easy to dine at this brand. Higher = stronger physical presence.' },
          { term: 'P2. Friction Rate', def: '% who say it is impossible or extremely difficult to access. Lower is better. >20% = critical gap.' },
          { term: 'P3. Trial Penetration', def: '% who have ever tried the brand (Lapsed + Occasional + Regular visitors combined).' },
          { term: 'P4. Frequency Momentum', def: 'Net change in visit frequency vs last year. Positive = gaining visits, negative = losing.' },
          { term: 'P5. Location Association', def: '% who associate the brand with convenient locations and accessibility.' },
          { term: 'P6. Location Loyalty', def: '% of main-brand users who choose the brand because it is close to home/work.' },
        ],
      },
      {
        title: 'Interpretation',
        type: 'legend',
        items: [
          { color: '#2E7D32', label: '>70% Ease', desc: 'Strong presence — brand is easy to find' },
          { color: '#F36B1F', label: '50-70% Ease', desc: 'Moderate presence — room to improve' },
          { color: '#C62828', label: '<50% Ease', desc: 'Weak presence — availability problem' },
        ],
      },
    ],
  },
  '/prominence': {
    title: 'Prominence',
    sections: [
      {
        title: 'Prominence Metrics (PR1-PR6)',
        type: 'definitions',
        items: [
          { term: 'PR1. Impression Score', def: '% with positive overall impression. >70% = strong prominence.' },
          { term: 'PR2. Value Standout', def: '% rating value as much better than expected. Separates brands that exceed expectations.' },
          { term: 'PR3. Perceived Momentum', def: '% perceiving brand as more popular/growing. Social proof drives prominence.' },
          { term: 'PR4. Ad Cut-Through', def: '% recalling recent advertising. Measures marketing visibility.' },
          { term: 'PR5. Net Advocacy', def: 'Word-of-mouth balance: (recommended) minus (told to avoid). Positive = organic growth.' },
          { term: 'PR6. Reputation Salience', def: '% associating brand with strong reputation and reviews.' },
        ],
      },
    ],
  },
  '/portfolio': {
    title: 'Portfolio',
    sections: [
      {
        title: 'Portfolio Metrics (PO1-PO6)',
        type: 'definitions',
        items: [
          { term: 'PO1. Variety Perception', def: '% associating brand with menu variety and range of options.' },
          { term: 'PO2. Innovation Perception', def: '% associating brand with innovation and unique offerings.' },
          { term: 'PO3. Taste Quality', def: '% associating brand with taste and flavour. The core product quality metric.' },
          { term: 'PO4. Health Options', def: '% associating brand with healthy and nutritional options. Growing need.' },
          { term: 'PO5. Price Accessibility', def: '% associating brand with good price and value for money.' },
          { term: 'PO6. Portfolio Distinctiveness', def: '% of loyal users citing unique menu as reason for choosing the brand.' },
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
        title: 'Alignment Categories',
        type: 'definitions',
        items: [
          { term: 'Reinforced Strength', def: 'High survey association AND positive reviews. Brand delivers on its promise.' },
          { term: 'Broken Promise', def: 'High survey association BUT negative reviews. Brand builds expectations it cannot deliver.' },
          { term: 'Missed Opportunity', def: 'Low survey association BUT positive reviews. Brand delivers well but buyers do not know it.' },
          { term: 'Low Priority', def: 'Low on both. Not actively helping or hurting.' },
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
        title: 'Gap Analysis',
        type: 'definitions',
        items: [
          { term: 'Gap vs Leader', def: 'Difference between focused brand score and category leader score. Green = ahead, Red = behind.' },
          { term: 'Overall PA Score', def: 'Average of Presence + Prominence + Portfolio dimension scores.' },
        ],
      },
      {
        title: 'Conditional Colors',
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
          { term: 'Wave Tracking', def: 'This page will compare metrics across survey waves to detect declining trends. Requires Wave 4 data.' },
        ],
      },
    ],
  },
};
