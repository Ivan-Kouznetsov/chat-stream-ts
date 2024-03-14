export interface DefaultSettings {
    stopWords: string[];
    maxTokens: number;
    batchSize: number;
    contextSize: number;
    temperature: number;
    topP: number;
    topK: number;
    seed: null | number;
}

export interface Model {
    name: string;
    filePath: string;
    stopWords?: string[];
    maxTokens?: number;
    batchSize?: number;
    contextSize?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    seed?: null | number;
}

export interface Settings {
    defaultModel: string;
    defaults: DefaultSettings;
    models: Model[];
}