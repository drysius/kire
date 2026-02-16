let $kire_response = "";
const $escape = this.$escape;
const NullProtoObj = (() => { const e = function () { }; return e.prototype = Object.create(null), Object.freeze(e.prototype), e })();
let name = $props['name'] !== undefined ? $props['name'] : $globals['name'];
let show = $props['show'] !== undefined ? $props['show'] : $globals['show'];
let __kire_stack = new NullProtoObj;
// Dependencies
const _dep0 = this.getOrCompile('C:/Users/danie/OneDrive/Documentos/GitHub/kire/base.kire');
$kire_response += '\n';
// kire-line: 2
{
    const $slots = new NullProtoObj();
    const _oldRes_comp1 = $kire_response; $kire_response = "";
    $kire_response += '\n\n';
    // kire-line: 4
    {
        const _oldRes_slot1 = $kire_response; $kire_response = "";
        $kire_response += '\n    <h1>Hello ';
        // kire-line: 5
        $kire_response += $escape(name);
        $kire_response += '!</h1>\n';

        if (typeof $slots !== 'undefined') $slots['header'] = $kire_response;
        $kire_response = _oldRes_slot1;
    }
    $kire_response += '\n\n';
    // kire-line: 8
    {
        if (!__kire_stack['scripts']) __kire_stack['scripts'] = [];
        const __kire__push1 = $kire_response; $kire_response = "";
        $kire_response += '\n    <script>console.log("Push 1");</script>\n';

        __kire_stack['scripts'].push($kire_response);
        $kire_response = __kire__push1;
    }
    $kire_response += '\n\n';
    // kire-line: 12
    if (show) {
        $kire_response += '\n    <p>This is visible</p>\n';
    }
    $kire_response += '\n\n';
    // kire-line: 16
    {
        if (!__kire_stack['scripts']) __kire_stack['scripts'] = [];
        const __kire__push2 = $kire_response; $kire_response = "";
        $kire_response += '\n    <script>console.log("Push 2");</script>\n';

        __kire_stack['scripts'].push($kire_response);
        $kire_response = __kire__push2;
    }
    $kire_response += '\n\n';
    // kire-line: 20
    $kire_response += "<!-- KIRE:stack(scripts) -->";
    $kire_response += '\n';

    if (!$slots.default) $slots.default = $kire_response;
    $kire_response = _oldRes_comp1;
    const _oldProps_comp1 = $props;
    $props = Object.assign(Object.create($globals), _oldProps_comp1, new NullProtoObj(), { slots: $slots });

    const _dep_comp1 = _dep0;
    const res_comp1 = _dep_comp1.call(this, $props, $globals);
    $kire_response += res_comp1;

    $props = _oldProps_comp1;
}

if (typeof __kire_stack !== 'undefined' && __kire_stack['scripts']) {
    const _placeholder_ph1 = "<!-- KIRE:stack(scripts) -->";
    $kire_response = $kire_response.split(_placeholder_ph1).join(__kire_stack['scripts'].join("\n"));
}


$kire_response = $kire_response.replace(/<!-- KIRE:stack\(.*?\) -->/g, "");

return $kire_response;


codigo que eu considero melhor

let $kire_response = "";
const $escape = this.$escape;
const NullProtoObj = (() => { const e = function () { }; return e.prototype = Object.create(null), Object.freeze(e.prototype), e })();
let name = $props['name'] !== undefined ? $props['name'] : $globals['name'];
let show = $props['show'] !== undefined ? $props['show'] : $globals['show'];
let __kire_stack = new NullProtoObj;
// Dependencies
// base.kire
function _dep0 ($props) {

}

$kire_response += '\n';
// kire-line: 2
{
    const $slots = new NullProtoObj();
    const _oldRes_comp1 = $kire_response; $kire_response = "";
    $kire_response += '\n\n';
    // kire-line: 4
    {
        const _oldRes_slot1 = $kire_response; $kire_response = "";
        $kire_response += '\n    <h1>Hello ';
        // kire-line: 5
        $kire_response += $escape(name);
        $kire_response += '!</h1>\n';

        if (typeof $slots !== 'undefined') $slots['header'] = $kire_response;
        $kire_response = _oldRes_slot1;
    }
    $kire_response += '\n\n';
    // kire-line: 8
    {
        if (!__kire_stack['scripts']) __kire_stack['scripts'] = [];
        const __kire__push1 = $kire_response; $kire_response = "";
        $kire_response += '\n    <script>console.log("Push 1");</script>\n';

        __kire_stack['scripts'].push($kire_response);
        $kire_response = __kire__push1;
    }
    $kire_response += '\n\n';
    // kire-line: 12
    if (show) {
        $kire_response += '\n    <p>This is visible</p>\n';
    }
    $kire_response += '\n\n';
    // kire-line: 16
    {
        if (!__kire_stack['scripts']) __kire_stack['scripts'] = [];
        const __kire__push2 = $kire_response; $kire_response = "";
        $kire_response += '\n    <script>console.log("Push 2");</script>\n';

        __kire_stack['scripts'].push($kire_response);
        $kire_response = __kire__push2;
    }
    $kire_response += '\n\n';
    // kire-line: 20
    $kire_response += "<!-- KIRE:stack(scripts) -->";
    $kire_response += '\n';

    if (!$slots.default) $slots.default = $kire_response;
    $kire_response = _oldRes_comp1;
    const _oldProps_comp1 = $props;
    $props = Object.assign(Object.create($globals), _oldProps_comp1, new NullProtoObj(), { slots: $slots });

    const _dep_comp1 = _dep0;
    const res_comp1 = _dep_comp1.call(this, $props, $globals);
    $kire_response += res_comp1;

    $props = _oldProps_comp1;
}

if (typeof __kire_stack !== 'undefined' && __kire_stack['scripts']) {
    const _placeholder_ph1 = "<!-- KIRE:stack(scripts) -->";
    $kire_response = $kire_response.split(_placeholder_ph1).join(__kire_stack['scripts'].join("\n"));
}


$kire_response = $kire_response.replace(/<!-- KIRE:stack\(.*?\) -->/g, "");

return $kire_response;