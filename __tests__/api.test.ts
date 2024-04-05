import dotenv from 'dotenv';
dotenv.config();

describe('API', () => {
    const url = `http://${process.env.LOCAL_IP}:${process.env.LOCAL_PORT}`;

    it('should return 200', async () => {
        const response = await fetch(`${url}/api/chat?prompt=hello`);
        expect(response.status).toBe(200);
    }, 60000);

    it.skip('should return 200 after 10 requests', async () => {
        for (let i = 0; i < 10; i++) {
            console.info(`${Date.now()} Request ${i}`);
            const prompt = encodeURIComponent('write a story about a cat and a dog');
            const response = await fetch(`${url}/api/chat?prompt=${prompt}`);
            const responseBody = await response.text();
            
            expect(response.status).toBe(200);
            expect(responseBody).toBeTruthy();
        }
    }, 1_800_000); // 30 minutes

});
