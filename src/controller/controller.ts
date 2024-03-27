/* eslint-disable @typescript-eslint/no-explicit-any */
import { fork, ChildProcess } from 'child_process';
import { ConversationInteraction } from 'node-llama-cpp';
import express, {  Response } from 'express';

import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(dirname(__filename));

const networkInterfaces = os.networkInterfaces();
if (!networkInterfaces) {
    throw new Error('Unable to get network interfaces');
}

const localIP = (process.platform === 'darwin' ? networkInterfaces['en0'] : networkInterfaces['eth0'])?.filter((details) => details.family === 'IPv4')[0]?.address;
const ip = localIP || 'localhost';

const server = express();
server.use(express.static(path.join(__dirname, 'public_html')));

const modelName = process.argv[2];
const systemPrompt = process.argv[3];
const isServer = process.argv[4] === '--server';
const port = 3000;
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
            }
            console.info(msg.response);
            process.stdout.write('\n> ');
        } else if (msg === 'Initialized') {
            if (isServer) {
                console.info(`Server listening at http://${ip}:${port}`);
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
            child.send({ functionName: 'generateResponse', args: [prompt] });  
            
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
            child.send({ functionName: 'generateResponse', args: [userInput] });        
        }

        // #endregion 
    }
};

start();
