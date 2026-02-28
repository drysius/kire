import type { Kire } from "kire";
import type { Kirewire } from "./index";

export abstract class Adapter {
    protected wire!: Kirewire;
    protected kire!: Kire;

    public install(wire: Kirewire, kire: Kire) {
        this.wire = wire;
        this.kire = kire;
        this.setup();
    }

    /**
     * Setup transport-specific logic (routes, sockets, etc.)
     */
    abstract setup(): void;
}
