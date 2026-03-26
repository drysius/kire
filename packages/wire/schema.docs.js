export const wireEventModifierDocs = [
	{
		name: "prevent",
		description:
			"Prevent the browser default action before dispatching the wire event.",
	},
	{
		name: "stop",
		description: "Stop DOM event propagation after the wire handler runs.",
	},
	{
		name: "self",
		description:
			"Only react when the event originates from the element itself.",
	},
	{
		name: "once",
		description: "Run the listener only once for the current element.",
	},
];

export const wireAttributeDocs = [
	{
		name: "wire:*",
		type: "javascript",
		description:
			"Generic Kirewire action/event binding. Replace `*` with a DOM event or channel name, for example `wire:submit.prevent`, `wire:keydown.enter` or `wire:click.once`.",
		example: '<form wire:submit.prevent="save"></form>',
		extends: [
			...wireEventModifierDocs,
			{
				name: "window",
				description:
					"Listen on the window object instead of the current element.",
			},
			{
				name: "document",
				description:
					"Listen on the document object instead of the current element.",
			},
			{
				name: "debounce",
				description:
					"Debounce the outgoing event/action. You can append a duration like .debounce.300ms.",
				signature: ["duration:string"],
			},
			{
				name: "throttle",
				description:
					"Throttle repeated event/action dispatches. You can append a duration like .throttle.300ms.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:model",
		type: "javascript",
		description:
			"Synchronizes an input, textarea or select value with component state.",
		example: '<input wire:model="title" />',
		extends: [
			{
				name: "live",
				description:
					"Send updates immediately instead of waiting for an action.",
			},
			{
				name: "defer",
				description:
					"Queue updates locally and flush them on the next component call.",
			},
			{
				name: "debounce",
				description:
					"Debounce outgoing updates. You can append a duration like .debounce.300ms.",
				signature: ["duration:string"],
			},
			{
				name: "lazy",
				description: "Update on blur for text-like inputs.",
			},
			{
				name: "blur",
				description: "Update when the field loses focus.",
			},
		],
	},
	{
		name: "wire:click",
		type: "javascript",
		description: "Calls a component method when the element is clicked.",
		example: '<button wire:click="save">Save</button>',
		extends: wireEventModifierDocs,
	},
	{
		name: "wire:init",
		type: "javascript",
		description: "Runs a component action once the element is initialized.",
		example: '<div wire:init="loadStats"></div>',
	},
	{
		name: "wire:loading",
		type: "string",
		description:
			"Shows, hides or decorates an element while one or more component actions are running.",
		example: "<div wire:loading>Saving...</div>",
		extends: [
			{
				name: "remove",
				description: "Invert the default visibility behaviour.",
			},
			{
				name: "class",
				description: "Toggle a CSS class instead of toggling visibility.",
			},
			{
				name: "attr",
				description: "Toggle an attribute instead of toggling visibility.",
			},
			{
				name: "failsafe",
				description:
					"Force cleanup after a timeout. You can append a duration like .failsafe.30s.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:target",
		type: "string",
		description:
			"Limits another wire directive, such as wire:loading, to one or more specific actions or state paths.",
		example: '<div wire:loading wire:target="save,remove">Working...</div>',
	},
	{
		name: "wire:poll",
		type: "javascript",
		description:
			"Periodically triggers a component action or refresh while the page is active.",
		example: '<div wire:poll.5s="$refresh"></div>',
		extends: [
			{
				name: "visible",
				description: "Only poll while the element is visible in the viewport.",
			},
			{
				name: "once",
				description: "Stop polling after the first successful run.",
			},
			{
				name: "throttle",
				description:
					"Throttle polling triggers. You can append a duration like .throttle.500ms.",
				signature: ["duration:string"],
			},
			{
				name: "debounce",
				description:
					"Debounce polling triggers. You can append a duration like .debounce.500ms.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:intersect",
		type: "javascript",
		description:
			"Calls a component action when the element intersects the viewport or a specific edge.",
		example: '<div wire:intersect.once="loadMore"></div>',
		extends: [
			{
				name: "once",
				description: "Disconnect the observer after the first match.",
			},
			{
				name: "top",
				description: "Only trigger when the intersection touches the top edge.",
			},
			{
				name: "bottom",
				description:
					"Only trigger when the intersection touches the bottom edge.",
			},
			{
				name: "left",
				description:
					"Only trigger when the intersection touches the left edge.",
			},
			{
				name: "right",
				description:
					"Only trigger when the intersection touches the right edge.",
			},
			{
				name: "throttle",
				description:
					"Throttle observer callbacks. You can append a duration like .throttle.250ms.",
				signature: ["duration:string"],
			},
			{
				name: "debounce",
				description:
					"Debounce observer callbacks. You can append a duration like .debounce.250ms.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:show",
		type: "javascript",
		description:
			"Shows or hides an element based on a component state expression.",
		example: '<div wire:show="open">Panel</div>',
	},
	{
		name: "wire:dirty",
		type: "string",
		description:
			"Marks an element when a bound model value has diverged from the last server snapshot.",
		example: '<div wire:dirty.class="ring-amber-400"></div>',
		extends: [
			{
				name: "class",
				description: "Toggle a CSS class while the element is dirty.",
			},
			{
				name: "attr",
				description: "Toggle an attribute while the element is dirty.",
			},
		],
	},
	{
		name: "wire:ignore",
		type: "boolean",
		description:
			"Exclude the element from DOM morphing performed by Kirewire updates.",
		example: "<div wire:ignore></div>",
		extends: [
			{
				name: "self",
				description:
					"Ignore updates only for the current element, not its children.",
			},
		],
	},
	{
		name: "wire:offline",
		type: "string",
		description:
			"React to offline state changes by toggling visibility, classes or attributes.",
		example: '<div wire:offline.class="opacity-50">Offline</div>',
		extends: [
			{
				name: "class",
				description: "Toggle a CSS class while offline.",
			},
			{
				name: "attr",
				description: "Toggle an attribute while offline.",
			},
		],
	},
	{
		name: "wire:collection",
		type: "string",
		description:
			"Targets an element as a DOM collection sink for streamed collection updates.",
		example: '<ul wire:collection="todos"></ul>',
		extends: [
			{
				name: "empty",
				description:
					"Treat the element as the empty-state placeholder for the collection.",
			},
		],
	},
	{
		name: "wire:broadcast",
		type: "string",
		description:
			"Subscribes the current component tree to a named broadcast channel.",
		example: '<section wire:broadcast="chat.room.1"></section>',
	},
	{
		name: "wire:canvas",
		type: "javascript",
		description:
			"Bootstraps the game-canvas integration for a canvas element and action channel.",
		example: '<canvas wire:canvas="tank.game"></canvas>',
	},
	{
		name: "wire:canvas-channel",
		type: "string",
		description:
			"Stores the resolved canvas channel used by the game-canvas integration.",
	},
	{
		name: "wire:canvas-method",
		type: "string",
		description:
			"Stores the action method associated with a canvas control binding.",
	},
	{
		name: "wire:file",
		type: "javascript",
		description:
			"Enables enhanced upload behaviour and optional preview handling on file inputs.",
		example: '<input type="file" wire:file.preview wire:model="avatar" />',
		extends: [
			{
				name: "preview",
				description:
					"Generate client-side previews for selected files when possible.",
			},
		],
	},
	{
		name: "wire:navigate",
		type: "boolean",
		description:
			"Intercepts same-origin anchor navigation and swaps the document through Kirewire.",
		example: '<a href="/dashboard" wire:navigate>Dashboard</a>',
		extends: [
			{
				name: "replace",
				description:
					"Replace the current history entry instead of pushing a new one.",
			},
		],
	},
	{
		name: "wire:key",
		type: "string",
		description:
			"Provides a stable morph key so DOM diffing can preserve the right element instance.",
		example: '<li wire:key="todo-{{ todo.id }}"></li>',
	},
	{
		name: "wire:id",
		type: "string",
		description:
			"Internal hydration identifier assigned to a server-rendered Kirewire component root.",
	},
	{
		name: "wire:state",
		type: "string",
		description:
			"Serialized component state snapshot used to hydrate and resume the client runtime.",
	},
];

export const wireElementDocs = [
	{
		name: "wire:*",
		description:
			"Mount a registered Kirewire component by tag name. Tag attributes are converted into component locals before mount.",
		example: '<wire:chat room-id="{{ room.id }}" />',
	},
	{
		name: "kirewire:*",
		description:
			"Alias of wire:* with the Kirewire namespace prefix. Useful when you want tags that read closer to the package name.",
		example: '<kirewire:chat room-id="{{ room.id }}" />',
	},
	{
		name: "livewire:*",
		description:
			"Livewire-style alias for mounting a registered Kirewire component from a custom element tag.",
		example: '<livewire:chat room-id="{{ room.id }}" />',
	},
];
