// Cloudflare Pages Function — /api/chat
// Set GROQ_API_KEY as a secret: npx wrangler pages secret put GROQ_API_KEY

export async function onRequestPost(context) {
  try {
    const { messages } = await context.request.json();
    const apiKey = context.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json({ content: 'GROQ_API_KEY not configured.' }, { status: 500 });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return Response.json({ content: `API error: ${errText}` }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    return Response.json({ content: data.choices?.[0]?.message?.content || 'No response' });
  } catch (err) {
    return Response.json({ content: `Server error: ${err.message}` }, { status: 500 });
  }
}
