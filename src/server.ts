import express from 'express';
import { PassThrough } from 'stream';
import { Chat } from './chatStream';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();

if (process.argv.length < 5) {
    console.error('Usage: node server.js <ip> <port> <model-name> <system-prompt>');
    process.exit(1);
}

const ip = process.argv[2];
const port = parseInt(process.argv[3]);
if (isNaN(port)) {
    console.error('Port must be a valid number');
    process.exit(1);
}
const modelName = process.argv[4];
const systemPrompt = process.argv[5];

const chat = new Chat(modelName, systemPrompt);

server.get('/chat', (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).send('Missing prompt query parameter');
    } else if (typeof prompt !== 'string') {
        return res.status(400).send('Invalid prompt query parameter');
    }

    const stream = new PassThrough();

    chat.generateResponse(prompt, (token) => {
        stream.push(token);
    }, () => { stream.end(); })
        .catch(err => {
            console.error(err);
            res.status(500).send('An error occurred while generating the chat response');
        });

    stream.pipe(res);
});

server.get('/', (req, res) => {
    const filePath = resolve(__dirname, 'index.html');
    res.sendFile(filePath);
});

server.listen(port, ip, () => {
    console.log(`Server listening at http://${ip}:${port}`);
});
