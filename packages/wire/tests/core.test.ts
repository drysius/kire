import { describe, expect, test, beforeEach } from "bun:test";
import { WireCore, WireComponent } from "../src";
import { Kire } from "kire";

// Mock component
class Counter extends WireComponent {
  public count = 0;

  async increment() {
    this.count++;
  }

  async render() {
    return `Count: ${this.count}`;
  }
}

describe("WireCore", () => {
  let kire: Kire;
  let core: WireCore;

  beforeEach(() => {
    kire = new Kire();
    // Re-initialize core singleton for each test if possible, 
    // but since it's a singleton, we just re-init it with kire.
    core = WireCore.get();
    core.init(kire, { secret: "test-secret" });
  });

  test("should register and retrieve components", () => {
    core.registerComponent("counter", Counter);
    const Retrieved = core.getComponentClass("counter");
    expect(Retrieved).toBe(Counter);
  });

  test("should handle initial request (render)", async () => {
    core.registerComponent("counter", Counter);
    
    // Simulate a request without snapshot (initial load is usually done via @wire directive, 
    // but handleRequest can also be used for subsequent updates)
    // Actually, handleRequest expects a payload which comes from the client update.
    // If we want to test initial render logic, we usually go through the directive.
    // But let's test a "refresh" or method call.
    
    // Create an instance manually to get a valid snapshot first
    const instance = new Counter();
    instance.count = 5;
    const snapshot = core.getCrypto().sign(instance.getPublicProperties());

    const response = await core.handleRequest({
      component: "counter",
      snapshot: snapshot,
      method: "increment",
      params: []
    });

    expect(response.error).toBeUndefined();
    expect(response.html).toBe("Count: 6");
    expect(response.updates).toEqual({ count: 6 });
    expect(response.snapshot).toBeDefined();
    
    // Verify the new snapshot
    const newState = core.getCrypto().verify(response.snapshot!);
    expect(newState.count).toBe(6);
  });

  test("should fail with invalid snapshot", async () => {
    const response = await core.handleRequest({
      component: "counter",
      snapshot: "invalid.token.here",
      method: "increment"
    });

    expect(response.error).toBe("Invalid snapshot signature");
  });

  test("should fail with unknown component", async () => {
    const response = await core.handleRequest({
      component: "unknown-component",
      snapshot: "", // Empty snapshot might fail verify first if logic isn't careful, but let's see logic
      // Logic: if snapshot is provided, it verifies. If empty string, it might skip or fail?
      // Looking at core.ts: if (snapshot) try verify. So empty string skips verify.
    });
    
    // However, without snapshot, state is empty.
    expect(response.error).toBe("Component not found");
  });
});
