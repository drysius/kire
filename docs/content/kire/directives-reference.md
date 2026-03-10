# Directives Reference

This is a practical reference for common Kire directives.

## Interpolation

- `{{ expr }}`: escaped output
- `@{{ expr }}` or raw output directive variants depending on plugin setup

## Control Flow

```kire
@if(user)
  <p>Hello {{ user.name }}</p>
@elseif(guest)
  <p>Guest mode</p>
@else
  <p>Unknown</p>
@end
```

```kire
@for(item of items)
  <li>{{ item }}</li>
@end
```

## Inclusion and Composition

```kire
@include('partials.card', { title: 'Demo' })
```

```kire
@define('hero')
  <h1>Title</h1>
@end

@defined('hero')
```

## Layout and Slots

```kire
@component('layouts.app')
  @slot('content')
    <p>Body</p>
  @endslot
@end
```

## Utility Directives

Depending on installed plugins, you can use helpers such as:

- `@class(...)`
- `@style(...)`
- `@error(...)`
- `@csrf`

## Notes

- Directive behavior can be extended via plugins.
- Keep directive logic focused on rendering, not business rules.
- Prefer passing precomputed values from server/component code.
