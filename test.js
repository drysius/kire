const it = $ctx.$props;
let slots = $ctx.$props['slots'] !== undefined ? $ctx.$props['slots'] : $ctx.$globals['slots'];
$ctx.$response += '<div class=\'card\'>';
{
    const content = ($ctx.slots && $ctx.slots['header']) || ($ctx.$props.slots && $ctx.$props.slots['header']);
    if (typeof content === 'function') {
        const r = content(); if (r instanceof Promise) await r;
    } else if (content) {
        $ctx.$response += content;
    } else {
        $ctx.$response += '';
    }
}
$ctx.$response += '<div class=\'body\'>';
$ctx.$response += $ctx.$escape(slots.default);
$ctx.$response += '</div></div>';

return $ctx;