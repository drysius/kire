import { Kire } from "./core/src/index";

const kire = new Kire({
    root: __dirname,
    production: false,
    silent: false
});

// Template to test various features: interpolation, directives, x-elements, and stacks
const template = `
@layout('base')

@section('header')
    <h1>Hello {{ name }}!</h1>
@endsection

@push('scripts')
    <script>console.log("Push 1");</script>
@endpush

<kire:if cond="show">
    <p>This is visible</p>
</kire:if>

@push('scripts')
    <script>console.log("Push 2");</script>
@endpush

@stack('scripts')
`;

const baseTemplate = `
<div class="layout">
    @yield('header')
    <div class="content">
        @yield('default')
    </div>
</div>
`;

// Register virtual file for layout
kire.$vfiles[kire.resolvePath('base')] = baseTemplate;

try {
    console.log("--- COMPILING TEMPLATE ---");
    const compiled = kire.compile(template, "debug.kire");

    console.log("\n--- COMPILED CODE (meta.code) ---");
    console.log(compiled.meta.code);

    console.log("\n--- RENDERING ---");
    const result = compiled.call(kire, { name: "World", show: true }, kire.$globals);
    console.log(result);

} catch (e) {
    console.error("--- ERROR ---");
    if (e instanceof Error) {
        console.error(e.message);
        console.error(e.stack);
    } else {
        console.error(e);
    }
}
