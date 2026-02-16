function kire_tpl($ctx) {
    const NullProtoObj = $ctx.NullProtoObj;
    let users = $ctx.$props['users'] !== undefined ? $ctx.$props['users'] : $ctx.$globals['users'];
    $ctx.$response += '\n<div class=\'container\'>\n    <h1>Users List</h1>\n    <ul>\n        ';
    // kire-line: 5

    (Array.isArray(users) ? users : Object.entries(users || new NullProtoObj())).forEach(<async>(user, index) => {
        // kire-line: 6
        $ctx.$response += '\n            <li class=\'' + (user.active ? 'active' : '') + '\'>\n                ';
        // kire-line: 7
        $ctx.$response += $ctx.$escape(user.name) + ' (' + $ctx.$escape(user.email) + ')\n                ';
        // kire-line: 8
        if (user.isAdmin) {
            $ctx.$response += '\n                    <span class=\'badge\'>Admin</span>\n                ';
        }
        $ctx.$response += '\n            </li>\n        ';
    })
    $ctx.$response += '\n    </ul>\n</div>';

    return $ctx;
}