import { Chat } from './chatStream';
import { readSettings } from './utils';
import fs from 'fs';

(async () => {
    if (process.argv.length < 5) {
        console.error('Usage: node single.js <model-name> <system-prompt> <user-prompt>');
        process.exit(1);
    }

    const modelName = process.argv[2];
    const systemPrompt = process.argv[3];
    const userInput = process.argv[4];

    const model = readSettings(fs.readFileSync('settings.json', 'utf8'), modelName);

    const chat = new Chat({...model, modelName:model.name, systemPrompt, conversationHistory:[]});

    const lastResponse = await chat.generateResponse(userInput);
    console.log(lastResponse);
})();
