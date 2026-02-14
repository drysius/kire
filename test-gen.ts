import { Kire } from "./core/src/kire";

const kire = new Kire({ production: true });

async function test() {
    const template = `
        <h1>Hello {{ name }}</h1>
        @if(true)
            <p>This is a test</p>
        @endif
        @include('some-view')
        @component('card', { title: 'My Card' })
            @slot('body')
                <p>Card content</p>
            @endslot
        @endcomponent
    `;

    console.log("--- TEMPLATE ---");
    console.log(template);

    const code = await kire.compile(template, "test.kire");

    console.log("\n--- GENERATED CODE ---");
    console.log(code);
}

test().catch(console.error);
