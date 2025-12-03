#!/usr/bin/env node

/**
 * Serveur HTTP simple pour exposer rowboatx
 * Version simplifiée et robuste pour Flowise
 */

const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'rowboat-http-wrapper',
        version: '1.0.0'
    });
});

// Chat endpoint - une nouvelle instance rowboat par requête (stateless)
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[Chat] Received message: ${message}`);

    try {
        const response = await callRowboat(message);
        res.json({
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Chat] Error:', error.message);
        res.status(500).json({
            error: error.message
        });
    }
});

/**
 * Appeler rowboat avec un message et attendre la réponse
 */
function callRowboat(message) {
    return new Promise((resolve, reject) => {
        console.log('[Rowboat] Starting process...');

        const rowboat = spawn('sh', ['-c', `echo "${message}" | rowboatx --no-interactive`], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        let stdout = '';
        let stderr = '';
        let resolved = false;

        rowboat.stdout.on('data', (data) => {
            stdout += data.toString();

            // Détecter si on a une réponse complète
            if (stdout.includes('╰─────────────') && !resolved) {
                resolved = true;
                const cleanResponse = extractResponse(stdout);

                if (cleanResponse) {
                    console.log('[Rowboat] Response extracted successfully');
                    rowboat.kill(); // Tuer le processus maintenant qu'on a la réponse
                    resolve(cleanResponse);
                }
            }
        });

        rowboat.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Timeout de 60 secondes
        const timeout = setTimeout(() => {
            if (!resolved) {
                console.error('[Rowboat] Timeout - killing process');
                rowboat.kill();
                reject(new Error('Timeout after 60 seconds'));
            }
        }, 60000);

        rowboat.on('close', (code) => {
            clearTimeout(timeout);

            if (!resolved) {
                if (code !== 0 && code !== null && code !== 143) { // 143 = SIGTERM
                    console.error('[Rowboat] Process exited with code:', code);
                    console.error('[Rowboat] stderr:', stderr);
                }

                // Extraire la réponse
                const cleanResponse = extractResponse(stdout);

                if (cleanResponse) {
                    console.log('[Rowboat] Response extracted from close event');
                    resolve(cleanResponse);
                } else {
                    console.error('[Rowboat] Failed to extract response from stdout:', stdout.substring(0, 500));
                    reject(new Error('Failed to extract response from rowboat output'));
                }
            }
        });

        rowboat.on('error', (error) => {
            clearTimeout(timeout);
            if (!resolved) {
                console.error('[Rowboat] Process error:', error);
                reject(error);
            }
        });
    });
}

/**
 * Extraire la réponse du output rowboat
 */
function extractResponse(output) {
    // Nettoyer les codes ANSI/couleurs
    let clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    // Enlever le header ASCII art
    clean = clean.replace(/\$\$\\[\s\S]*?How can i help you today\?/m, '');

    // Chercher entre "Response" et "Finish"
    const responseMatch = clean.match(/Response[\s\S]*?│\s*([\s\S]*?)\s*╭─\s*Finish/);

    if (responseMatch && responseMatch[1]) {
        const response = responseMatch[1]
            .replace(/│/g, '')  // Enlever les bordures
            .replace(/\[0m/g, '')  // Codes ANSI restants
            .replace(/\[38;5;\d+m/g, '')
            .replace(/\s+/g, ' ')  // Normaliser les espaces
            .trim();

        return response;
    }

    // Fallback : chercher "You:" et prendre ce qui suit jusqu'à "Finish"
    const fallbackMatch = clean.match(/You:\s*([\s\S]*?)\s*╭─\s*Finish/);
    if (fallbackMatch && fallbackMatch[1]) {
        const response = fallbackMatch[1]
            .replace(/│/g, '')
            .replace(/\[0m/g, '')
            .replace(/\[38;5;\d+m/g, '')
            .replace(/\[1m/g, '')
            .replace(/\[2m/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        return response;
    }

    return null;
}

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🚀 Rowboat HTTP Server');
    console.log('═══════════════════════════════════════════════');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`💬 Chat: http://localhost:${PORT}/chat`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
});

// Nettoyage gracieux
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});
