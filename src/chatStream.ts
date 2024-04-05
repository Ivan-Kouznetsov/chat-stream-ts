import { LlamaModel, LlamaContext, LlamaChatSession, ConversationInteraction } from 'node-llama-cpp';
import { repetitionDensity } from './utils';

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

    constructor(options: {
        modelName: string,
        systemPrompt: string,
        conversationHistory: ConversationInteraction[],
        contextSize: number,
        batchSize: number,
        topK: number,
        topP: number,
        maxTokens: number,
        temperature: number,
        stopWords: string[],
        seed: number | null,
        filePath: string
    }) {

        const { modelName, systemPrompt, conversationHistory, contextSize, batchSize, topK, topP, maxTokens, temperature, stopWords, seed, filePath: modelPath } = options;

        this.modelName = modelName;
        this.systemPrompt = systemPrompt;
        this.conversationHistory = conversationHistory;

        if (!contextSize || !batchSize || !topK || !topP || !maxTokens || typeof temperature === 'undefined' || !stopWords || !modelPath) {
            throw new Error('One or more required variables are undefined.');
        }

        this.topK = topK;
        this.topP = topP;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.stopWords = stopWords;

        if (systemPrompt.length > 0) this.stopWords.push(systemPrompt);

        const model = new LlamaModel({
            modelPath
        });
        if (!batchSize) throw new Error('Batch size is required');

        this.context = new LlamaContext({ model, contextSize, batchSize, seed });
        this.session = new LlamaChatSession({ context: this.context, systemPrompt });
    }

    public async generateResponse(userInput: string, maxDensity = 0.40, timelimit = 0) {
        const thisInteraction: ConversationInteraction = { prompt: userInput, response: '' };
        const responseAbortController = new AbortController();
        if (timelimit > 0) setTimeout(() => responseAbortController.abort(), timelimit);

        let stop = false;
        try {
            await this.session.prompt(userInput, {
                signal: responseAbortController.signal,
                onToken: (chunk: number[]) => {
                    if (stop) return;
                    const token = this.context.decode(chunk);
                    thisInteraction.response += token;

                    this.stopWords.forEach((word) => {

                        const index = thisInteraction.response.indexOf(word);
                        if (index !== -1) {
                            thisInteraction.response = thisInteraction.response.slice(0, index);
                            stop = true;
                            responseAbortController.abort();
                        }
                    });

                    const density = repetitionDensity(thisInteraction.response);
                    if (density > maxDensity) {
                        stop = true;
                        responseAbortController.abort();
                    }
                },
                maxTokens: this.maxTokens,
                temperature: this.temperature,
                topK: this.topK,
                topP: this.topP
            });
        } catch {
            if (process.env.NODE_ENV === 'development') {
                console.info('Response generation aborted');
            }
        }

        if (this.systemPrompt.length > 0) thisInteraction.response = thisInteraction.response.trim().replace(this.systemPrompt, '');

        thisInteraction.response = thisInteraction.response.trim();
        this.conversationHistory.push(thisInteraction);
        // reset session with conversation history

        this.session = new LlamaChatSession({ context: this.context, systemPrompt: this.systemPrompt, conversationHistory: this.conversationHistory });

        return thisInteraction.response;
    }

    public getConversationHistory() {
        return this.conversationHistory;
    }

    public getModelName() {
        return this.modelName;
    }
}
