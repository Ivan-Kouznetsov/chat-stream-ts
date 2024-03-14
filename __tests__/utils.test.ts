import { countRepeatedWords, readModelSettingsWithDefaults, validateSettings, readSettings } from '../src/utils';
import fs from 'fs';

jest.mock('fs');

// Mock fs.readFileSync
(fs.readFileSync as jest.Mock) = jest.fn().mockImplementation((path) => {
    if (path === '/path/to/model1') {
        return JSON.stringify('model text');
    } else if (path === '/path/to/model2') {
        return JSON.stringify('model text');
    } else {
        throw new Error(`Unrecognized path: ${path}`);
    }
});


describe('Utils tests', () => {
    describe('countRepeatedWords', () => {
        it('should return the maximum count of repeated words in a string', () => {
            const str = 'hello hello world world world';
            expect(countRepeatedWords(str)).toBe(2);
        });

        it('should return 0 if there are no repeated words', () => {
            const str = 'hello world';
            expect(countRepeatedWords(str)).toBe(0);
        });
    });

    describe('readModelSettingsWithDefaults', () => {
        it('should merge model settings with default settings', () => {
            const settings = {
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1',
                        maxTokens: 200,
                        batchSize: 64
                    },
                    {
                        name: 'model2',
                        filePath: '/path/to/model2'
                    }
                ]
            };

            const expectedSettings = {
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1',
                        maxTokens: 200,
                        batchSize: 64,
                        contextSize: 5,
                        temperature: 0.8,
                        topP: 0.5,
                        topK: 10,
                        seed: 123,
                        stopWords: ['the', 'and']
                    },
                    {
                        name: 'model2',
                        filePath: '/path/to/model2',
                        maxTokens: 100,
                        batchSize: 32,
                        contextSize: 5,
                        temperature: 0.8,
                        topP: 0.5,
                        topK: 10,
                        seed: 123,
                        stopWords: ['the', 'and']
                    }
                ]
            };

            expect(readModelSettingsWithDefaults(settings)).toEqual(expectedSettings);
        });
    });

    describe('validateSettings', () => {
        it('should return success if settings are valid', () => {
            const settings = {
                defaultModel: 'model1',
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1'
                    }
                ]
            };

            expect(validateSettings(settings)).toEqual({ success: true });
        });

        it('should return error if settings object is invalid', () => {
            const settings = null;
            // @ts-expect-error intentionally using invalid settings for this test 
            expect(validateSettings(settings)).toEqual({ success: false, error: 'Invalid settings object' });
        });

        it('should return failure if defaultModel is invalid', () => {
            const settings = {
                defaultModel: 123,
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1'
                    }
                ]
            };

            // @ts-expect-error intentionally using invalid settings for this test
            expect(validateSettings(settings)).toEqual({ success: false, 'error': 'Invalid defaultModel' });
        });

        it('should return failure if defaultModel is invalid', () => {
            const settings = {
                defaultModel: 'model1',
                defaults: null,
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1'
                    }
                ]
            };

            // @ts-expect-error intentionally using invalid settings for this test
            expect(validateSettings(settings)).toEqual({ success: false, 'error': 'Invalid defaults object' });
        });

        it('should return failure if a default key is missing', () => {
            const settings = {
                defaultModel: 'model1',
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    //    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1'
                    }
                ]
            };

            // @ts-expect-error intentionally using invalid settings for this test
            expect(validateSettings(settings)).toEqual({ success: false, 'error': 'Missing default key: contextSize' });
        });

        it('should return failure if there is an invalid models array\'', () => {
            const settings = {
                defaultModel: 'model1',
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: 'model1'
            };

            // @ts-expect-error intentionally using invalid settings for this test
            expect(validateSettings(settings)).toEqual({ success: false, 'error': 'Invalid models array' });
        });

        test.each(['maxTokens', 'batchSize', 'contextSize', 'temperature', 'topP', 'topK', 'seed', 'stopWords', 'name', 'filePath'])('should return failure if there is an invalid %s', (key) => {
            const settings = {
                defaultModel: 'model1',
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    {
                        name: 'model1',
                        filePath: '/path/to/model1',
                        maxTokens: 200,
                        batchSize: 64,
                        contextSize: 5,
                        temperature: 0.8,
                        topP: 0.5,
                        topK: 10,
                        seed: 123,
                        stopWords: ['the', 'and']
                    }
                ]
            };

            // @ts-expect-error intentionally using invalid settings for this test
            settings.models[0][key] = Symbol('invalid');
            const result = validateSettings(settings);

            expect(result.success).toEqual(false);
            expect(result.error).toContain(key);
        });

        test('should return failure if there is an invalid model', () => {
            const settings = {
                defaultModel: 'model1',
                defaults: {
                    maxTokens: 100,
                    batchSize: 32,
                    contextSize: 5,
                    temperature: 0.8,
                    topP: 0.5,
                    topK: 10,
                    seed: 123,
                    stopWords: ['the', 'and']
                },
                models: [
                    null
                ]
            };

            // @ts-expect-error intentionally using invalid settings for this test
            const result = validateSettings(settings);

            expect(result.success).toEqual(false);
            expect(result.error).toContain('model');
        });
    });

    describe('readSettings', () => {
        it('should return the model settings for the specified model name', () => {
            const settingsText = `{
                "defaultModel": "model1",
                "defaults": {
                    "maxTokens": 100,
                    "batchSize": 32,
                    "contextSize": 5,
                    "temperature": 0.8,
                    "topP": 0.5,
                    "topK": 10,
                    "seed": 123,
                    "stopWords": ["the", "and"]
                },
                "models": [
                    {
                        "name": "model1",
                        "filePath": "/path/to/model1"
                    },
                    {
                        "name": "model2",
                        "filePath": "/path/to/model2"
                    }
                ]
            }`;

            const modelName = 'model1';

            const expectedModel = {
                name: 'model1',
                filePath: '/path/to/model1',
                maxTokens: 100,
                batchSize: 32,
                contextSize: 5,
                temperature: 0.8,
                topP: 0.5,
                topK: 10,
                seed: 123,
                stopWords: ['the', 'and']
            };

            expect(readSettings(settingsText, modelName)).toEqual(expectedModel);
        });

        it('should throw an error if model name is not found', () => {
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit was called');
            });

            const settingsText = `{
                "defaultModel": "model1",
                "defaults": {
                    "maxTokens": 100,
                    "batchSize": 32,
                    "contextSize": 5,
                    "temperature": 0.8,
                    "topP": 0.5,
                    "topK": 10,
                    "seed": 123,
                    "stopWords": ["the", "and"]
                },
                "models": [
                    {
                        "name": "model1",
                        "filePath": "/path/to/model1"
                    }
                ]
            }`;

            const modelName = 'model2';

            expect(() => readSettings(settingsText, modelName)).toThrowError('process.exit was called');
            exitSpy.mockRestore();

        });
    });
});