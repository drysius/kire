const NullProtoObj = this.NullProtoObj;
$globals = Object.assign(Object.create(this.$globals), $globals);
let $kire_response = "";
const $escape = this.$escape;
// Dependencies
// C:/Users/danie/OneDrive/Documentos/GitHub/kire/card.kire
const _dep0 = function ($props = {}, $globals = {}) {

    $globals = Object.assign(Object.create(this.$globals), $globals);
    let $kire_response = "";
    const $escape = this.$escape;

    $kire_response += '\n                <div class="card">\n                    <div class="header">';
    // kire-line: 3
    {
        const content = ($props.slots && $props.slots['header']);
        if (content) {
            $kire_response += content;
        } else {
            $kire_response += '';
        }
    }
    $kire_response += '</div>\n                    <div class="body">';
    // kire-line: 4
    {
        const content = ($props.slots && $props.slots['default']);
        if (content) {
            $kire_response += content;
        } else {
            $kire_response += '';
        }
    }
    $kire_response += '</div>\n                </div>\n            ';

    return $kire_response;
    //# sourceURL=C:/Users/danie/OneDrive/Documentos/GitHub/kire/card.kire
    //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQzovVXNlcnMvZGFuaWUvT25lRHJpdmUvRG9jdW1lbnRvcy9HaXRIdWIva2lyZS9jYXJkLmtpcmUiLCJzb3VyY2VzIjpbIkM6L1VzZXJzL2RhbmllL09uZURyaXZlL0RvY3VtZW50b3MvR2l0SHViL2tpcmUvY2FyZC5raXJlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBRXdDOzs7Ozs7Ozs7O0FBQ0YifQ==
};
_dep0.meta = { async: false, path: 'C:/Users/danie/OneDrive/Documentos/GitHub/kire/card.kire' };

$kire_response += '\n        ';
// kire-line: 2
{
    const $slots = new NullProtoObj();
    const _oldRes_comp1 = $kire_response; $kire_response = "";
    // kire-line: 3
    {
        const _oldRes_slot1 = $kire_response; $kire_response = "";
        $kire_response += 'My Header';

        if (typeof $slots !== 'undefined') $slots['header'] = $kire_response;
        $kire_response = _oldRes_slot1;
    }
    {
        const _defRes_def1 = $kire_response; $kire_response = "";
        $kire_response += '\n            \n            Main Content\n        ';
        $slots.default = $kire_response.trim(); $kire_response = _defRes_def1;
    }

    $kire_response = _oldRes_comp1;
    const _oldProps_comp1 = $props;
    $props = Object.assign(Object.create($globals), _oldProps_comp1, {}, { slots: $slots });

    const _dep_comp1 = _dep0;
    const res_comp1 = _dep_comp1.call(this, $props, $globals);
    if (res_comp1 instanceof Promise) {
        $kire_response += await res_comp1;
    } else {
        $kire_response += res_comp1;
    }

    $props = _oldProps_comp1;
}
$kire_response += '\n    ';

return $kire_response;
//# sourceURL=xslot.kire
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHNsb3Qua2lyZSIsInNvdXJjZXMiOlsieHNsb3Qua2lyZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNROzs7O0FBQ0kifQ==