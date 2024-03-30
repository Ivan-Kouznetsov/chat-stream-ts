/* eslint-disable @typescript-eslint/no-explicit-any */
import { fork, ChildProcess } from 'child_process';
import { ConversationInteraction } from 'node-llama-cpp';
import express, {  Response } from 'express';

import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { wordCount } from '../utils';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
const argv = yargs(hideBin(process.argv)).options({
    model: { type: 'string', demandOption: true },
    systemPrompt: { type: 'string', default: 'You are a helpful assistant'},
    server: { type: 'boolean', default: false },
    port: { type: 'number', default: 3000},
    timeout : { type: 'number', default: 0},
    maxDensity: { type: 'number', default: 0.40},
    useLocalIp: { type: 'boolean', default: false}
}).parseSync();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(dirname(__filename));

const networkInterfaces = os.networkInterfaces();
if (!networkInterfaces) {
    throw new Error('Unable to get network interfaces');
}

const localIP = (process.platform === 'darwin' ? networkInterfaces['en0'] : networkInterfaces['eth0'])?.filter((details) => details.family === 'IPv4')[0]?.address;
if (!localIP) {
    throw new Error('Unable to get local IP');
}

const ip = argv.useLocalIp ? localIP : 'localhost';

const server = express();
server.use(express.static(path.join(__dirname, 'public_html')));

const modelName = argv.model;
const systemPrompt = fs.existsSync(argv.systemPrompt) ? fs.readFileSync(argv.systemPrompt, 'utf8') : argv.systemPrompt;
const isServer = argv.server;
const port = argv.port;
const timeout = argv.timeout;
const maxDensity = argv.maxDensity;

let serverRunning = false;

let currentResponse: Response | undefined = undefined;
let child: ChildProcess | undefined = undefined;
let history: ConversationInteraction[] = [];
let userInput = '';

const start = async () => {
    let running = true;

    if (serverRunning && currentResponse) {
        currentResponse.status(429).send('Try again later');
    }

    child = fork('./controller/runner.js');
    child.removeAllListeners();
   
    child.on('message', (message) => {
        const msg = message as any;

        if (msg.response?.length === 0) {
            if (child) {
                child.kill('SIGTERM');
                child.unref();

                running = false;
                process.stdin.removeAllListeners();
            }
        } else if (msg.response?.length > 0) {
            history = [...msg.history];
            if (isServer && currentResponse) {
                currentResponse.send(msg.response);
                console.info('User: ', userInput);
                console.info(msg.response);
                console.info('Word Count: ', wordCount(msg.response));
            }else{
                console.info(msg.response);
                process.stdout.write('\n> ');
            }
        } else if (msg === 'Initialized') {
            if (isServer) {
                console.info(`Server listening at http://${ip}:${port}`);
                console.info(`Model: ${modelName}`);
                console.info(`System prompt: ${systemPrompt}`);
            } else {
                process.stdout.write('\n> ');
            }
        }
    });

    child.on('exit', (code) => {
        if (code === 0) {
            console.info('Bye!');
        } else {
            start();
        }
    });

    child.send({ functionName: 'init', args: [modelName, systemPrompt, history.length >= 2 ? [history[0], history[history.length - 1]] : []] });
    
    async function getUserInput(): Promise<string> {
        return new Promise((resolve) => {
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
    }

    if (isServer && !serverRunning) {
        server.get('/api/chat', (req, res) => {
            if (child === undefined) throw new Error('Child process is not defined');
            const { prompt } = req.query;

            if (!prompt) {
                return res.status(400).send('Missing prompt query parameter');
            } else if (typeof prompt !== 'string') {
                return res.status(400).send('Invalid prompt query parameter');
            }
            currentResponse = res;
            child.send({ functionName: 'generateResponse', args: [prompt, maxDensity, timeout] });  
            
        });

        server.listen(port, ip, () => {
            console.info(`Server listening at http://${ip}:${port}`);
            serverRunning = true;
        });
    } else {
        // #region Chat loop
        while (running) {
            userInput = await getUserInput();
            if (userInput === '/exit') {
                console.info('Chat ended.');
                running = false;
                process.exit(0);
            }
            child.send({ functionName: 'generateResponse', args: [userInput, maxDensity, timeout] });        
        }

        // #endregion 
    }
};

start();
