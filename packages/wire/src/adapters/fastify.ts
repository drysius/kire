import { WireCore } from '../core';

export const Fastifywire = () => {
    const core = WireCore.get();
    const options = core.getOptions();
    const route = options.route || '/_kirewire';

    return async (fastify: any) => {
        fastify.post(route, async (req: any, reply: any) => {
            try {
                const response = await core.handleRequest(req.body, {
                    req,
                    res: reply,
                    user: req.user
                });

                if (response.error) {
                    reply.code(400).send(response);
                } else {
                    reply.send(response);
                }
            } catch (e: any) {
                fastify.log.error(e);
                reply.code(500).send({ error: e.message });
            }
        });
    };
};