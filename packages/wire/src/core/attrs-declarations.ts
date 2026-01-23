interface WireAttribute {
  type: string;
  comment: string;
  example: string;
}

interface WireAttributes {
  [key: string]: WireAttribute;
}

export const WireAttributes: WireAttributes = {
  "wire:click": {
    type: "string",
    comment: `
Handles click events and calls a component method.

### Modifiers
- \`.prevent\`: Calls \`event.preventDefault()\`
- \`.stop\`: Calls \`event.stopPropagation()\`
- \`.self\`: Only triggers if the event was dispatched from this element specifically
- \`.outside\`: Triggers when clicking outside the element
- \`.once\`: Only triggers the event once
- \`.debounce.Xms\`: Debounces the handler (default 150ms)
- \`.throttle.Xms\`: Throttles the handler

### Example
\`\`\`html
<button wire:click="increment">Increment</button>
<button wire:click.prevent="save">Save</button>
\`\`\`
`,
    example: 'wire:click="increment"',
  },
  "wire:model": {
    type: "string",
    comment: `
Two-way data binding for component properties. Syncs the input value with the component state.

### Modifiers
- \`.live\`: Syncs the value in real-time as the user types (default behavior is usually on 'change' for text inputs)
- \`.blur\`: Syncs the value when the input loses focus
- \`.debounce.Xms\`: Delays the sync request by X milliseconds (default 150ms)
- \`.throttle.Xms\`: Limits the sync request frequency

### Example
\`\`\`html
<input wire:model="search" type="text" />
<input wire:model.live.debounce.300ms="search" type="text" />
\`\`\`
`,
    example: 'wire:model="search"',
  },
  "wire:submit": {
    type: "string",
    comment: `
Handles form submission events. Automatically prevents default submission if \`.prevent\` is used.

### Modifiers
- \`.prevent\`: Calls \`event.preventDefault()\` (Recommended)

### Example
\`\`\`html
<form wire:submit.prevent="save">
    ...
</form>
\`\`\`
`,
    example: 'wire:submit.prevent="save"',
  },
  "wire:keydown": {
    type: "string",
    comment: `
Listens for keydown events on the element. Can be scoped to specific keys.

### Modifiers
- \`.enter\`, \`.escape\`, \`.tab\`, \`.space\`, \`.arrow-right\`, etc.: Listen for specific keys
- \`.prevent\`: Prevent default action
- \`.stop\`: Stop propagation

### Example
\`\`\`html
<input wire:keydown.enter="search" />
\`\`\`
`,
    example: 'wire:keydown.enter="search"',
  },
  "wire:keyup": {
    type: "string",
    comment: `
Listens for keyup events.

### Example
\`\`\`html
<input wire:keyup.escape="cancel" />
\`\`\`
`,
    example: 'wire:keyup.escape="cancel"',
  },
  "wire:mouseenter": {
    type: "string",
    comment: "Triggers action when mouse enters the element.",
    example: 'wire:mouseenter="showTooltip"',
  },
  "wire:mouseleave": {
    type: "string",
    comment: "Triggers action when mouse leaves the element.",
    example: 'wire:mouseleave="hideTooltip"',
  },
  "wire:init": {
    type: "string",
    comment: `
Runs an action immediately after the component initializes and renders in the DOM.
Useful for lazy loading data or triggering client-side setup.

### Example
\`\`\`html
<div wire:init="loadLazyData">
    Loading...
</div>
\`\`\`
`,
    example: 'wire:init="loadData"',
  },
  "wire:loading": {
    type: "string",
    comment: `
Toggles visibility or classes while a network request is pending.
By default, it hides the element until a request starts, then shows it.

### Modifiers
- \`.class\`: Adds a class instead of toggling visibility
- \`.attr\`: Adds an attribute (e.g. \`disabled\`) instead of toggling visibility
- \`.remove\`: Opposite behavior: Shows by default, hides during loading
- \`.flex\`, \`.grid\`, \`.block\`, \`.inline\`: Sets the display type when showing
- \`.delay\`: Delays showing the loading state (default 200ms) to avoid flickering
- \`.delay.shortest\`, \`.delay.shorter\`, \`.delay.short\`, \`.delay.long\`, \`.delay.longer\`, \`.delay.longest\`: Predefined delay durations

### Example
\`\`\`html
<span wire:loading>Loading...</span>
<button wire:loading.attr="disabled">Submit</button>
<div wire:loading.class="opacity-50">Content</div>
\`\`\`
`,
    example: "wire:loading",
  },
  "wire:target": {
    type: "string",
    comment: `
Scopes \`wire:loading\` indicators to a specific method or model update.
The loading state will only trigger when the specified action is being performed.

### Example
\`\`\`html
<button wire:click="save">Save</button>
<span wire:loading wire:target="save">Saving...</span>
\`\`\`
`,
    example: 'wire:target="save"',
  },
  "wire:poll": {
    type: "string",
    comment: `
Polls the server at a specified interval to refresh the component.

### Modifiers
- \`.Xms\`: Poll every X milliseconds (e.g. \`.2000ms\`)
- \`.Xs\`: Poll every X seconds
- \`.keep-alive\`: Keep polling even if the tab is in the background
- \`.visible\`: Only poll when the element is visible in the viewport

### Example
\`\`\`html
<div wire:poll.5s>
    Current Time: {{ now }}
</div>
\`\`\`
`,
    example: 'wire:poll.2s="refresh"',
  },
  "wire:ignore": {
    type: "boolean",
    comment: `
Tells Kirewire to ignore this element and its children during DOM updates.
Useful for integrating third-party libraries (like Charts, Maps, Datepickers) that modify the DOM.

### Modifiers
- \`.self\`: Only ignore the element itself, not its children (rarely used)

### Example
\`\`\`html
<div wire:ignore>
    <div id="calendar"></div>
</div>
\`\`\`
`,
    example: "wire:ignore",
  },
  "wire:key": {
    type: "string",
    comment: `
Assigns a unique key to an element for DOM diffing.
Crucial inside loops to ensure elements are updated correctly and state is preserved.

### Example
\`\`\`html
@foreach(items as item)
    <div wire:key="item-{{ item.id }}">
        {{ item.name }}
    </div>
@endforeach
\`\`\`
`,
    example: 'wire:key="item-{{ id }}"',
  },
  "wire:id": {
    type: "string",
    comment:
      "Internal ID of the component instance (auto-generated). Usually you do not need to touch this.",
    example: 'wire:id="..."',
  },
  "wire:navigate": {
    type: "boolean",
    comment: `
Enables SPA-like navigation for links.
When clicked, Kirewire fetches the page in the background and swaps the body content without a full page reload.

### Modifiers
- \`.hover\`: Prefetch the page when hovering over the link

### Example
\`\`\`html
<a href="/profile" wire:navigate>Profile</a>
\`\`\`
`,
    example: "wire:navigate",
  },
  "wire:confirm": {
    type: "string",
    comment: `
Prompts the user for confirmation before performing an action.
Uses the native browser \`confirm()\` dialog.

### Example
\`\`\`html
<button wire:click="delete" wire:confirm="Are you sure you want to delete this?">
    Delete
</button>
\`\`\`
`,
    example: 'wire:confirm="Are you sure?"',
  },
  "wire:stream": {
    type: "boolean",
    comment:
      "Enables streaming updates for this element (if supported by the backend response).",
    example: "wire:stream",
  },
  "wire:offline": {
    type: "boolean",
    comment: `
Toggles visibility or classes when the browser goes offline.

### Modifiers
- \`.class\`: Adds a class when offline
- \`.attr\`: Adds an attribute when offline
- \`.remove\`: Hides when offline

### Example
\`\`\`html
<div wire:offline>You are currently offline.</div>
\`\`\`
`,
    example: "wire:offline",
  },
  "wire:dirty": {
    type: "boolean",
    comment: `
Toggles visibility or classes when the component state is "dirty" (unsaved changes).
Usually used with \`wire:model\`.

### Modifiers
- \`.class\`: Adds a class when dirty
- \`.attr\`: Adds an attribute when dirty
- \`.remove\`: Hides when dirty

### Example
\`\`\`html
<input wire:model="name">
<span wire:dirty>Unsaved changes...</span>
\`\`\`
`,
    example: "wire:dirty",
  },
  // Alpine.js Attributes
  "x-data": {
    type: "javascript",
    comment: "Declares a new Alpine component scope.",
    example: 'x-data="{ open: false }"',
  },
  "x-init": {
    type: "javascript",
    comment: "Runs code when an element is initialized.",
    example: 'x-init="console.log(\'I am being initialized\')"',
  },
  "x-show": {
    type: "boolean",
    comment: "Toggles the visibility of an element.",
    example: 'x-show="open"',
  },
  "x-bind": {
    type: "javascript",
    comment: "Sets the value of an attribute.",
    example: 'x-bind:class="{ \'hidden\': !open }"',
  },
  "x-on": {
    type: "javascript",
    comment: "Attaches an event listener to the element.",
    example: 'x-on:click="open = !open"',
  },
  "x-text": {
    type: "javascript",
    comment: "Updates the text content of an element.",
    example: 'x-text="username"',
  },
  "x-html": {
    type: "javascript",
    comment: "Updates the inner HTML of an element.",
    example: 'x-html="content"',
  },
  "x-model": {
    type: "javascript",
    comment: "Adds two-way data binding to an element.",
    example: 'x-model="search"',
  },
  "x-for": {
    type: "javascript",
    comment: "Iterates over an array or object. Must be used on a <template> tag.",
    example: 'x-for="item in items"',
  },
  "x-transition": {
    type: "boolean",
    comment: "Applies enter and leave transitions to an element.",
    example: 'x-transition.duration.500ms',
  },
  "x-effect": {
    type: "javascript",
    comment: "Executes a script each time one of its dependencies changes.",
    example: 'x-effect="console.log(open)"',
  },
  "x-ignore": {
    type: "boolean",
    comment: "Prevents Alpine from initializing attributes within the element.",
    example: "x-ignore",
  },
  "x-ref": {
    type: "string",
    comment: "References an element directly by name.",
    example: 'x-ref="myInput"',
  },
  "x-cloak": {
    type: "boolean",
    comment: "Hides the element until Alpine has initialized.",
    example: "x-cloak",
  },
  "x-teleport": {
    type: "string",
    comment: "Teleports the element to another part of the DOM.",
    example: 'x-teleport="body"',
  },
  "x-if": {
    type: "javascript",
    comment: "Conditionally renders an element. Must be used on a <template> tag.",
    example: 'x-if="open"',
  },
  "x-id": {
    type: "string", // Usually a string array literal, but mostly treated as string config
    comment: "Generates a unique ID for accessible elements.",
    example: 'x-id="[\'text-input\']"',
  },
} as const;