import { WireComponent } from "@kirejs/wire";

export default class Counter extends WireComponent {
    public count = 0;

    async increment() {
        this.count++;
    }

    async hydrated(): Promise<void> {
        console.log(this.count)
    }

    async decrement() {
        this.count--;
    }

    async reset() {
        this.count = 0;
    }

    async render() {
        return this.view('views.counter', {
            users:[
                "a",
                'b',
                'c'
            ]
        });
    }
}
