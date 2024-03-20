/* eslint-disable @typescript-eslint/no-explicit-any */
import { fork, ChildProcess } from 'child_process';

const modelName = process.argv[2];
const systemPrompt = process.argv[3];

let child: ChildProcess | undefined = undefined;

const start = async () => {
    let running = true;

    child = fork('./controller/runner.js');
    child.removeAllListeners();

    child.send({ functionName: 'init', args: [modelName, systemPrompt]});
    child.on('message', (message) => {
        const msg = message as any;
        
        if (msg.response?.length === 0) {
            if (child) {
                child.kill('SIGTERM');
                child.unref();            

                running = false;
                process.stdin.removeAllListeners();             
            }
        }else if (msg.response?.length > 0) {
            console.info(msg.response);
            process.stdout.write('\n> ');
        }else if (msg === 'Initialized') {
            process.stdout.write('\n> ');
        }
    });
    
    child.on('exit', (code) => {
        if (code === 0) {
            console.info('Bye!');
        } else {
            start();
        }
    });

    // #region Chat loop
    
    async function getUserInput(): Promise<string> {
        return new Promise((resolve) => {            
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
    }
    
    while (running) {
        const userInput = await getUserInput();
        if (userInput === '/exit') {
            console.info('Chat ended.');
            running = false;
            process.exit(0);
        }
        child.send({ functionName: 'generateResponse', args: [userInput]});      
    }

    // #endregion 
};

start();
