import { Kire } from "./core/src/kire";

async function debug() {
    const kire = new Kire({ production: false });
    const template = `
<div class="container">
    <h1>Users List</h1>
    <ul>
        @for(user of users)
            <li class="{{ user.active ? 'active' : '' }}">
                {{ user.name }} ({{ user.email }})
                @if(user.isAdmin)
                    <span class="badge">Admin</span>
                @endif
            </li>
        @endfor
    </ul>
</div>`;

    const users = [
        { name: "User 0", email: "user0@example.com", active: true, isAdmin: true },
        { name: "User 1", email: "user1@example.com", active: false, isAdmin: false }
    ];

    try {
        console.log("--- COMPILING ---");
        const compiled = await kire.compile(template, "debug.kire");
        console.log("--- COMPILED CODE ---");
        console.log(compiled.code);
        
        console.log("--- RENDERING ---");
        const result = await kire.run(compiled, { users });
        console.log("--- RESULT ---");
        console.log(result);
    } catch (e) {
        console.error(e);
    }
}

debug();
