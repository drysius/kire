// test view kire
function anonymous($ctx) {
    var { users } = $ctx.$props;
    let it = $ctx.$props;
    // kire-line: 1
    $ctx.$add("<div class=\"container\">\n            <h1>Users List</h1>\n            <ul>\n                ");
    {
        const $__rhs_$0loop = users;
        const $__items_$0loop = Array.isArray($__rhs_$0loop) ? $__rhs_$0loop : Object.entries($__rhs_$0loop || {});
        const $__total_$0loop = $__items_$0loop.length;
        let $__empty_$0loop = $__total_$0loop === 0;

        for (let $__i_$0loop = 0; $__i_$0loop < $__total_$0loop; $__i_$0loop++) {
            const $__entry_$0loop = $__items_$0loop[$__i_$0loop];
            const user = Array.isArray($__rhs_$0loop) ? $__entry_$0loop : $__entry_$0loop[0];
            $__empty_$0loop = false;
            // kire-line: 4
            $ctx.$add("\n                    <li class=\"");
            // kire-line: 5
            $ctx.$add($ctx.$escape(user.active ? 'active' : ''));
            // kire-line: 5
            $ctx.$add("\">\n                        ");
            // kire-line: 6
            $ctx.$add($ctx.$escape(user.name));
            // kire-line: 6
            $ctx.$add(" (");
            // kire-line: 6
            $ctx.$add($ctx.$escape(user.email));
            // kire-line: 6
            $ctx.$add(")\n                        ");
            if (user.isAdmin) {
                // kire-line: 7
                $ctx.$add("\n                            <span class=\"badge\">Admin</span>\n                        ");
            }
            // kire-line: 9
            $ctx.$add("\n                    </li>\n                ");
        }
    }
    // kire-line: 11
    $ctx.$add("\n            </ul>\n        </div>");

    return $ctx.$response;
    //# sourceURL=bundled.kire
    //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlZC5raXJlIiwic291cmNlcyI6WyJidW5kbGVkLmtpcmUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzRHQUdnQjs7Ozs7Ozs7Ozs7O3dCQUFvQjs7Z0RBQ0w7O3FEQUFpQzs7MkNBQ3hDOzttQ0FBZTs7Z0JBQUU7O29DQUFnQjt5Q0FDakM7O21CQUFpQjs7O0NBRVg7Ozs7Q0FFTiJ9
}