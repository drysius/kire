
import { describe, expect, it } from "bun:test";
import { Wired } from "../src/wired";
import { Kire } from "kire";

describe("Wired WireRequest", () => {
    const kire = new Kire({ silent: true });
    kire.plugin(Wired.plugin);

    it("should handle asset requests", async () => {
        const res = await kire.WireRequest({
            path: "/_wired/kirewire.js",
            method: "GET"
        });

        expect(res.status).toBe(200);
        expect(res.headers?.["Content-Type"]).toBe("application/javascript");
        expect(res.body).toContain("window.Kirewire");
    });

    it("should return not_wired for unknown routes", async () => {
        const res = await kire.WireRequest({
            path: "/other-route",
            method: "GET"
        });

        expect(res.code).toBe("not_wired");
    });

    it("should handle component requests on root", async () => {
        const res = await kire.WireRequest({
            path: "/_wired",
            method: "POST",
            body: { component: "test", snapshot: null, updates: {} }
        });

        expect(res.status).toBe(200); 
        expect(res.body.components[0].error).toBe("Component not found: test");
    });
});
