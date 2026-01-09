import { WireCore } from '../core';

export const Socketwire = (wss: any) => {
    const core = WireCore.get();

    wss.on('connection', (ws: any, req: any) => {
        ws.on('message', async (message: string) => {
            try {
                const payload = JSON.parse(message);
                const { id, ...wirePayload } = payload;

                const response = await core.handleRequest(wirePayload, {
                    req,
                    socket: ws,
                    user: (req as any).user 
                });

                ws.send(JSON.stringify({
                    id, 
                    ...response
                }));

            } catch (e) {
                console.error(e);
                ws.send(JSON.stringify({ error: 'Invalid message' }));
            }
        });
    });
};