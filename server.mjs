import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rowboat-openai-wrapper',
    version: '1.0.0',
  });
});

/**
 * Utilitaire : nettoyer un peu la sortie TUI de rowboat
 * (on pourra l’affiner si besoin)
 */
function cleanRowboatOutput(output) {
  // virer les codes couleurs ANSI
  let clean = output.replace(/\x1b\[[0-9;]*m/g, '');

  // virer quelques bordures ASCII de base (optionnel, à affiner)
  clean = clean.replace(/╭─[\s\S]*?╮/g, '');
  clean = clean.replace(/╰─[\s\S]*?╯/g, '');

  return clean.trim();
}

/**
 * Appel "one shot" à rowboatx --no-interactive
 * message = contenu utilisateur
 */
function callRowboatOnce(message) {
  return new Promise((resolve, reject) => {
    const child = spawn('rowboatx', ['--no-interactive'], {
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `rowboatx exited with code ${code}. stderr: ${stderr.substring(
              0,
              500,
            )}`,
          ),
        );
      }

      const cleaned = cleanRowboatOutput(stdout);
      resolve(cleaned || stdout);
    });

    // On envoie le message à rowboatx via stdin
    child.stdin.write(message + '\n');
    child.stdin.end();
  });
}

/**
 * POST /v1/chat/completions
 * OpenAI-compatible pour OWUI
 */
app.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'messages[] is required',
        type: 'invalid_request_error',
      },
    });
  }

  const last = messages[messages.length - 1];
  const userMessage = typeof last.content === 'string'
    ? last.content
    : Array.isArray(last.content)
    ? last.content.map((c) => c.text || '').join('\n')
    : '';

  if (!userMessage) {
    return res.status(400).json({
      error: {
        message: 'last user message content is empty',
        type: 'invalid_request_error',
      },
    });
  }

  const usedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const now = Math.floor(Date.now() / 1000);
  const fakeId = `chatcmpl_${now}`;

  // STREAMING
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // fonction utilitaire pour envoyer un chunk OpenAI-style
    const sendChunk = (deltaContent) => {
      const payload = {
        id: fakeId,
        object: 'chat.completion.chunk',
        created: now,
        model: usedModel,
        choices: [
          {
            index: 0,
            delta: {
              role: 'assistant',
              content: deltaContent,
            },
            finish_reason: null,
          },
        ],
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const sendDone = () => {
      res.write(`data: [DONE]\n\n`);
      res.end();
    };

    // On spawn rowboatx et on stream stdout
    const child = spawn('rowboatx', ['--no-interactive'], {
      env: process.env,
    });

    let buffer = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      buffer += text;

      // nettoyage simple à la volée
      const cleaned = text.replace(/\x1b\[[0-9;]*m/g, '');
      if (cleaned.trim().length > 0) {
        sendChunk(cleaned);
      }
    });

    child.stderr.on('data', (chunk) => {
      // on log en serveur mais on n’envoie rien au client
      console.error('[rowboatx stderr]', chunk.toString());
    });

    child.on('close', (code) => {
      // à la fin, on envoie finish_reason
      const finalPayload = {
        id: fakeId,
        object: 'chat.completion.chunk',
        created: now,
        model: usedModel,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
      };
      res.write(`data: ${JSON.stringify(finalPayload)}\n\n`);
      sendDone();
    });

    child.on('error', (err) => {
      console.error('[rowboatx error]', err);
      sendDone();
    });

    // on alimente stdin avec le message
    child.stdin.write(userMessage + '\n');
    child.stdin.end();

    return; // très important : ne pas continuer plus loin
  }

  // NON STREAM : réponse OpenAI standard
  try {
    const fullText = await callRowboatOnce(userMessage);

    const payload = {
      id: fakeId,
      object: 'chat.completion',
      created: now,
      model: usedModel,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: fullText,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };

    res.json(payload);
  } catch (err) {
    console.error('[rowboatx] error', err);
    res.status(500).json({
      error: {
        message: err.message || 'rowboatx failed',
        type: 'internal_server_error',
      },
    });
  }
});

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════');
  console.log('🚀 Rowboat OpenAI-compatible HTTP Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`💬 Chat:   POST /v1/chat/completions (stream/non-stream)`);
  console.log('═══════════════════════════════════════════════');
});
