import express from 'express';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/stream', (req, res) => {
  // Headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Optionnel : autoriser CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send "ping" initial
  res.write(`event: ping\ndata: connected\n\n`);

  // Exemple de commande : rowboatx avec arguments
  // Adapte selon ton binaire / use case
  const args = []; // ex: ['run', '--model', 'gpt-4']
  const child = spawn('rowboatx', args, {
    env: process.env,
  });

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    // On échappe les retours à la ligne éventuels
    const payload = text.replace(/\r?\n/g, '\\n');
    res.write(`data: ${payload}\n\n`);
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const payload = text.replace(/\r?\n/g, '\\n');
    res.write(`event: stderr\ndata: ${payload}\n\n`);
  });

  child.on('close', (code) => {
    res.write(`event: end\ndata: process exited with code ${code}\n\n`);
    res.end();
  });

  // Si le client ferme la connexion
  req.on('close', () => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });
});

app.listen(PORT, () => {
  console.log(`CLI stream server listening on port ${PORT}`);
});
