import type { Kire } from "../../kire";
import type { DirectiveDefinition } from "../../types";

export default (kire: Kire<any>) => {
    const elseDirective: DirectiveDefinition = {
        name: `else`,
        children: true,
        type: `html`,
        description: `Renders a block of content if the preceding condition is false.`,
        example: `@if($user.isAdmin)\n  Admin Dashboard\n@else\n  User Dashboard\n@endif`,
        onCall: (compiler) => {
            compiler.raw(`} else {`);
            if (compiler.children) compiler.set(compiler.children);
        },
    };

    kire.directive({
        name: `if`,
        params: [`cond:any`],
        children: true,
        type: `html`,
        description: `Conditionally renders a block of content if the expression is true.`,
        example: `@if($user.isLoggedIn)\n  Welcome, {{ $user.name }}!\n@endif`,
        parents: [
            {
                name: `elseif`,
                params: [`cond:any`],
                children: true,
                type: `html`,
                description: `Renders a block of content if the preceding @if is false and the current expression is true.`,
                example: `@elseif($user.isGuest)\n  Please sign in.\n@endif`,
                onCall: (compiler) => {
                    compiler.raw(`} else if (${compiler.param("cond")}) {`);
                    if (compiler.children) compiler.set(compiler.children);
                },
            },
            elseDirective,
        ],
        onCall: (compiler) => {
            compiler.raw(`if (${compiler.param("cond")}) {`);
            if (compiler.children) compiler.set(compiler.children);
            if (compiler.parents) compiler.set(compiler.parents);
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `unless`,
        params: [`cond:any`],
        children: true,
        type: `html`,
        description: `Renders the content unless the condition is true (opposite of @if).`,
        example: `@unless($user.isSubscribed)\n Please subscribe to our newsletter.\n@endunless`,
        onCall: (compiler) => {
            compiler.raw(`if (!(${compiler.param("cond")})) {`);
            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`}`);
        },
    });
};
