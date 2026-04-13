import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
    plugins: [
      react(),
      {
        name: 'chat-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { messages } = JSON.parse(body);
                const apiKey = env.GROQ_API_KEY;

                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ content: 'GROQ_API_KEY not configured. Add it to .env.local' }));
                  return;
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
                  res.statusCode = groqRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ content: `API error: ${errText}` }));
                  return;
                }

                const data = await groqRes.json();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ content: data.choices?.[0]?.message?.content || 'No response' }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ content: `Server error: ${err.message}` }));
              }
            });
          });
        },
      },
    ],
  }
})
