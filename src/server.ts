import express from 'express';
import { Chat } from './chatStream';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const networkInterfaces = os.networkInterfaces();
if (!networkInterfaces) {
    throw new Error('Unable to get network interfaces');
}

const localIP = (process.platform === 'darwin' ? networkInterfaces['en0'] : networkInterfaces['eth0'])?.filter((details) => details.family === 'IPv4')[0]?.address;
const ip = localIP || 'localhost';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();

if (process.argv.length < 4) {
    console.error('Usage: node server.js <port> <model-name> <system-prompt>');
    process.exit(1);
}

const port = parseInt(process.argv[2]);
if (isNaN(port)) {
    console.error('Port must be a valid number');
    process.exit(1);
}
const modelName = process.argv[3];
const systemPrompt = process.argv[4];

const chat = new Chat(modelName, systemPrompt);

server.get('/chat', (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).send('Missing prompt query parameter');
    } else if (typeof prompt !== 'string') {
        return res.status(400).send('Invalid prompt query parameter');
    }

    chat.generateResponse(prompt).then(response => {
        res.send(response);
    }).catch(err => {
        console.error(err);
        res.status(500).send('An error occurred while generating the chat response');
    });

});

server.get('/', (req, res) => {
    const filePath = resolve(__dirname, 'index.html');
    res.sendFile(filePath);
});

server.listen(port, ip, () => {
    console.log(`Server listening at http://${ip}:${port}`);
});
