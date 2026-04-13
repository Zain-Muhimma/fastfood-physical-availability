import React from 'react';
import { METRIC_DEFS, fmtMetric } from '../../data/metrics.js';

const DIMENSION_MAP = {
  presence: 'presence',
  prominence: 'prominence',
  portfolio: 'portfolio',
};

const ReportBrandTable = ({ allMetrics, brandNames, focusedBrand, dimension = 'all' }) => {
  if (!allMetrics || !brandNames?.length) return null;

  // Filter metric keys by dimension
  const metricKeys = Object.entries(METRIC_DEFS)
    .filter(([, def]) => dimension === 'all' || def.dim === dimension)
    .map(([key]) => key);

  // Score key per dimension
  const scoreDims = dimension === 'all'
    ? ['presence', 'prominence', 'portfolio']
    : [DIMENSION_MAP[dimension]];

  // Sort brands by average dimension score descending
  const sorted = [...brandNames].sort((a, b) => {
    const avgA = scoreDims.reduce((s, d) => s + (allMetrics[a]?.[d]?.score || 0), 0) / scoreDims.length;
    const avgB = scoreDims.reduce((s, d) => s + (allMetrics[b]?.[d]?.score || 0), 0) / scoreDims.length;
    return avgB - avgA;
  });

  const getMetricValue = (brand, metricKey) => {
    const def = METRIC_DEFS[metricKey];
    if (!def) return '';
    const dimData = allMetrics[brand]?.[def.dim];
    if (!dimData) return '';
    const val = dimData[metricKey];
    return val !== undefined ? fmtMetric(val, def.format) : '';
  };

  return (
    <table
      className="w-full text-left"
      style={{ fontSize: '8.5px', borderCollapse: 'collapse' }}
    >
      <thead>
        <tr style={{ borderBottom: '2px solid #F36B1F' }}>
          <th className="py-1 pr-2 font-semibold text-text-primary" style={{ width: '90px' }}>
            #
          </th>
          <th className="py-1 pr-2 font-semibold text-text-primary" style={{ width: '90px' }}>
            Brand
          </th>
          {metricKeys.map((key) => (
            <th
              key={key}
              className="py-1 px-1 font-semibold text-text-secondary text-center"
              style={{ whiteSpace: 'nowrap' }}
            >
              {METRIC_DEFS[key].short}
            </th>
          ))}
          {scoreDims.map((d) => (
            <th
              key={d}
              className="py-1 px-1 font-semibold text-center"
              style={{ color: '#F36B1F', whiteSpace: 'nowrap' }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)} Score
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((brand, idx) => {
          const isFocused = brand === focusedBrand;
          return (
            <tr
              key={brand}
              style={{
                backgroundColor: isFocused ? '#FEF0E7' : idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
                fontWeight: isFocused ? 600 : 400,
                borderLeft: isFocused ? '3px solid #F36B1F' : '3px solid transparent',
              }}
            >
              <td className="py-1 pr-2 text-text-secondary">{idx + 1}</td>
              <td className="py-1 pr-2 text-text-primary" style={{ whiteSpace: 'nowrap' }}>
                {brand}
              </td>
              {metricKeys.map((key) => (
                <td key={key} className="py-1 px-1 text-center text-text-primary">
                  {getMetricValue(brand, key)}
                </td>
              ))}
              {scoreDims.map((d) => (
                <td
                  key={d}
                  className="py-1 px-1 text-center font-semibold"
                  style={{ color: '#F36B1F' }}
                >
                  {fmtMetric(allMetrics[brand]?.[d]?.score || 0, 'pct')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ReportBrandTable;
