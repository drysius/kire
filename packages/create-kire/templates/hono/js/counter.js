import { LiveComponent, ownMeta } from "@kirejs/wire";

export class Counter extends LiveComponent {
	count = 0;

	increment() {
		this.count++;
	}
	decrement() {
		this.count--;
	}

	render() {
		return `
			<div class="flex items-center gap-4">
				<button wire:click="decrement"
					class="h-11 w-11 rounded-lg bg-slate-200 text-xl font-bold text-slate-700 hover:bg-slate-300">−</button>
				<span class="min-w-[3ch] text-center text-4xl font-bold tabular-nums">${this.count}</span>
				<button wire:click="increment"
					class="h-11 w-11 rounded-lg bg-indigo-600 text-xl font-bold text-white hover:bg-indigo-500">+</button>
			</div>`;
	}
}

// Register the component name without decorators (plain JavaScript).
ownMeta(Counter).name = "counter";
