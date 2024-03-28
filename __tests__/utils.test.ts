import { repetitionDensity, readModelSettingsWithDefaults, validateSettings, readSettings, wordCount } from '../src/utils';
import { repeat, uniqueWords, life } from './fixtures/repeat';
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
    describe('countRepeatedWordsRate', () => {
        it('should return -1 for short string', () => {
            const str = 'hello hello world world world';
            expect(repetitionDensity(str)).toBe(-1);
        });

        it('should return 0 if there are no repeated words', () => {
            expect(repetitionDensity(uniqueWords)).toBe(0);
        });

        it('should return a positive value for long text passage', () => {
            const densities:number[] = [];
            for (let i = 0; i < repeat.length; i++) {
                densities.push(repetitionDensity(repeat.substring(0, i)));
            }
            
            expect(Math.max(...densities)).toBe(0.42);
        });

        it('should return a high value for very repetitive passage', () => {
            const densities:number[] = [];
            for (let i = 0; i < life.length; i++) {
                densities.push(repetitionDensity(life.substring(0, i)));
            }
            
            expect(Math.max(...densities)).toBe(0.79);
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

    describe('wordCount', () => {
        it('should return the correct word count for a string', () => {
            const str = 'This is a test string.';
            expect(wordCount(str)).toBe(5);
        });

        it('should return 0 for an empty string', () => {
            const str = '';
            expect(wordCount(str)).toBe(0);
        });

        it('should return 0 for a string with only whitespace', () => {
            const str = '     ';
            expect(wordCount(str)).toBe(0);
        });

        it('should return the correct word count for a string with punctuation', () => {
            const str = 'Hello, world ! How are you ?';
            expect(wordCount(str)).toBe(5);
        });

        it('should return the correct word count for a string with multiple spaces between words', () => {
            const str = 'Hello     world';
            expect(wordCount(str)).toBe(2);
        });
    });
});
