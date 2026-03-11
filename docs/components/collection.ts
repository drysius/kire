import { Component } from "@kirejs/wire";

type FeedEntry = {
    id: number;
    text: string;
    tone: "info" | "success" | "warning";
    createdAt: number;
};

const store = {
    nextId: 4,
    entries: [
        { id: 1, text: "Collection store initialized", tone: "info", createdAt: Date.now() - 45_000 },
        { id: 2, text: "State patches now support x-for targets", tone: "success", createdAt: Date.now() - 28_000 },
        { id: 3, text: "Skip render keeps the component DOM stable", tone: "warning", createdAt: Date.now() - 12_000 },
    ] as FeedEntry[],
};

export default class CollectionDemo extends Component {
    public draft = "";
    public entries: FeedEntry[] = [];

    async mount() {
        this.entries = [...store.entries];
    }

    addEntry() {
        const text = this.draft.trim() || `Collection event #${store.nextId}`;
        const entry: FeedEntry = {
            id: store.nextId++,
            text,
            tone: ["info", "success", "warning"][Math.floor(Math.random() * 3)] as FeedEntry["tone"],
            createdAt: Date.now(),
        };

        store.entries = [entry, ...store.entries].slice(0, 12);
        this.entries = [...store.entries];
        this.draft = "";

        this.prependToCollection("entries", entry, { key: "id", limit: 12 });
        this.$skipRender();
    }

    seedBatch() {
        const created: FeedEntry[] = [];
        for (let i = 0; i < 2; i++) {
            const entry: FeedEntry = {
                id: store.nextId++,
                text: `Batch entry ${store.nextId - 1}`,
                tone: i === 0 ? "info" : "success",
                createdAt: Date.now() + i,
            };
            created.push(entry);
        }

        const ordered = [...created].reverse();
        store.entries = [...ordered, ...store.entries].slice(0, 12);
        this.entries = [...store.entries];

        this.prependToCollection("entries", ordered, { key: "id", limit: 12 });
        this.$skipRender();
    }

    removeLast() {
        const removed = this.entries[this.entries.length - 1];
        if (!removed) return;

        store.entries = store.entries.filter((entry) => entry.id !== removed.id);
        this.entries = this.entries.filter((entry) => entry.id !== removed.id);

        this.removeFromCollection("entries", removed.id, { key: "id" });
        this.$skipRender();
    }

    render() {
        return this.view("components.collection");
    }
}
