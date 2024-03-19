import { Chat } from './chatStream';

(async () => {
    if (process.argv.length < 5) {
        console.error('Usage: node single.js <model-name> <system-prompt> <user-prompt>');
        process.exit(1);
    }

    const modelName = process.argv[2];
    const systemPrompt = process.argv[3];
    const userInput = process.argv[4];
    
    const chat = new Chat(modelName, systemPrompt);
    
    const lastResponse = await chat.generateResponse(userInput);
    console.log(lastResponse);
})();
