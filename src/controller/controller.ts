/* eslint-disable @typescript-eslint/no-explicit-any */
import { fork, ChildProcess } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

//console.debug = process.env.LOG_LEVEL==='debug' ? console.log : () => {};

// TODO: Log to a file

const modelName = process.argv[2];
const systemPrompt = process.argv[3];

let child: ChildProcess | undefined = undefined;


// Spawn the child process

const start = async () => {
    let running = true;

    child = fork('./controller/runner.js');
    child.removeAllListeners();

    console.debug('modelName:', modelName);
    console.debug('systemPrompt:', systemPrompt);

    console.debug('child process spawned. child.pid:', child.pid);
    console.debug('child.connected:', child.connected); 
    console.debug('child.channel:', child.channel);

    child.send({ functionName: 'init', args: [modelName, systemPrompt]});
    child.on('message', (message) => {
        console.debug('child process generated response:', message);
        if ((<any>message)?.response?.length === 0) {
            if (child) {
                child.kill('SIGTERM');
                child.unref();            

                running = false;                
            }
        }
    });

    // Handle exit
    
    child.on('exit', (code, signal) => {
        if (code === 0) {
            console.log('child process exited successfully');
        } else {
            // restart the child process

            console.error(`child process exited with code ${code} and signal ${signal}`);

            start();
            //console.error(stderr);
        }
    });

    // #region Chat loop
    async function getUserInput(): Promise<string> {
        return new Promise((resolve) => {
            process.stdout.write('\n> ');
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
    }

    
    while (running) {
        const userInput = await getUserInput();
        if (userInput === '/exit') {
            console.log('Chat ended.');
            running = false;
            process.exit(0);
        }
        child.send({ functionName: 'generateResponse', args: [userInput]});      
    }

    // #endregion
 
};

start();
