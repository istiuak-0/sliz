# Layos — Spec

**Directive:** `lay=""`
**Package:** `layos`
**Status:** Pre-implementation, planning phase
**Standalone** — works with any component framework that supports custom directives

---

## What Is Layos

Layos is a styling and interaction system expressed through a single directive. It is not CSS. It does not generate class names, inject stylesheets, or use a style tag. Styles and interactions are computed from state and applied directly to elements.

Two modes work together:

- **Immediate** — styles recompute and apply directly on every frame when reactive state changes. Style is a function of state, not a persistent rule.
- **Direct** — no stylesheet, no class generation, no injection. Applied straight to the element.

This means Layos works in any runtime — browser, TUI, native — as long as the host framework supports the `lay` directive. The same component code runs everywhere with a different renderer behind it.

---

## The Directive

Everything lives in one attribute:

```html
<div lay="flex col pad:4 gap:2 bg:surface">
<button lay="pad:2,4 bg:primary fg:white round click:ripple">
<input lay="border:gray pad:2 focus:[border:primary glow]">
```

Tokens are space-separated. Order does not matter. Each token is a shorthand, a `property:value` pair, a state block, or an interaction.

---

## Layout

```
flex              display: flex, row direction by default
flex col          flex column
flex row          flex row
grid              display: grid
grid(3)           grid, 3 equal columns
grid(3,2)         3 columns, 2 rows
block             display: block
inline            display: inline-flex
hidden            display: none

center            align-items: center + justify-content: center
spread            justify-content: space-between
start             align-items: flex-start
end               align-items: flex-end
wrap              flex-wrap: wrap
grow              flex-grow: 1
shrink:0          flex-shrink: 0

gap:2             gap: 0.5rem
gap:2,4           row-gap: 0.5rem, col-gap: 1rem
```

---

## Spacing

```
pad:4             padding: 1rem (all sides)
pad:2,4           padding: 0.5rem 1rem (y, x)
pad:1,2,3,4       padding: top right bottom left
pad-x:4           padding-left + padding-right
pad-y:2           padding-top + padding-bottom

m:auto            margin: auto
m:4               margin: 1rem
m-x:auto          margin-left + margin-right: auto
m-t:2             margin-top: 0.5rem
m-b:2             margin-bottom: 0.5rem
```

Spacing scale — multiples of 0.25rem:

| Token | Value |
|---|---|
| 1 | 0.25rem |
| 2 | 0.5rem |
| 3 | 0.75rem |
| 4 | 1rem |
| 6 | 1.5rem |
| 8 | 2rem |
| 12 | 3rem |
| 16 | 4rem |

---

## Sizing

```
w:full            width: 100%
w:screen          width: 100vw
w:40              width: 10rem
w:auto            width: auto
h:full            height: 100%
h:screen          height: 100vh
h:40              height: 10rem
max-w:lg          max-width: 1024px
min-h:screen      min-height: 100vh
aspect:square     aspect-ratio: 1 / 1
aspect:video      aspect-ratio: 16 / 9
```

---

## Color

Colors reference the theme by name. No raw hex values in `lay=""` — those belong in theme config.

```
bg:primary        background: theme.colors.primary
bg:surface        background: theme.colors.surface
bg:transparent    background: transparent
fg:white          color: theme.colors.white
fg:muted          color: theme.colors.muted
border:gray       border-color: theme.colors.gray
ring:primary      outline-color: theme.colors.primary
```

Opacity modifier:

```
bg:primary/50     background: theme.colors.primary at 50% opacity
fg:muted/70       color: theme.colors.muted at 70% opacity
```

---

## Typography

```
text:xs           font-size: 0.75rem
text:sm           font-size: 0.875rem
text:base         font-size: 1rem
text:lg           font-size: 1.125rem
text:xl           font-size: 1.25rem
text:2xl          font-size: 1.5rem
text:3xl          font-size: 1.875rem

font:thin         font-weight: 100
font:light        font-weight: 300
font:normal       font-weight: 400
font:medium       font-weight: 500
font:bold         font-weight: 700
font:black        font-weight: 900

align:left        text-align: left
align:center      text-align: center
align:right       text-align: right

leading:tight     line-height: 1.25
leading:normal    line-height: 1.5
leading:loose     line-height: 2

tracking:tight    letter-spacing: -0.05em
tracking:wide     letter-spacing: 0.1em

truncate          overflow: hidden + text-overflow: ellipsis + white-space: nowrap
uppercase         text-transform: uppercase
lowercase         text-transform: lowercase
```

---

## Visual

```
round             border-radius: 0.5rem
round:sm          border-radius: 0.25rem
round:lg          border-radius: 0.75rem
round:full        border-radius: 9999px
round:none        border-radius: 0

shadow            box-shadow: default
shadow:sm         box-shadow: small
shadow:lg         box-shadow: large
shadow:none       box-shadow: none

border            border: 1px solid currentColor
border:2          border: 2px solid currentColor
border-t          border-top only
border-b          border-bottom only

opacity:50        opacity: 0.5
opacity:0         opacity: 0

overflow:hidden   overflow: hidden
overflow:auto     overflow: auto
overflow:scroll   overflow: scroll

cursor:pointer    cursor: pointer
cursor:default    cursor: default
cursor:not-allowed  cursor: not-allowed

select:none       user-select: none
pointer:none      pointer-events: none

relative          position: relative
absolute          position: absolute
fixed             position: fixed
sticky            position: sticky

z:10              z-index: 10
z:20              z-index: 20
z:top             z-index: 9999

top:0 right:0 bottom:0 left:0   positional shorthands
inset:0           top + right + bottom + left: 0
```

---

## Composite Shorthands

Single tokens that expand to multiple properties:

```
glass             semi-transparent background + backdrop blur + border
card              white bg + border-radius + padding + shadow
overlay           absolute inset + semi-transparent background
divider           border-bottom with muted color
sr-only           visually hidden but accessible
```

These are defined in theme config and can be overridden or extended.

---

## State Modifiers

State blocks apply tokens only when the element is in that state:

```sliz
<button lay="bg:primary hover:[bg:primary-dark shadow:lg lift] active:[scale:0.95]">
<input  lay="border:gray focus:[border:primary ring:primary glow]">
<div    lay="opacity:60 disabled:[opacity:30 cursor:not-allowed]">
```

Syntax: `stateName:[tokens here]`

Built-in states:

```
hover:[ ]         :hover
focus:[ ]         :focus
active:[ ]        :active
disabled:[ ]      [disabled] attribute
checked:[ ]       :checked
empty:[ ]         :empty
first:[ ]         :first-child
last:[ ]          :last-child
odd:[ ]           :nth-child(odd)
even:[ ]          :nth-child(even)
```

Custom states — any boolean signal:

```sliz
<script>
  const selected = obs(false)
</script>

<div lay="bg:surface selected:[bg:primary fg:white]" :data-selected={selected}>
```

---

## Responsive

Breakpoint prefixes:

```
sm:[tokens]       applies at sm breakpoint and above
md:[tokens]       applies at md breakpoint and above
lg:[tokens]       applies at lg breakpoint and above
xl:[tokens]       applies at xl breakpoint and above
```

```sliz
<div lay="flex col md:[flex row] gap:4 md:[gap:8]">
```

---

## Interactions

Interactions are behaviors triggered by events. They live in `lay=""` alongside styling tokens.

### Built-in Interactions

```
click:ripple                  ripple effect from click origin
click:particles               burst of particles on click
click:shake                   shake the element

hover:lift                    elevate with shadow on hover
hover:glow                    glow effect on hover
hover:magnetic(strength:0.3)  pull toward cursor
hover:tilt(intensity:15)      3D tilt toward cursor

mount:fade-in                 fade in on mount
mount:slide-up                slide up on mount
mount:scale-in                scale in on mount
mount:typewriter(speed:50)    typewriter text effect

scroll:reveal                 fade in when entering viewport
scroll:parallax(0.5)          parallax offset on scroll
scroll:sticky                 sticky with scroll effects

drag:free                     free drag
drag:x                        horizontal drag only
drag:y                        vertical drag only
drag:bounds(parent)           constrained to parent

swipe:dismiss(left)           swipe to dismiss
pinch:zoom                    pinch to zoom
```

### Combining Interactions

```sliz
<button lay="pad:4 bg:primary click:ripple hover:lift mount:fade-in">
<div    lay="card scroll:reveal hover:glow">
<div    lay="drag:free hover:magnetic(strength:0.2)">
```

### Interaction Config

Pass config inline:

```
click:particles(count:50 colors:red,blue,green)
hover:magnetic(strength:0.3 radius:100)
mount:typewriter(speed:30 cursor:true)
scroll:parallax(0.3 direction:y)
drag:free(bounds:parent snap:grid)
```

---

## Reactive Tokens

Since Layos is immediate mode, any token value can be a reactive expression. The host framework feeds signal values — Layos reapplies on change.

In Sliz:

```sliz
<script>
  const active  = obs(false)
  const size    = obs(4)
  const theme   = obs("primary")
</script>

<div lay="pad:{size} bg:{active ? theme : 'surface'} round">
```

The `{ }` syntax is the host framework's interpolation — in Sliz this is `{expr}`. In other frameworks use their equivalent.

---

## Dynamic Object Reference

Define complex styles in JS, reference by name:

```typescript
// styles.ts
import { define } from "layos"

export const heroCard = define({
  tokens: "flex col pad:8 gap:4 bg:surface round:lg shadow:lg",
  states: {
    hover: "shadow:xl scale:1.01",
  },
  interactions: {
    mount: "fade-in",
    hover: "lift",
  }
})
```

```sliz
<div lay="$heroCard">
<div lay="$heroCard bg:primary">     <!-- override individual tokens -->
```

`$name` references a defined object. Overrides come after — last wins.

---

## Theme Config

```typescript
// layos.config.ts
export default {
  colors: {
    primary:       "#3b82f6",
    "primary-dark": "#2563eb",
    secondary:     "#8b5cf6",
    danger:        "#ef4444",
    success:       "#10b981",
    surface:       "#ffffff",
    muted:         "#6b7280",
    border:        "#e5e7eb",
  },

  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    6: "1.5rem",
    8: "2rem",
    12: "3rem",
    16: "4rem",
  },

  fontSizes: {
    xs:   "0.75rem",
    sm:   "0.875rem",
    base: "1rem",
    lg:   "1.125rem",
    xl:   "1.25rem",
    "2xl": "1.5rem",
  },

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },

  // custom composite shorthands
  shortcuts: {
    glass: {
      background:     "rgba(255,255,255,0.1)",
      backdropFilter: "blur(10px)",
      border:         "1px solid rgba(255,255,255,0.2)",
    },
    card: {
      background:   "white",
      borderRadius: "0.5rem",
      padding:      "1.5rem",
      boxShadow:    "0 1px 3px rgba(0,0,0,0.1)",
    }
  }
}
```

---

## Plugin API

```typescript
import { registerInteraction, registerShortcut, registerState } from "layos"

// custom interaction
registerInteraction("confetti", {
  onClick: (e, el, config) => {
    // confetti implementation
  }
})

// custom shorthand
registerShortcut("frosted", {
  background:     "rgba(255,255,255,0.15)",
  backdropFilter: "blur(20px)",
  border:         "1px solid rgba(255,255,255,0.3)",
})

// custom state
registerState("loading", (el, active) => {
  if (active) {
    el.classList.add("lay-loading")
  } else {
    el.classList.remove("lay-loading")
  }
})
```

```sliz
<!-- use custom interaction and shorthand -->
<button lay="frosted pad:4 click:confetti">
<div    lay="card loading:[opacity:50 cursor:wait]" :data-loading={isLoading}>
```

---

## Runtime Adapters

Layos ships adapters for different rendering targets. Same `lay=""` tokens, different output.

### Browser

Applies CSS properties directly to `element.style`. No stylesheet. Reactive updates patch only changed properties.

### TUI (Terminal)

Maps layout tokens to terminal layout primitives. `flex col` becomes vertical stacking, `pad:2` becomes character padding. Color tokens map to terminal colors.

### Custom Runtime

```typescript
import { createRuntime } from "layos"

const myRuntime = createRuntime({
  applyStyle: (el, property, value) => {
    // map CSS property + value to your target
  },
  applyInteraction: (el, name, config) => {
    // wire up interaction to your event system
  }
})
```

---

## Stability

| Symbol | Tier |
|---|---|
| `lay=""` directive | LOCKED |
| Token syntax `property:value` | LOCKED |
| State block syntax `state:[ ]` | LOCKED |
| Breakpoint syntax `md:[ ]` | LOCKED |
| Interaction syntax `event:name` | LOCKED |
| Dynamic ref syntax `$name` | LOCKED |
| Built-in token set | EXTENSIBLE |
| Built-in interactions | EXTENSIBLE |
| Theme config shape | EXTENSIBLE |
| Plugin API | LOCKED |
| Runtime adapter API | LOCKED |
| Browser renderer internals | INTERNAL |