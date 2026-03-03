import { describe, expect, test } from "bun:test";
import { WireFile } from "@kirejs/wire";

import Chat from "../components/chat";
import Counter from "../components/counter";
import RegisterForm from "../components/form";
import Heavy from "../components/heavy";
import Http from "../components/http";
import InfinityScroll from "../components/infinity-scroll";
import PollStress from "../components/poll-stress";
import Receiver from "../components/receiver";
import Searchable from "../components/searchable";
import Sender from "../components/sender";
import Streamer from "../components/streamer";
import TextareaTest from "../components/textarea-test";
import Toast from "../components/toast";
import Todo from "../components/todo";
import Upload from "../components/upload";
import Users from "../components/users";

async function withImmediateTimers<T>(fn: () => Promise<T> | T): Promise<T> {
    const originalSetTimeout = globalThis.setTimeout;
    (globalThis as any).setTimeout = ((cb: any) => {
        if (typeof cb === "function") cb();
        return 0 as any;
    }) as any;

    try {
        return await fn();
    } finally {
        globalThis.setTimeout = originalSetTimeout;
    }
}

function withViewStub<T extends { view: (view: string, data?: Record<string, any>) => any }>(instance: T) {
    (instance as any).view = (name: string) => name;
    return instance;
}

describe("wire-example component renders", () => {
    const cases = [
        { name: "chat", ctor: Chat, view: "components.chat" },
        { name: "counter", ctor: Counter, view: "components.counter" },
        { name: "form", ctor: RegisterForm, view: "components.form" },
        { name: "heavy", ctor: Heavy, view: "components.heavy" },
        {
            name: "http",
            ctor: Http,
            view: "components.http",
            setup: (instance: any) => {
                instance.shared = {
                    ...(instance.shared || {}),
                    update: () => {},
                };
            },
        },
        { name: "infinity-scroll", ctor: InfinityScroll, view: "components.infinity-scroll" },
        { name: "poll-stress", ctor: PollStress, view: "components.poll-stress" },
        { name: "receiver", ctor: Receiver, view: "components.receiver" },
        { name: "searchable", ctor: Searchable, view: "components.searchable" },
        { name: "sender", ctor: Sender, view: "components.sender" },
        { name: "streamer", ctor: Streamer, view: "components.streamer" },
        { name: "textarea-test", ctor: TextareaTest, view: "components.textarea-test" },
        { name: "toast", ctor: Toast, view: "components.toast" },
        { name: "todo", ctor: Todo, view: "components.todo" },
        { name: "upload", ctor: Upload, view: "components.upload" },
        { name: "users", ctor: Users, view: "components.users" },
    ];

    for (const item of cases) {
        test(`${item.name} render() points to expected view`, async () => {
            const instance = withViewStub(new item.ctor() as any);
            item.setup?.(instance);
            expect(await instance.render()).toBe(item.view);
        });
    }
});

describe("wire-example component behaviors", () => {
    test("Counter increments, decrements and resets", async () => {
        const counter = new Counter();
        await counter.increment();
        await counter.increment();
        await counter.decrement();
        expect(counter.count).toBe(1);
        await counter.reset();
        expect(counter.count).toBe(0);
    });

    test("Sender emits hello and clears text", async () => {
        const sender = new Sender() as any;
        const events: any[] = [];
        sender.emit = (...args: any[]) => events.push(args);

        sender.text = "Oi";
        await sender.send();

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual(["hello", "Oi"]);
        expect(sender.text).toBe("");
    });

    test("Receiver updates message from event payload", () => {
        const receiver = new Receiver();
        receiver.updateMessage("Mensagem");
        expect(receiver.message.startsWith("Received: Mensagem at ")).toBe(true);
    });

    test("Chat sends message and clears input", () => {
        const chat = new Chat();
        chat.username = "Alice";
        chat.input = "Hello everyone";
        const before = chat.messages.length;

        chat.sendMessage();

        expect(chat.messages.length).toBe(before + 1);
        expect(chat.messages[chat.messages.length - 1]!.text).toBe("Hello everyone");
        expect(chat.input).toBe("");
    });

    test("RegisterForm validates required fields and clears on success", async () => {
        const form = new RegisterForm() as any;
        form.__errors = {};
        form.clearErrors = () => {
            form.__errors = {};
        };
        form.addError = (field: string, msg: string) => {
            form.__errors[field] = msg;
        };

        await withImmediateTimers(async () => {
            await form.register();
        });

        expect(form.__errors.name).toBe("Name is required");
        expect(form.__errors.email).toBe("Email is required");
        expect(form.__errors.password).toBe("Password is required");

        form.name = "Daniel";
        form.email = "daniel@example.com";
        form.password = "123456";

        await withImmediateTimers(async () => {
            await form.register();
        });

        expect(form.successMessage).toContain("Daniel");
        expect(form.name).toBe("");
        expect(form.email).toBe("");
        expect(form.password).toBe("");
    });

    test("Heavy loads data only once", async () => {
        const heavy = new Heavy();

        await withImmediateTimers(async () => {
            await heavy.load();
        });

        const firstSnapshot = [...heavy.data];

        await withImmediateTimers(async () => {
            await heavy.load();
        });

        expect(heavy.loaded).toBe(true);
        expect(heavy.data.length).toBeGreaterThan(0);
        expect(heavy.data).toEqual(firstSnapshot);
    });

    test("Http increments shared counter local state", () => {
        const http = new Http();
        http.increment();
        http.increment();
        expect(http.counter).toBe(2);
    });

    test("InfinityScroll appends pages and stops after page 5", async () => {
        const list = new InfinityScroll();

        await withImmediateTimers(async () => {
            for (let i = 0; i < 5; i++) {
                await list.loadMore();
            }
        });

        expect(list.items.length).toBe(50);
        expect(list.page).toBe(6);
        expect(list.hasMore).toBe(false);
    });

    test("PollStress tracks count and last poller", () => {
        const poll = new PollStress();
        poll.increment("fast1");
        poll.increment("slow2");
        expect(poll.count).toBe(2);
        expect(poll.lastPoller).toBe("slow2");
    });

    test("Searchable filters by text and role", () => {
        const searchable = new Searchable();
        searchable.search = "user 1";
        searchable.roleFilter = "Admin";

        const filtered = searchable.filteredUsers;
        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.every((u) => u.role === "Admin")).toBe(true);
    });

    test("Streamer emits stream update in prepend mode", async () => {
        const streamer = new Streamer() as any;
        let called: any[] = [];
        streamer.stream = (...args: any[]) => {
            called = args;
        };

        await streamer.addLog();

        expect(called[0]).toBe("logs");
        expect(typeof called[1]).toBe("string");
        expect(called[2]).toBe(false);
        expect(called[3]).toBe("prepend");
    });

    test("TextareaTest submit stores and clears message", async () => {
        const textarea = new TextareaTest();
        textarea.message = "Texto de teste";
        await textarea.submit();
        expect(textarea.lastSent).toBe("Texto de teste");
        expect(textarea.message).toBe("");
    });

    test("Toast emits success, error and info notifications", async () => {
        const toast = new Toast() as any;
        const events: any[] = [];
        toast.emit = (...args: any[]) => events.push(args);

        await toast.showSuccess();
        await toast.showError();
        await toast.showInfo();

        expect(events).toHaveLength(3);
        expect(events[0]![0]).toBe("notify");
        expect(events[1]![0]).toBe("notify");
        expect(events[2]![0]).toBe("notify");
    });

    test("Todo adds and removes tasks", async () => {
        const todo = new Todo();
        todo.task = "Write tests";
        const before = todo.todos.length;

        await todo.add();
        expect(todo.todos.length).toBe(before + 1);
        expect(todo.task).toBe("");

        const removeIndex = todo.todos.length - 1;
        await todo.remove(removeIndex);
        expect(todo.todos.length).toBe(before);
    });

    test("Upload handles no-file and file success paths", async () => {
        const upload = new Upload();
        upload.description = "Arquivo de teste";
        await upload.save();
        expect(upload.message).toBe("No file selected.");

        upload.description = "Novo arquivo";
        upload.file = new WireFile({
            id: "file-1",
            name: "demo.txt",
            size: 1024,
            mime: "text/plain",
        });

        await withImmediateTimers(async () => {
            await upload.save();
        });

        expect(upload.message).toContain("Saved demo.txt");
        expect(upload.description).toBe("");
        expect(upload.file.file).toBeNull();
    });

    test("Users supports delete and search update lifecycle", async () => {
        const users = new Users() as any;
        users.paginate = (items: any[]) => ({
            data: items,
            total: items.length,
            currentPage: 1,
            lastPage: 1,
            hasMore: false,
        });

        const before = users.users.total;
        const targetId = users.users.data[0]?.id;
        expect(targetId).toBeDefined();

        users.delete(targetId);
        expect(users.users.total).toBe(before - 1);

        let resetCalled = false;
        users.resetPage = () => {
            resetCalled = true;
        };

        await users.updating("search", "john");
        expect(resetCalled).toBe(true);
    });
});
