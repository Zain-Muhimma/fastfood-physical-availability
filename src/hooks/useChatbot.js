import { useState, useCallback } from 'react';

export const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your Physical Availability analyst. I can answer questions about **Presence**, **Prominence**, and **Portfolio** metrics for 10 burger brands in Saudi Arabia. Try asking:\n- *Which brand has the strongest physical presence?*\n- *Compare Kudu vs McDonalds on prominence*\n- *What are Burgerizzr's biggest weaknesses?*"
};

export default function useChatbot() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);

  const buildSystemPrompt = useCallback((allMetrics, brandNames, focusedBrand, segment) => {
    const buildTable = (metricKey, dim) => {
      return brandNames
        .map(b => ({ brand: b, val: allMetrics[b]?.[dim]?.[metricKey] || 0 }))
        .sort((a, b) => b.val - a.val)
        .map((r, i) => `  ${i + 1}. ${r.brand}: ${(r.val * 100).toFixed(1)}%`)
        .join('\n');
    };

    const presenceTable = brandNames
      .map(b => ({ brand: b, score: allMetrics[b]?.presence?.score || 0 }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => `  ${i + 1}. ${r.brand}: ${(r.score * 100).toFixed(1)}%`)
      .join('\n');

    const prominenceTable = brandNames
      .map(b => ({ brand: b, score: allMetrics[b]?.prominence?.score || 0 }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => `  ${i + 1}. ${r.brand}: ${(r.score * 100).toFixed(1)}%`)
      .join('\n');

    const portfolioTable = brandNames
      .map(b => ({ brand: b, score: allMetrics[b]?.portfolio?.score || 0 }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => `  ${i + 1}. ${r.brand}: ${(r.score * 100).toFixed(1)}%`)
      .join('\n');

    return `You are an expert Physical Availability analyst embedded in the Muhimma dashboard.
You analyze 10 burger restaurant brands in Saudi Arabia using the Ehrenberg-Bass Physical Availability framework.

FRAMEWORK — THREE DIMENSIONS:

PRESENCE (Can buyers find the brand?):
- P1 Ease Score: % finding it convenient to dine in (Q18 top box)
- P2 Friction Rate: % finding it impossible to access (Q18 bottom box) — LOWER IS BETTER
- P3 Trial Penetration: % who have ever tried (Lapsed + Occasional + Regular)
- P4 Frequency Momentum: Net visit frequency change vs last year (More% - Less%)
- P5 Location Association: % associating brand with convenient locations (Q24_7)
- P6 Location Loyalty: % of main-brand users citing location convenience (Q25)

PROMINENCE (Does the brand stand out?):
- PR1 Impression Score: % with positive overall impression (Q19 top box)
- PR2 Value Standout: % rating value better than expected (Q20 top box)
- PR3 Perceived Momentum: % perceiving brand as growing (Q21 top box)
- PR4 Ad Cut-Through: % recalling recent advertising (Q16)
- PR5 Net Advocacy: Word-of-mouth net score (recommend - avoid from Q22)
- PR6 Reputation Salience: % associating brand with strong reputation (Q24_13)

PORTFOLIO (Does the menu meet needs?):
- PO1 Variety Perception: % associating with menu variety (Q24_5)
- PO2 Innovation Perception: % associating with innovation (Q24_15)
- PO3 Taste Quality: % associating with taste (Q24_1)
- PO4 Health Options: % associating with healthy options (Q24_6)
- PO5 Price Accessibility: % associating with good value (Q24_3)
- PO6 Portfolio Distinctiveness: % citing unique menu as choice reason (Q25)

KEY INTERPRETATION PATTERNS:
- High Ease + Low Friction = strong physical presence
- High Impression + High Momentum = brand is rising
- High Taste + Low Variety = deep but narrow portfolio
- Negative Net Advocacy = word-of-mouth is damaging the brand
- High Ad Recall + Low Impression = ads noticed but not building positive perception

THE 10 BRANDS: ${brandNames.join(', ')}
Currently focused brand: ${focusedBrand}
Demographic segment: ${segment}

--- DIMENSION SCORES (ranked) ---
Presence:
${presenceTable}

Prominence:
${prominenceTable}

Portfolio:
${portfolioTable}

--- PRESENCE METRICS ---
Ease Score:
${buildTable('P1_easeScore', 'presence')}

Friction Rate (lower = better):
${buildTable('P2_frictionRate', 'presence')}

Trial Penetration:
${buildTable('P3_trialPenetration', 'presence')}

Frequency Momentum:
${brandNames.map(b => `  ${b}: ${((allMetrics[b]?.presence?.P4_frequencyMomentum || 0) * 100).toFixed(1)}%`).join('\n')}

--- PROMINENCE METRICS ---
Impression Score:
${buildTable('PR1_impressionScore', 'prominence')}

Value Standout:
${buildTable('PR2_valueStandout', 'prominence')}

Perceived Momentum:
${buildTable('PR3_perceivedMomentum', 'prominence')}

Ad Cut-Through:
${buildTable('PR4_adCutThrough', 'prominence')}

Net Advocacy:
${brandNames.map(b => `  ${b}: ${((allMetrics[b]?.prominence?.PR5_netAdvocacy || 0) * 100).toFixed(1)}%`).join('\n')}

--- PORTFOLIO METRICS ---
Taste Quality:
${buildTable('PO3_tasteQuality', 'portfolio')}

Variety Perception:
${buildTable('PO1_varietyPerception', 'portfolio')}

Innovation:
${buildTable('PO2_innovationPerception', 'portfolio')}

RULES:
- Always cite specific numbers when answering
- Use % format for all metrics
- For Friction Rate, remember lower is better
- For Net Advocacy and Frequency Momentum, show +/- sign
- Keep responses concise but data-rich
- Use markdown formatting (bold, bullets, tables)
- If asked about a brand, cover all 3 dimensions
- Compare vs the category leader when relevant`;
  }, []);

  const sendMessage = useCallback(async (text, allMetrics, brandNames, focusedBrand, segment) => {
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(allMetrics, brandNames, focusedBrand, segment);
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Sorry, I could not generate a response.',
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err.message}. Please check your API key configuration.`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, buildSystemPrompt]);

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return { messages, loading, sendMessage, clearMessages };
}
