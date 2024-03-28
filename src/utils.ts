import { Model, Settings, DefaultSettings } from './types';
import fs from 'fs';

export const repetitionDensity = (str: string , lastWordsCount = 100) => {
    const words = stripPunctuation(str).split(/\s+/);
    const lastWords = words.slice(-lastWordsCount);
    const uniqueWords = new Set(lastWords);
    const totalWords = lastWords.length;

    if (totalWords < lastWordsCount) return -1;

    const repetitions = totalWords - uniqueWords.size;
    const density = (repetitions / totalWords);
    return density;
};

export const readModelSettingsWithDefaults = (settings: { defaults: Record<string, unknown>; models: Record<string, unknown>[]; }) => {
    const defaults = settings.defaults;

    settings.models = settings.models.map((model) => {
        for (const key in defaults) {
            if (model[key] === undefined) {
                model[key] = defaults[key];
            }
        }
        return model;
    });

    return settings;
};
type Validation =
    | { success: true; error?: never }
    | { success: false; error: string };

export const validateSettings = (settings: Settings): Validation => {

    if (typeof settings !== 'object' || settings === null) {
        return { success: false, error: 'Invalid settings object' };
    }

    if (typeof settings.defaultModel !== 'string') {
        return { success: false, error: 'Invalid defaultModel' };
    }

    if (typeof settings.defaults !== 'object' || settings.defaults === null) {
        return { success: false, error: 'Invalid defaults object' };
    }

    const defaultKeys = ['maxTokens', 'batchSize', 'contextSize', 'temperature', 'topP', 'topK', 'seed', 'stopWords'];
    for (const key of defaultKeys) {
        if (!(key in settings.defaults)) {
            return { success: false, error: `Missing default key: ${key}` };
        }
    }

    if (!Array.isArray(settings.models)) {
        return { success: false, error: 'Invalid models array' };
    }

    for (const model of settings.models) {
        if (typeof model !== 'object' || model === null) {
            return { success: false, error: 'Invalid model object' };
        }

        if (typeof model.name !== 'string') {
            return { success: false, error: 'Invalid model name or name' };
        }

        if (typeof model.stopWords !== 'undefined' && (!Array.isArray(model.stopWords) || !model.stopWords.every((word: string) => typeof word === 'string'))) {
            return { success: false, error: 'Invalid stopWords array' };
        }

        if (typeof model.maxTokens !== 'undefined' && typeof model.maxTokens !== 'number') {
            return { success: false, error: 'Invalid maxTokens' };
        }

        if (typeof model.batchSize !== 'undefined' && typeof model.batchSize !== 'number') {
            return { success: false, error: 'Invalid batchSize' };
        }

        if (typeof model.contextSize !== 'undefined' && typeof model.contextSize !== 'number') {
            return { success: false, error: 'Invalid contextSize' };
        }

        if (typeof model.temperature !== 'undefined' && typeof model.temperature !== 'number') {
            return { success: false, error: 'Invalid temperature' };
        }

        if (typeof model.topP !== 'undefined' && typeof model.topP !== 'number') {
            return { success: false, error: 'Invalid topP' };
        }

        if (typeof model.topK !== 'undefined' && typeof model.topK !== 'number') {
            return { success: false, error: 'Invalid topK' };
        }

        if (typeof model.seed !== 'undefined' && model.seed != null && (typeof model.seed !== 'number' || model.seed < 0)) {
            return { success: false, error: 'Invalid seed' };
        }

        if (typeof model.filePath !== 'string' || fs.existsSync(model.filePath) === false) {
            return { success: false, error: 'Invalid filePath' };
        }

    }

    return { success: true };
};

export const readSettings = (settingsText: string, modelName: string) => {
    try {
        const requiredKeys = ['contextSize', 'batchSize', 'topK', 'topP', 'maxTokens', 'temperature', 'stopWords', 'seed', 'filePath'];

        const settings: Settings = JSON.parse(settingsText);
        const validation = validateSettings(settings);
        if (!validation.success) throw new Error(validation.error);
        const model = settings.models.find((model: { name: string; }) => model.name === modelName);
        if (!model) throw new Error(`Model not found: ${modelName}`);

        for (const key of requiredKeys) {
            if (model[key as keyof Model] === undefined) {
                (model[key as keyof Model] as (number | string[] | null)) = settings.defaults[key as keyof DefaultSettings];
            }
        }

        // #region asserting that all required keys are present in the model object for TypeScript inference
        /**
         * This block is here for TypeScript to know that all required keys are present in the model object.
         * This is because the requiredKeys array is a string array and TypeScript doesn't know that all the keys in the array are present in the model object.
         * It should not actually throw an error because we have already checked that all required keys are present in the model object.
         */
        /* istanbul ignore */
        for (const key of requiredKeys) {
            /* istanbul ignore next */
            if (model[key as keyof Model] === undefined) {
                /* istanbul ignore next */
                throw new Error(`Missing required key in model: ${key}`);
            }
        }

        //#endregion

        return model;
    } catch (e) {
        console.log('Error reading settings.json', e);
        process.exit(1);
    }
};

export const stripPunctuation = (str: string) => str.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');

export const wordCount = (str: string) => stripPunctuation(str).trim().split(/\s+/).filter(s => s.length > 0).length;
