# JML Language Specification

`.jml` — JavaScript `.tml` — TypeScript

Both use the same JML syntax. `.tml` additionally allows TypeScript type
annotations.

## 1. Primitives

| Primitive | Purpose                                     | Execution   |
| --------- | ------------------------------------------- | ----------- |
| `tag`     | Reusable markup component                   | Render-time |
| `trait`   | Behavior attached to an element             | Client      |
| `lay`     | Declarative styling and interaction binding | Build-time  |

## 2. `tag`

A `tag` defines reusable markup.

```tml
tag Avatar(user: User) {
  <div class="avatar-box">
    <img src={user.avatar} alt={user.name} />
  </div>
}
```

Tags accept parameters and may compose other tags.

```tml
tag UserCard(user: User) {
  <div class="card">
    <Avatar user={user} />
    <span>{user.name}</span>
  </div>
}
```

## 3. `trait`

A `trait` defines behavior for a single bound element. It receives a strongly
typed context object as its sole parameter.

```tml
trait tooltip(ctx: TraitContext<HTMLElement, string>) {
  ctx.el.title = ctx.value;
}
```

The context object provides:

- `el`: The bound DOM element.
- `value`: The value passed to the binding.
- `set`: A function to update the bound state (if applicable).

```tml
trait model(ctx: TraitContext<HTMLInputElement, string>) {
  ctx.el.value = ctx.value;

  ctx.el.addEventListener("input", () => {
    ctx.set(ctx.el.value);
  });
}
```

Traits may perform synchronous or asynchronous client-side behavior.

## 4. Trait bindings

The binding syntax is:

```tml
.traitName={value}
```

Example:

```tml
<button .ripple={}></button>
<div .tooltip={user.name}></div>
```

For:

```tml
trait tooltip(ctx: TraitContext<HTMLElement, string>) {
  ctx.el.title = ctx.value;
}
```

the binding:

```tml
<div .tooltip={user.name}></div>
```

passes:

```text
ctx.el    → bound element
ctx.value → user.name
```

## 5. Built-in Control Flow

JML provides a rich, hardcoded set of structural directives for templating.
These are not user-defined functions; they are parsed at build-time and compiled
directly into native JavaScript/TypeScript statements. This ensures 100% type
safety, zero runtime overhead, and a familiar syntax.

### 5.1 Conditionals: `@if`, `@else if`, `@else`

Handles boolean and truthy logic. Accepts any standard TypeScript expression.

```tml
@if(user.role === 'admin') {
  <AdminPanel />
}
@else if(user.role === 'moderator') {
  <ModeratorPanel />
}
@else {
  <SignIn />
}
```

### 5.2 Pattern Matching: `@switch`, `@case`, `@default`

Handles complex multi-branch logic cleanly. The compiler automatically enforces
`break` statements.

```tml
@switch(user.role) {
  @case('admin') {
    <AdminTools />
  }
  @case('user') {
    <UserTools />
  }
  @default {
    <GuestTools />
  }
}
```

### 5.3 Iteration: `@for`, `@empty`

Uses native JavaScript `for...of` iteration, meaning it works on Arrays, Sets,
Maps, and Generators. It provides full type inference for the item.

To solve the common UI problem of empty states, `@empty` is triggered if the
iterable has zero length.

```tml
@for(const user of users) {
  <Card user={user} />
}
@empty {
  <p>No users found.</p>
}
```

If an index is required, standard JavaScript destructuring can be used:

```tml
@for(const [index, user] of users.entries()) {
  <Card user={user} key={index} />
}
```

### 5.4 Scope Aliasing: `@with`

Solves the problem of deeply nested property access (e.g.,
`props.user.profile.address.city`). It creates a clean, temporary scope for a
specific object.

```tml
@with(props.user.profile) {
  <div>
    <h1>{name}</h1>
    <p>{address.city}</p>
  </div>
}
```

### 5.5 Error Boundaries: `@try`, `@catch`

A crucial feature for robust UIs. If an expression or a child component throws
an error during render, `@catch` renders a fallback UI instead of crashing the
whole app.

```tml
@try {
  <RiskyComponent data={props.data} />
}
@catch(err) {
  <ErrorFallback message={err.message} />
}
```

### 5.6 Reusable Block Logic

Because JML does not use custom macros, reusable block logic is achieved by
composing standard `tag`s. If you need to wrap content in conditional logic and
reuse it, accept the nested markup as a parameter.

```tml
tag AdminOnly(userid: string, children: any) {
  @if(userid === env.adminId) {
    {children}
  }
}
```

Usage:

```tml
<AdminOnly userid={currentUserId}>
  <AdminPanel />
</AdminOnly>
```

## 6. Attributes and expressions

Static attributes:

```tml
<div class="card"></div>
```

Dynamic attributes:

```tml
<div class={className}></div>
```

Dynamic values:

```tml
<img src={user.avatar} alt={user.name} />
```

Interpolations:

```tml
<span>{user.name}</span>
```

Trait bindings:

```tml
<div .tooltip={user.name}></div>
```

Control flow directives:

```tml
@if(isAdmin)
@for(const item of items)
```
