import type { Request, Response, NextFunction } from 'express';
import { WireCore } from '../core';

export const Expresswire = () => {
    const core = WireCore.get();
    const options = core.getOptions();
    const route = options.route || '/_kirewire';

    return async (req: Request, res: Response, next: NextFunction) => {
        if (req.method === 'POST' && req.path === route) {
            try {
                const response = await core.handleRequest(req.body, {
                    req,
                    res,
                    user: (req as any).user
                });

                if (response.error) {
                    res.status(400).json(response);
                } else {
                    res.json(response);
                }
            } catch (e: any) {
                console.error(e);
                res.status(500).json({ error: e.message });
            }
        } else {
            next();
        }
    };
};