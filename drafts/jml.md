# JML Language Specification

`.jml` — JavaScript
`.tml` — TypeScript

Both use the same JML syntax. `.tml` additionally allows TypeScript type annotations.

## 1. Primitives

| Primitive      | Purpose                                     | Execution   |
| -------------- | ------------------------------------------- | ----------- |
| `tag`          | Reusable markup component                   | Render-time |
| `trait`        | Behavior attached to an element             | Client      |
| `macro`        | Reusable render-time logic                  | Render-time |
| `static macro` | Build-time content generation               | Build-time  |
| `lay`          | Declarative styling and interaction binding | Build-time  |

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

A `trait` defines behavior for a single bound element.

```tml
trait tooltip(el, value: string) {
  el.title = value;
}
```

The first parameter is the bound element.

```tml
trait model(el, value: string, set) {
  el.value = value;

  el.addEventListener("input", () => {
    set(el.value);
  });
}
```

A trait is bound with:

```tml
<div .tooltip={user.name}></div>
<input .model={username} />
```

The element is automatically passed as the first argument.

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
trait tooltip(el, value: string) {
  el.title = value;
}
```

the binding:

```tml
<div .tooltip={user.name}></div>
```

passes:

```text
el    → bound element
value → user.name
```

## 5. `macro`

A `macro` defines render-time logic.

```tml
macro matches(card: CardData, query: string) {
  if (!query) return true;

  return card.title
    .toLowerCase()
    .includes(query.toLowerCase());
}
```

Macros are invoked with:

```tml
@name(args)
```

A macro may be used as a value:

```tml
<div>@getTitle(card)</div>
```

or as a block:

```tml
@matches(card, query) {
  <Card card={card} />
}
```

A block macro can control or produce repeated markup based on its return value.

Example:

```tml
macro for(item, list) {
  return list;
}
```

Usage:

```tml
@for(card of cards) {
  <Card card={card} />
}
```

The identifier before `of` receives the current item.

## 6. `static macro`

A `static macro` executes during build-time generation.

```tml
static macro read(path: string) {
  return fs.readFileSync(path, "utf-8");
}
```

Usage:

```tml
<div>@read("./legal.md")</div>
```

Arguments to a `static macro` must be statically determinable.

```tml
@read("./legal.md")
```

is valid.

```tml
@read(filepath)
```

is valid only when `filepath` is statically determinable.

The result of a `static macro` becomes generated output.

## 7. Macro invocation

Both macro types use the same invocation syntax:

```tml
@name(args)
```

The declaration determines whether the macro executes at build-time or render-time.

```tml
static macro read(path) {
  // build-time
}

macro matches(value) {
  // render-time
}
```

Example:

```tml
<div>@read("./file.md")</div>
```

```tml
@matches(card, query) {
  <Card card={card} />
}
```

## 8. Attributes and expressions

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

Macro invocations:

```tml
@matches(card, query)
```