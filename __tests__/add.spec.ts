import { add } from '../src/add';

describe("Sample tests", () => {
    it("should add two numbers", () => {
        expect(add(1, 2)).toBe(3);
    });
})