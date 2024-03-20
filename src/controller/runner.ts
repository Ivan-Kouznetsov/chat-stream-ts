
import { Chat } from '../chatStream';
import { ConversationInteraction } from 'node-llama-cpp';

let chat:Chat | undefined = undefined;

export const init = (modelName:string, systemPrompt:string, conversationHistory: ConversationInteraction[] = [] ) => {
    chat = new Chat(modelName, systemPrompt, conversationHistory);
};

process.on('message', (message: {functionName: string, args: never[]}) => {
    switch (message.functionName) {
    case 'init':
        init(message.args[0], message.args[1], message.args[2]);
        process.send?.('Initialized');      
        break;
    case 'generateResponse':
        chat?.generateResponse(message.args[0]).then((response) => {
            process.send?.({response, history: chat?.getConversationHistory()});
        });
        break;
    }    
});
