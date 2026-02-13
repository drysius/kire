import type { Kire } from "../../kire";
import type { DirectiveDefinition } from "../../types";

export default (kire: Kire) => {
    const elseDirective: DirectiveDefinition = {
        name: `else`,
        children: true,
        type: `html`,
        description: `Renders a block of content if the preceding condition is false.`,
        example: `@if($user.isAdmin)
  Admin Dashboard
@else
  User Dashboard
@endif`,
        async onCall(compiler) {
            compiler.raw(`} else {`);
            if (compiler.children) await compiler.set(compiler.children);
        },
    };

    kire.directive({
        name: `if`,
        params: [`cond:any`],
        children: true,
        type: `html`,
        description: `Conditionally renders a block of content if the expression is true.`,
        example: `@if($user.isLoggedIn)
  Welcome, {{ $user.name }}!
@endif`,
        parents: [
            {
                name: `elseif`,
                params: [`cond:any`],
                children: true,
                type: `html`,
                description: `Renders a block of content if the preceding @if is false and the current expression is true.`,
                example: `@elseif($user.isGuest)
  Please sign in.
@endif`,
                async onCall(compiler) {
                    compiler.raw(`} else if (${compiler.param("cond")}) {`);
                    if (compiler.children) await compiler.set(compiler.children);
                },
            },
            elseDirective,
        ],
        async onCall(compiler) {
            compiler.raw(`if (${compiler.param("cond")}) {`);
            if (compiler.children) await compiler.set(compiler.children);
            if (compiler.parents) await compiler.set(compiler.parents);
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `unless`,
        params: [`cond:any`],
        children: true,
        type: `html`,
        description: `Renders the content unless the condition is true (opposite of @if).`,
        example: `@unless($user.isSubscribed)
  Please subscribe to our newsletter.
@endunless`,
        async onCall(compiler) {
            compiler.raw(`if (!(${compiler.param("cond")})) {`);
            if (compiler.children) await compiler.set(compiler.children);
            compiler.raw(`}`);
        },
    });
};
