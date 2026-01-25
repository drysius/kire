import { WireComponent } from "@kirejs/wire";

export default class InfinityScroll extends WireComponent {
	public items: string[] = [];
	public page = 1;
	public hasMore = true;

	async mount() {
		this.loadMore();
	}

	async loadMore() {
		if (!this.hasMore) return;

		// Simulate network delay
		await new Promise((r) => setTimeout(r, 500));

		const newItems = Array.from(
			{ length: 10 },
			(_, i) => `Item ${((this.page - 1) * 10) + i + 1}`,
		);
		this.items.push(...newItems);
		this.page++;

		if (this.page > 5) {
			this.hasMore = false;
		}
	}

	async render() {
		return this.view("components.infinity-scroll");
	}
}
