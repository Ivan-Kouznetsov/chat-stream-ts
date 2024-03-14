import * as fs from 'fs';
import say from 'say';
import { Chat } from './chatStream';


(async () => {
    if (process.argv.length < 4) {
        console.error('Usage: node story.js <model-path> <system-prompt>');
        process.exit(1);
    }
    const useVoice = process.argv.includes('--voice');
    const showWordCount = process.argv.includes('--word-count');

    const modelName = process.argv[2];
    const systemPrompt = process.argv[3];
    
    const chat = new Chat(modelName, systemPrompt);
    

    async function getUserInput(): Promise<string> {
        return new Promise((resolve) => {
            process.stdout.write('\n> ');
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
    }

    let running = true;
    while (running) {
        const userInput = await getUserInput();
        if (userInput === '/exit') {
            console.log('Chat ended.');
            running = false;
            process.exit(0);
        }else if (userInput === '/history') {
            console.log(chat.getConversationHistory().map((interaction) => `${interaction.prompt}\n${interaction.response}`).join('\n'));            
            continue;
        }else if (userInput.startsWith('/save')) {
            const fileName = userInput.split(' ')[1];
            fs.writeFileSync(fileName, JSON.stringify(chat.getConversationHistory(), null, 2));
            continue;
        }

        const lastResponse = await chat.generateResponse(userInput, (s: string) => process.stdout.write(s), () => process.stdout.write('\n'));
        if (useVoice) say.speak(lastResponse);
        if (showWordCount) console.log('\nWord Count:', lastResponse.split('\n').join(' ').split(' ').length);      
    }
})();
