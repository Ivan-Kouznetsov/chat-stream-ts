import fs from 'fs';
import { LlamaModel, LlamaContext, LlamaChatSession, ConversationInteraction } from 'node-llama-cpp';
import { readSettings } from './utils';

export class Chat {
    private modelName: string;
    private systemPrompt: string;
    private conversationHistory: ConversationInteraction[];
    private topK: number;
    private topP: number;
    private maxTokens: number;
    private temperature: number;
    private stopWords: string[];
    private context: LlamaContext;
    private session: LlamaChatSession;

    constructor(modelName: string, systemPrompt: string) {
        this.modelName = modelName;
        this.systemPrompt = systemPrompt;
        this.conversationHistory = [];      

        const { contextSize, batchSize, topK, topP, maxTokens, temperature, stopWords, seed, filePath: modelPath } = readSettings(fs.readFileSync('settings.json', 'utf8'), modelName);
       
        if (!contextSize || !batchSize || !topK || !topP || !maxTokens || !temperature || !stopWords || !modelPath) {
            throw new Error('One or more required variables are undefined.');
        }
        
        this.topK = topK;
        this.topP = topP;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.stopWords = stopWords;

        const model = new LlamaModel({
            modelPath
        });
        if (!batchSize) throw new Error('Batch size is required');

        this.context = new LlamaContext({ model, contextSize, batchSize, seed });
        this.session = new LlamaChatSession({ context: this.context, systemPrompt });
    }

    public async generateResponse(userInput: string, modelOutput: (s: string) => void, endStream: () => void) {
        const thisInteraction: ConversationInteraction = { prompt: userInput, response: '' };
        let stop = false;
        const response = await this.session.prompt(userInput, {
            onToken: (chunk: number[]) => {
                const token = this.context.decode(chunk);
                stop = this.stopWords.some((stopWord: string) => token.trim().startsWith(stopWord));
                if (stop) return;

                thisInteraction.response += token;
                
                modelOutput(token);
            },
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            topK: this.topK,
            topP: this.topP
        });
        stop = false;
        endStream();
        this.conversationHistory.push(thisInteraction);
        // reset session with conversation history 
        this.session = new LlamaChatSession({ context: this.context, systemPrompt: this.systemPrompt, conversationHistory: this.conversationHistory });
        return response;
    }

    public getConversationHistory() {
        return this.conversationHistory;
    }

    public getModelName() {
        return this.modelName;
    }
}

// Usage:
//const chat = new Chat('openchat', 'You are a friendly assistant named May. You like to chat with the User.');
