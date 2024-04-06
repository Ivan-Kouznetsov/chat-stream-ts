
import { Chat } from '../chatStream';
import { ConversationInteraction } from 'node-llama-cpp';
import { Model } from '../types';

let chat:Chat | undefined = undefined;

export const init = (model:Model, systemPrompt:string, conversationHistory: ConversationInteraction[] = [] ) => {
    chat = new Chat({...model, modelName:model.name, systemPrompt, conversationHistory});
};

process.on('message', (message: {functionName: string, args: never[]}) => {
    switch (message.functionName) {
    case 'init':
        init(message.args[0], message.args[1], message.args[2]);
        process.send?.('Initialized');      
        break;
    case 'generateResponse':
        if (!chat) throw new Error('Chat is not initialized');        

        chat.generateResponse(...(message.args as unknown as [string, number, number])).then((response) => {
            if (process.send === undefined) throw new Error('process.send is undefined');
            process.send({response, history: chat?.getConversationHistory()});
        });
        break;
    default: throw new Error(`Invalid function name: ${message.functionName}`);
    }    
});
