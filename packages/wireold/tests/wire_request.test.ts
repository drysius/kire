
import { describe, expect, it } from "bun:test";
import { wirePlugin } from "../src/index";
import { Kire } from "kire";

describe("Wired WireRequest", () => {
    const kire = new Kire({ silent: true });
    kire.plugin(wirePlugin);

    it("should handle asset requests", async () => {
        const res = await kire.wireRequest({
            path: "/_wire/kirewire.js",
            method: "GET"
        });

        expect(res.status).toBe(200);
        expect(res.headers?.["Content-Type"]).toBe("application/javascript");
        expect(res.body).toContain("window.Kirewire");
    });

    it("should return not_wired for unknown routes", async () => {
        const res = await kire.wireRequest({
            path: "/other-route",
            method: "GET"
        });

        expect(res.code).toBe("not_wired");
    });

    it("should handle component requests on root", async () => {
        const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: { component: "test", snapshot: null, updates: {} }
        });

        expect(res.status).toBe(200); 
        expect(res.body.components[0].error).toBe("Component not found: test");
    });
});
