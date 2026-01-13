import { Kirewire } from "../plugin";

/**
 * Elysia Adapter for Kirewire.
 * Automatically registers the POST route for Kirewire.
 * 
 * @param app Elysia application instance.
 */
export function Elysiawire(app: any) {
    app.post(Kirewire.options.route || "/_kirewire", async (context: any) => {
        if (Kirewire.trust(context.body)) {
            // context in Elysia can act as the 'req' object for Kirewire.process
            const result = await Kirewire.process(context);
            context.set.status = result.code;
            return result.data;
        } else {
            const err = Kirewire.errors.invalid_request;
            context.set.status = err.code;
            return err;
        }
    });
}
