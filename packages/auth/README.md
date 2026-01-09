# @kirejs/auth

Authentication directives and helpers for Kire. Simplifies handling user states in your templates.

## Features

- **@auth / @guest**: Conditionally render content based on authentication state.
- **Role/Permission Checks**: (If configured) Directives for checking user roles.

## Installation

```bash
npm install @kirejs/auth
# or
bun add @kirejs/auth
```

## Usage

```html
@auth
  <p>Welcome back, {{ user.name }}!</p>
@else
  <a href="/login">Login</a>
@end
```

## License

MIT
