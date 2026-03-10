# Components and Slots

Kire components help you reuse structure and enforce consistent markup.

## Basic Component Include

```kire
@include('components.alert', {
  kind: 'success',
  message: 'Saved'
})
```

## Slot Pattern

A layout or component can expose named regions.

```kire
@component('layouts.app')
  @slot('header')
    <h1>Admin</h1>
  @endslot

  @slot('content')
    <p>Dashboard</p>
  @endslot
@end
```

## Passing Structured Data

Pass already validated objects from server code whenever possible.

```kire
@include('components.user-card', { user })
```

## Design Tips

- Keep components focused and small.
- Extract repeated sections early.
- Use slots for structural variation.
- Avoid hidden side effects in components.

## With KireWire

When using `@kirejs/wire`, your server components should render Kire views.

```ts
class Users extends Component {
  render() {
    return this.view("components.users");
  }
}
```

This gives you stateful server components plus reusable Kire view composition.
