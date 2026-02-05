
import { describe, expect, it } from "bun:test";
import { Kire } from "../src/index";

describe("Kire For Empty Loop Collision", () => {
	const kire = new Kire({ silent: true });
	const render = (template: string, locals = {}) => kire.render(template, locals);

	it("should handle multiple for loops with empty blocks without collision", async () => {
		const tpl = `
@for(item of it.list1)
  {{ item }}
@empty
  Empty1
@end

@for(item of it.list2)
  {{ item }}
@empty
  Empty2
@end
`;
		// Both empty
		expect((await render(tpl, { list1: [], list2: [] }) as string).replace(/\s+/g, ' ').trim()).toBe("Empty1 Empty2");
        
        // One empty, one full
        expect((await render(tpl, { list1: [1], list2: [] }) as string).replace(/\s+/g, ' ').trim()).toBe("1 Empty2");

        // Both full
        expect((await render(tpl, { list1: [1], list2: [2] }) as string).replace(/\s+/g, ' ').trim()).toBe("1 2");
	});

    it("should handle nested for loops with empty blocks", async () => {
        const tpl = `
@for(group of it.groups)
  Group:
  @for(item of group.items)
    {{ item }}
  @empty
    NoItems
  @end
@empty
  NoGroups
@end
`;
        // No groups
        expect((await render(tpl, { groups: [] }) as string).replace(/\s+/g, ' ').trim()).toBe("NoGroups");

        // Group with no items
        expect((await render(tpl, { groups: [{items: []}] }) as string).replace(/\s+/g, ' ').trim()).toBe("Group: NoItems");

        // Group with items
        expect((await render(tpl, { groups: [{items: [1]}] }) as string).replace(/\s+/g, ' ').trim()).toBe("Group: 1");
    });
});
