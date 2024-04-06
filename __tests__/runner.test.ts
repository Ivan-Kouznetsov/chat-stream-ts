/* eslint-disable @typescript-eslint/no-explicit-any */
import { fork, ChildProcess, exec } from 'child_process';
import { resolve } from 'path';
import { readSettings } from '../src/utils';
import fs from 'fs';
import { Model } from '../src/types';

describe('Test runner.js', () => {
    const seedResponses = [
        {seed:  1, response: '3:15'},
        {seed:  1000799917193444, response: 'It is currently 9:32 AM.'},
        {seed:  2001599834386887, response: 'It is currently 7:30 PM.'},
        {seed:  3002399751580330, response: 'It is currently 3:45 PM.'},
        {seed:  4003199668773773, response: 'It is currently 12:00.'},
        {seed:  5003999585967216, response: 'It is currently 3:15 PM.'},
        {seed:  6004799503160659, response: 'Sorry, I can\'t answer that.'},
        {seed:  7005599420354102, response: 'Right now it is 2:40 PM.'},
        {seed:  8006399337547545, response: 'Please provide the date for which you want to know the time.'},
        {seed:  9007199254740988, response: '3:15'}
    ];

    let child: ChildProcess;
    let model: Model | undefined = undefined;
    beforeAll((done) => {
        model = readSettings(fs.readFileSync('./src/settings.json', 'utf8'), 'openchat');
        if (typeof model === 'undefined') throw new Error('Model is undefined');
        
        
        exec('npm run build', (_, stdout, stderr) => {
            if (stdout) console.info(`stdout: ${stdout}`);
            if (stderr) console.info(`stderr: ${stderr}`);
            done();
        });
    }); 

    beforeEach(() => {
        child = fork(resolve(__dirname, '../dist/controller/runner.js'));
    });

    afterEach(() => {
        if (child){
            child.kill('SIGTERM');
            child.unref();
        }
    });

    it('should initialize', (done) => {
        child.on('message', (message) => {
            expect(message).toBe('Initialized');
            done();
        });
        child.send({ functionName: 'init', args: [model, 'You are a clock', []] });
    });

    it.each(seedResponses)('should respond to prompt consistantly based on seed of %s', (seedResponse,done) => {
        model!.seed = seedResponse.seed;

        child.on('message', (message) => {            
            if (typeof message==='string') expect(message).toBe('Initialized');
            if (typeof message==='object' && 'response' in message && typeof message.response === 'string') {
                if (message.response.includes(seedResponse.response)) {
                    done();
                }else{
                    done(new Error(`Expected: ${seedResponse.response} got ${message.response}`));
                }
            }           
        });
        child.send({ functionName: 'init', args: [model, 'You are a clock', []] });
        // Send a message to the child process
        child.send({ functionName: 'generateResponse', args: ['What time is it?', 0.40, 0] });
    }, 60000);
});
