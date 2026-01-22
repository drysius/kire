# KIRE IntelliSense

**The official language support extension for the Kire templating engine.**

KIRE IntelliSense provides a rich development experience for [Kire](https://github.com/drysius/kire), a powerful and expressive templating engine inspired by Blade, designed for Node.js, Bun, and Deno.

![Extension Preview](images/hero.png)
*> Tip: Place a screenshot of the syntax highlighting here named `images/hero.png`*

## ✨ Features

### 🎨 Syntax Highlighting
Full colorization for Kire's expressive syntax, distinguishing between directives, control structures, and raw HTML.

- **Directives:** `@if`, `@else`, `@foreach`, `@wire`, etc.
- **Interpolations:** `{{ variable }}` and `{{{ raw_html }}}`.
- **Comments:** `{{-- Kire Comments --}}`.

### 🧠 Smart Autocomplete
Get intelligent suggestions for directives and built-in variables as you type.

![Autocomplete Example](images/autocomplete.gif)
*> Tip: Place a gif of the autocomplete in action here named `images/autocomplete.gif`*

### ⚡ Productivity Snippets
Type less and do more with built-in snippets for common structures like layouts, loops, and conditional blocks.

### 🛠️ Embedded Language Support
Seamlessly write HTML, CSS, and JavaScript within your `.kire` files with full language feature support.

## 🚀 Installation

1. Open **VS Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for **"KIRE IntelliSense"**.
4. Click **Install**.

## 🔧 Usage

Simply open any file ending in `.kire`. The extension will activate automatically.

**Example Code:**

```kire
@layout('layouts.app')

@section('content')
    <div class="container">
        <h1>Hello, {{ user.name }}!</h1>

        @if(user.isAdmin)
            <button wire:click="openAdminPanel">Admin Panel</button>
        @else
            <p>Welcome back to the dashboard.</p>
        @endif

        <ul>
        @foreach(items as item)
            <li>{{ item.name }}</li>
        @endforeach
        </ul>
    </div>
@endsection
```

## 🤝 Contributing

Found a bug? Want to suggest a feature? Contributions are welcome!
Please open an issue on the [GitHub Repository](https://github.com/drysius/kire).

## 📄 License

MIT