# JML / TML Language Specification (v2)

**File Extensions:** 
* `.jml` — JavaScript
* `.tml` — TypeScript

Both use the exact same JML syntax. `.tml` additionally allows TypeScript type annotations inside the `<script>` blocks and standard JS/TS logic.

---

## 1. Core Primitive: The Component Macro
JML uses a Rust-inspired macro expression: **`tml!`** (or **`jml!`**). 

Because it is an **expression**, it evaluates to a value. This means a component can be placed **literally anywhere** in your code: in variables, object properties, class fields, or return statements, without causing syntax conflicts.

```typescript
// 1. Standard variable assignment
const Avatar = tml! {
  <script>
    let user: User;
  </script>
  <div class="avatar-box">
    <img src={user.avatar} alt={user.name} />
  </div>
}

// 2. Inside an object
const components = {
  Button: tml! {
    <script>
      let label: string;
    </script>
    <button>{label}</button>
  }
}

// 3. Inside a class
class App {
  readonly Card = tml! {
    <script>
      let title: string;
    </script>
    <div>{title}</div>
  }
}
```

---

## 2. Internal Block Structure
Inside the `tml! {}` block, the syntax is divided into clear sections:

1. **The `<setup>` Block:** Contains standard JavaScript/TypeScript. This is where you define props, state, imports, and setup logic. The compiler parses this to extract types and context.
2. **The Markup Block:** Everything outside the `<setup>` tag is parsed as JML markup (HTML, components, control flow, and trait bindings).

```typescript
const UserCard = tml! {
  <setup>
    import { formatName } from './utils';
    
    // Props and state are defined here as standard variables
    let user: User;
    let isExpanded = false;
  </setup>

  <div class="card" class:expanded={isExpanded}>
    <span>{formatName(user.name)}</span>
    <button onClick={() => isExpanded = !isExpanded}>Toggle</button>
  </div>
}
```

---

## 3. Traits (Standard JS/TS Functions)

Traits are simply standard JavaScript or TypeScript functions. This keeps the compiler simple and leverages native tooling (TypeScript handles the types, IDEs handle the autocomplete).

A trait function receives a strongly typed context object as its parameter.

```typescript
// Just a standard TS function! No compiler magic needed.
const tooltip = (ctx: TraitContext<HTMLElement, string>) => {
  ctx.el.title = ctx.value;
};

const model = (ctx: TraitContext<HTMLInputElement, string>) => {
  ctx.el.value = ctx.value;
  ctx.el.addEventListener("input", () => {
    ctx.set(ctx.el.value);
  });
};
```

### Trait Bindings in Markup
To apply a trait to an element, use the dot (`.`) prefix in the markup. The compiler recognizes this and passes the element and value to the trait function at runtime.

**Syntax:** `.traitName={value}`

```html
<!-- Binds the 'tooltip' trait defined above -->
<div .tooltip={user.name}></div>

<!-- Binds the 'model' trait for two-way binding -->
<input .model={searchQuery} />
```

---

## 4. Built-in Control Flow
JML provides a rich, hardcoded set of structural directives for templating. These are parsed at build-time and compiled directly into native JavaScript/TypeScript statements. This ensures 100% type safety, zero runtime overhead, and a familiar syntax.

### 4.1 Conditionals: `@if`, `@else if`, `@else`
```html
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

### 4.2 Pattern Matching: `@switch`, `@case`, `@default`
```html
@switch(user.role) {
  @case('admin') { <AdminTools /> }
  @case('user') { <UserTools /> }
  @default { <GuestTools /> }
}
```

### 4.3 Iteration: `@for`, `@empty`
Uses native JavaScript `for...of` iteration. `@empty` triggers if the iterable has zero length.
```html
@for(const user of users) {
  <Card user={user} />
}
@empty {
  <p>No users found.</p>
}

<!-- With index -->
@for(const [index, user] of users.entries()) {
  <Card user={user} key={index} />
}
```

### 4.4 Scope Aliasing: `@with`
Creates a clean, temporary scope for a specific object to avoid deep nesting.
```html
@with(props.user.profile) {
  <div>
    <h1>{name}</h1>
    <p>{address.city}</p>
  </div>
}
```

### 4.5 Error Boundaries: `@try`, `@catch`
If a child component throws an error during render, `@catch` renders a fallback UI.
```html
@try {
  <RiskyComponent data={props.data} />
}
@catch(err) {
  <ErrorFallback message={err.message} />
}
```

---

## 5. Attributes and Expressions

**Static attributes:**
```html
<div class="card"></div>
```

**Dynamic attributes:**
```html
<div class={className}></div>
```

**Dynamic values & Interpolations:**
```html
<img src={user.avatar} alt={user.name} />
<span>{user.name}</span>
```

**Component Composition:**
Components are just variables/objects, so you use them like standard HTML tags.
```html
<UserCard user={currentUser} />
```

**Reusable Block Logic (Slots/Children):**
Because JML uses standard functions for logic, reusable block logic is achieved by accepting nested markup as a `children` prop in the `<script>` block.
```typescript
const AdminOnly = tml! {
  <script>
    let userid: string;
    let children: any;
  </script>
  
  @if(userid === env.adminId) {
    {children}
  }
}
```
Usage:
```html
<AdminOnly userid={currentUserId}>
  <AdminPanel />
</AdminOnly>
```