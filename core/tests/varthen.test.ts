import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire varThen System", () => {
    test("should trigger varThen for simple variable usage", async () => {
        const kire = new Kire({ silent: true });
        let triggered = false;
        kire.varThen("MY_VAR", (api) => {
            triggered = true;
            api.prologue("const MY_VAR = 'resolved';");
        });

        const result = await kire.render("{{ MY_VAR }}");
        expect(triggered).toBe(true);
        expect(result).toBe("resolved");
    });

    test("should trigger varThen for property access (var.prop)", async () => {
        const kire = new Kire({ silent: true });
        let triggered = false;
        kire.varThen("USER", (api) => {
            triggered = true;
            api.prologue("const USER = { name: 'John' };");
        });

        const result = await kire.render("{{ USER.name }}");
        expect(triggered).toBe(true);
        expect(result).toBe("John");
    });

    test("should trigger varThen for optional chaining (var?.prop)", async () => {
        const kire = new Kire({ silent: true });
        let triggered = false;
        kire.varThen("USER", (api) => {
            triggered = true;
            api.prologue("const USER = { name: 'Doe' };");
        });

        const result = await kire.render("{{ USER?.name }}");
        expect(triggered).toBe(true);
        expect(result).toBe("Doe");
    });

    test("should trigger varThen for typeof", async () => {
        const kire = new Kire({ silent: true });
        let triggered = false;
        kire.varThen("MY_VAR", (api) => {
            triggered = true;
            api.prologue("const MY_VAR = 123;");
        });

        const result = await kire.render("{{ typeof MY_VAR }}");
        expect(triggered).toBe(true);
        expect(result).toBe("number");
    });

    test("should trigger varThen for negation (!var, !!var)", async () => {
        const kire = new Kire({ silent: true });
        let triggeredCount = 0;
        kire.varThen("FLAG", (api) => {
            triggeredCount++;
            api.prologue("const FLAG = true;");
        });

        const result = await kire.render("{{ !FLAG }} - {{ !!FLAG }}");
        expect(triggeredCount).toBe(1);
        expect(result).toBe("false - true");
    });

    test("should trigger varThen for parenthetical usage ((var))", async () => {
        const kire = new Kire({ silent: true });
        let triggered = false;
        kire.varThen("VAL", (api) => {
            triggered = true;
            api.prologue("const VAL = 10;");
        });

        const result = await kire.render("{{ (VAL) * 2 }}");
        expect(triggered).toBe(true);
        expect(result).toBe("20");
    });

    test("should handle varThen dependencies (one varThen uses another)", async () => {
        const kire = new Kire({ silent: true });
        let aTriggered = false;
        let bTriggered = false;

        kire.varThen("VAR_A", (api) => {
            aTriggered = true;
            api.prologue("const VAR_A = 'A';");
        });

        kire.varThen("VAR_B", (api) => {
            bTriggered = true;
            api.prologue("const VAR_B = VAR_A + 'B';");
        });

        const result = await kire.render("{{ VAR_B }}");
        expect(aTriggered).toBe(true);
        expect(bTriggered).toBe(true);
        expect(result).toBe("AB");
    });

    test("should NOT trigger varThen if variable is not used", async () => {
        const kire = new Kire({ silent: true });
        let triggered = false;
        kire.varThen("UNUSED", (api) => {
            triggered = true;
        });

        await kire.render("Hello World");
        expect(triggered).toBe(false);
    });
});
