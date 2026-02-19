import { Component } from "@kirejs/wire";

/**
 * Example Counter Component.
 * The class name 'Counter' will be registered as 'counter' (lowercase).
 */
export class Counter extends Component {
    /** Reactive property synchronized with the client */
    public counter = 0;

    /**
     * Action: Increment the counter.
     * Called via wire:click="increment" on the client.
     */
    public increment() {
        this.counter++;
    }

    /**
     * Action: Decrement the counter.
     * Called via wire:click="decrement" on the client.
     */
    public decrement() {
        this.counter--;
    }

    /**
     * Initial and subsequent renders.
     * Uses views/components/counter.kire
     */
    public render() {
        return this.view('components.counter');
    }
}
