import dotenv from 'dotenv';
dotenv.config();

describe('API', () => {
    const url = `http://${process.env.LOCAL_IP}:${process.env.LOCAL_PORT}`;

    it('should return 200', async () => {
        const response = await fetch(`${url}/chat?prompt=hello`);
        expect(response.status).toBe(200);
    });

    it.skip('should return 200 after 10 requests', async () => {
        for (let i = 0; i < 10; i++) {
            console.log(`${Date.now()} Request ${i}`);
            const prompt = encodeURIComponent('write a story about a cat and a dog');
            const response = await fetch(`${url}/chat?prompt=${prompt}`);
            const responseBody = await response.text();
            
            expect(responseBody).toBeTruthy();
            expect(response.status).toBe(200);
        }
    }, 60000);

});
