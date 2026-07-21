import { describe, it, expect } from 'vitest'
import { ExtractJmlBlocks } from '../src/extract/extract'
import type { JmlChunk } from '../src/extract/util'

function scan(source: string): JmlChunk[] {
	return ExtractJmlBlocks(source)
}

function scanContent(source: string): string[] {
	return scan(source).map((c) => c.content)
}

function scanTypes(source: string): string[] {
	return scan(source).map((c) => c.type)
}

// ─── Basic Extraction ────────────────────────────────────────────────────────

describe('Basic tag extraction', () => {
	it('extracts a simple tag block', () => {
		const result = scanContent(`tag Avatar(x) { <div /> }`)
		expect(result).toEqual([`tag Avatar(x) { <div /> }`])
	})

	it('extracts a tag with multi-line body', () => {
		const src = `tag Avatar(x) {
  <div class="avatar">
    <img src={x} />
  </div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('extracts a tag with nested braces', () => {
		const src = `tag Foo(x) {
  @if(x) {
    <div>{x}</div>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('extracts a tag with complex params', () => {
		const src = `tag UserCard(user: User, admin: boolean) {
  <div class="card">{user.name}</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('extracts a tag with no body content', () => {
		const src = `tag Empty(x) { }`
		const result = scanContent(src)
		expect(result).toEqual([src])
	})

	it('reports type as "tag"', () => {
		const result = scan(`tag Foo(x) { <div /> }`)
		expect(result[0].type).toBe('tag')
	})
})

// ─── Basic Trait Extraction ──────────────────────────────────────────────────

describe('Basic trait extraction', () => {
	it('extracts a simple trait block', () => {
		const src = `trait tooltip(ctx: TraitContext<HTMLElement, string>) {
  ctx.el.title = ctx.value;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('reports type as "trait"', () => {
		const result = scan(`trait tooltip(ctx: TraitContext<HTMLElement, string>) {
  ctx.el.title = ctx.value;
}`)
		expect(result[0].type).toBe('trait')
	})

	it('extracts a trait with complex body', () => {
		const src = `trait model(ctx: TraitContext<HTMLInputElement, string>) {
  ctx.el.value = ctx.value;
  ctx.el.addEventListener("input", () => {
    ctx.set(ctx.el.value);
  });
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('extracts a trait with generic type params', () => {
		const src = `trait focus(ctx: TraitContext<HTMLDivElement, void>) {
  ctx.el.focus();
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})

// ─── Mixed Tag + Trait ──────────────────────────────────────────────────────

describe('Mixed tag and trait blocks', () => {
	it('extracts both tags and traits with correct types', () => {
		const src = `
tag Avatar(x) { <img src={x} /> }
trait tooltip(ctx: TraitContext<HTMLElement, string>) {
  ctx.el.title = ctx.value;
}
tag Button(label) { <button>{label}</button> }`
		const chunks = scan(src)
		expect(chunks).toHaveLength(3)
		expect(chunks[0].type).toBe('tag')
		expect(chunks[0].content).toContain('tag Avatar')
		expect(chunks[1].type).toBe('trait')
		expect(chunks[1].content).toContain('trait tooltip')
		expect(chunks[2].type).toBe('tag')
		expect(chunks[2].content).toContain('tag Button')
	})
})

// ─── Multiple Tags ───────────────────────────────────────────────────────────

describe('Multiple tags in one source', () => {
	it('extracts two tags separated by JS code', () => {
		const src = `
const x = 1
tag Avatar(a) { <img src={a} /> }
const y = 2
tag Button(label) { <button>{label}</button> }
const z = 3`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
		expect(result[0]).toBe(`tag Avatar(a) { <img src={a} /> }`)
		expect(result[1]).toBe(`tag Button(label) { <button>{label}</button> }`)
	})

	it('extracts back-to-back tags with no separating code', () => {
		const src = `tag A(x) { <div /> }tag B(y) { <span /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
		expect(result[0]).toBe(`tag A(x) { <div /> }`)
		expect(result[1]).toBe(`tag B(y) { <span /> }`)
	})

	it('extracts tags separated by comments', () => {
		const src = `
tag A(x) { <div /> }
// this is a comment
/* block comment */
tag B(y) { <span /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
	})
})

// ─── Strings ─────────────────────────────────────────────────────────────────

describe('Strings containing "tag" keyword', () => {
	it('ignores "tag" inside double-quoted string', () => {
		const src = `const x = "tag Foo(x) { <div /> }"`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "tag" inside single-quoted string', () => {
		const src = `const x = 'tag Foo(x) { <div /> }'`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "tag" inside template literal', () => {
		const src = 'const x = `tag Foo(x) { <div /> }`'
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('extracts real tag that comes after a string containing "tag"', () => {
		const src = `const x = "not a tag"
tag Real(y) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain('tag Real(y)')
	})

	it('handles string with escaped quotes near tag', () => {
		const src = `const x = "he said \\"tag\\""
tag Real(y) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles unclosed string (scanner should not hang)', () => {
		const src = `"tag Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

// ─── Comments ────────────────────────────────────────────────────────────────

describe('Comments containing "tag" keyword', () => {
	it('ignores "tag" in line comment', () => {
		const src = `// tag Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "tag" in block comment', () => {
		const src = `/* tag Foo(x) { <div /> } */`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('extracts tag that follows a line comment', () => {
		const src = `// this is a comment
tag Real(y) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('extracts tag that follows a block comment', () => {
		const src = `/* comment */
tag Real(y) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles unclosed block comment (should not hang)', () => {
		const src = `/* tag Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

// ─── Comments & Regex Inside Tag Body ────────────────────────────────────────

describe('Comments and regex inside tag body (brace counting)', () => {
	it('handles line comment with } inside tag body', () => {
		const src = `tag Foo(x) {
  // this is a } comment
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles block comment with } inside tag body', () => {
		const src = `tag Foo(x) {
  /* } */
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles block comment with { inside tag body', () => {
		const src = `tag Foo(x) {
  /* { */
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex with } inside tag body', () => {
		const src = `tag Foo(x) {
  const re = /\\}/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex with { inside tag body', () => {
		const src = `tag Foo(x) {
  const re = /\\{/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles complex regex with braces inside tag body', () => {
		const src = `tag Foo(x) {
  const re = /^[a-z]{1,10}$/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex with character class containing /', () => {
		const src = `tag Foo(x) {
  const re = /[\\//]/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex assigned with equals', () => {
		const src = `tag Foo(x) {
  const re = /test/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex in return statement (after keyword)', () => {
		const src = `tag Foo(x) {
  return /pattern/;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles division operator not confused as regex', () => {
		const src = `tag Foo(x) {
  const y = x / 2;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex after comma in params', () => {
		const src = `tag Foo(x, /pattern/) {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles multiple regex in body', () => {
		const src = `tag Foo(x) {
  const a = /foo/;
  const b = /bar/;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})

// ─── Comments & Regex Inside Trait Body ─────────────────────────────────────

describe('Comments and regex inside trait body', () => {
	it('handles line comment with } in trait body', () => {
		const src = `trait tooltip(ctx) {
  // }
  ctx.el.title = "test";
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex in trait body', () => {
		const src = `trait model(ctx) {
  const re = /^\\d+$/;
  ctx.el.value = ctx.value;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})

// ─── Template Literals Inside Tag Body ───────────────────────────────────────

describe('Template literals inside tag body', () => {
	it('handles template literal without expressions', () => {
		const src = `tag Foo(x) {
  const msg = \`hello world\`;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles template literal with ${} expression containing braces', () => {
		const src = `tag Foo(x) {
  const msg = \`hello \${getLabel({id: 1})}\`;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles template literal with nested template', () => {
		const src = `tag Foo(x) {
  const msg = \`outer \${\`inner \${x}\`}\`;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})

// ─── Parameter Edge Cases ────────────────────────────────────────────────────

describe('Parameter edge cases', () => {
	it('handles nested parens in parameters', () => {
		const src = `tag Foo(x: Record<string, number>) {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles string inside parameters', () => {
		const src = `tag Foo(x: string = "default") {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles comment inside parameters (line comment)', () => {
		const src = `tag Foo(x /* ) */) {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles comment inside parameters (block comment)', () => {
		const src = `tag Foo(x /* ) */) {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles deeply nested parens in parameters', () => {
		const src = `tag Foo(x: ((a: ((b: string))) => void)) {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex inside parameters', () => {
		const src = `tag Foo(pattern: RegExp = /test/) {
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})

// ─── Whitespace Variations ───────────────────────────────────────────────────

describe('Whitespace variations', () => {
	it('handles tab indentation', () => {
		const src = `tag\tFoo(x)\t{\n\t<div />\n}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles extra spaces between keyword and name', () => {
		const src = `tag   Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles newline between tag and name', () => {
		const src = `tag
Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles newline between name and params', () => {
		const src = `tag Foo
(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles newline between params and body', () => {
		const src = `tag Foo(x)
{ <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

// ─── Non-Tag / Non-Trait Identifiers ────────────────────────────────────────

describe('Non-JML identifiers should not trigger extraction', () => {
	it('ignores identifier "tags" (plural)', () => {
		const src = `tags Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores identifier "tagged"', () => {
		const src = `tagged Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores identifier "mytag"', () => {
		const src = `mytag Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "tag" when not followed by whitespace', () => {
		const src = `tag(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "tag" as part of a longer word', () => {
		const src = `const tags = 1`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "TAG" (case sensitive)', () => {
		const src = `TAG Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "Tag" (case sensitive)', () => {
		const src = `Tag Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "traits" (plural)', () => {
		const src = `traits Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "traitted"', () => {
		const src = `traitted Foo(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

// ─── Tag/Trait Without Parameters ────────────────────────────────────────────

describe('Block without parameters', () => {
	it('rejects tag without params (no paren)', () => {
		const src = `tag Foo { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects trait without params (no paren)', () => {
		const src = `trait Foo { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects tag with empty parens then no brace immediately', () => {
		const src = `tag Foo() bar { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

// ─── Unclosed Blocks ─────────────────────────────────────────────────────────

describe('Unclosed blocks', () => {
	it('rejects tag with unclosed body brace', () => {
		const src = `tag Foo(x) { <div />`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects tag with unclosed param paren', () => {
		const src = `tag Foo(x { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects tag with mismatched braces', () => {
		const src = `tag Foo(x) { <div> {x} </div>`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects trait with unclosed body brace', () => {
		const src = `trait Foo(x) { ctx.el.title = x`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

// ─── Real-World JS Code Surrounding Tags ─────────────────────────────────────

describe('Tags embedded in real-world JS code', () => {
	it('extracts tag from a module with imports and exports', () => {
		const src = `import { User } from './types'

const ADMIN_ID = 'admin-123'

tag Avatar(user: User) {
  <div class="avatar">
    <img src={user.avatar} alt={user.name} />
  </div>
}

tag UserCard(user: User) {
  <div class="card">
    <Avatar user={user} />
    <span>{user.name}</span>
  </div>
}

export { Avatar, UserCard }`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
		expect(result[0]).toContain('tag Avatar(user: User)')
		expect(result[1]).toContain('tag UserCard(user: User)')
	})

	it('extracts tag from code with functions and classes', () => {
		const src = `function helper() {
  return { name: 'test' }
}

class MyClass {
  method() {
    return 42
  }
}

tag Banner(title: string) {
  <div class="banner">
    <h1>{title}</h1>
  </div>
}

const arrow = (x) => x + 1`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain('tag Banner(title: string)')
	})

	it('extracts tag from code with complex expressions', () => {
		const src = `const items = arr.filter(x => x.active).map(x => x.id)

tag List(items: string[]) {
  <ul>
    @for(const item of items) {
      <li>{item}</li>
    }
  </ul>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles code with arrow functions containing braces', () => {
		const src = `const fn = (x) => {
  if (x) { return 1 }
  return 0
}

tag Simple(y) {
  <div>{y}</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(`tag Simple(y) {
  <div>{y}</div>
}`)
	})

	it('handles code with object literals containing braces', () => {
		const src = `const config = {
  a: { nested: true },
  b: [1, 2, 3]
}

tag ConfigView(cfg: typeof config) {
  <div>{JSON.stringify(cfg)}</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

// ─── JML-Specific Syntax Inside Body ─────────────────────────────────────────

describe('JML control flow inside tag body', () => {
	it('handles @if/@else inside body', () => {
		const src = `tag Panel(user: User) {
  @if(user.role === 'admin') {
    <AdminPanel />
  }
  @else {
    <SignIn />
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles @for/@empty inside body', () => {
		const src = `tag UserList(users: User[]) {
  @for(const user of users) {
    <Card user={user} />
  }
  @empty {
    <p>No users found.</p>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles @switch/@case/@default inside body', () => {
		const src = `tag RoleView(role: string) {
  @switch(role) {
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
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles @try/@catch inside body', () => {
		const src = `tag SafeRender(data: any) {
  @try {
    <RiskyComponent data={data} />
  }
  @catch(err) {
    <ErrorFallback message={err.message} />
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles @with inside body', () => {
		const src = `tag Profile(props: any) {
  @with(props.user.profile) {
    <div>
      <h1>{name}</h1>
      <p>{address.city}</p>
    </div>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles deeply nested control flow', () => {
		const src = `tag Dashboard(user: User) {
  @if(user) {
    @switch(user.role) {
      @case('admin') {
        @if(user.active) {
          <AdminDashboard />
        }
        @else {
          <InactiveAdmin />
        }
      }
      @default {
        <UserDashboard />
      }
    }
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})

// ─── Edge Cases: Boundary Conditions ─────────────────────────────────────────

describe('Boundary conditions', () => {
	it('handles empty source', () => {
		const result = scanContent('')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tag"', () => {
		const result = scanContent('tag')
		expect(result).toHaveLength(0)
	})

	it('handles source that is "tag " (with trailing space)', () => {
		const result = scanContent('tag ')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tag Foo"', () => {
		const result = scanContent('tag Foo')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tag Foo("', () => {
		const result = scanContent('tag Foo(')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tag Foo()"', () => {
		const result = scanContent('tag Foo()')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tag Foo() {"', () => {
		const result = scanContent('tag Foo() {')
		expect(result).toHaveLength(0)
	})

	it('handles very long tag body', () => {
		const body = Array.from({ length: 100 }, (_, i) => `  <div id="${i}">{${i}}</div>`).join('\n')
		const src = `tag BigList(x) {\n${body}\n}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles tag with special chars in attribute values', () => {
		const src = `tag Special(x) {
  <div data-foo="bar" class='baz' />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

// ─── Extreme Push Tests ──────────────────────────────────────────────────────

describe('Extreme edge cases', () => {
	it('handles multiple string types interleaved with tags', () => {
		const src = `
"tag not real"
tag A(x) { <div /> }
'also not real'
/* tag also not real */
tag B(y) { <span /> }
\`template with tag\`
tag C(z) { <p /> }
`
		const result = scanContent(src)
		expect(result).toHaveLength(3)
		expect(result[0]).toContain('tag A')
		expect(result[1]).toContain('tag B')
		expect(result[2]).toContain('tag C')
	})

	it('handles tag with escaped quotes in string params', () => {
		const src = `tag Foo(x: string = "he said \\"hello\\"") {
  <div>{x}</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tag with regex containing slashes', () => {
		const src = `tag Foo(pattern: string) {
  const re = new RegExp(pattern);
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tag body with all JML primitives', () => {
		const src = `tag FullExample(user: User, items: Item[]) {
  @if(user) {
    @with(user.profile) {
      <div class="profile">
        <h1>{name}</h1>
        @for(const item of items) {
          <Card item={item} />
        }
        @empty {
          <p>No items</p>
        }
        @try {
          <RiskyWidget />
        }
        @catch(err) {
          <Error message={err.message} />
        }
      </div>
    }
  }
  @else {
    <SignIn />
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles interleaved valid and invalid tag-like patterns', () => {
		const src = `
tag Good(x) { <div /> }
const tag = "var named tag"
tag(x) { }
tag AlsoGood(y) {
  <span>{y}</span>
}
// tag InComment(z) { }
"tag InString(w) { }"
`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
		expect(result[0]).toContain('tag Good(x)')
		expect(result[1]).toContain('tag AlsoGood(y)')
	})

	it('handles Windows line endings (\\r\\n)', () => {
		const src = `tag Foo(x) {\r\n  <div />\r\n}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles source with only whitespace', () => {
		const result = scanContent('   \n\t  \n  ')
		expect(result).toHaveLength(0)
	})

	it('handles tag at very start of file', () => {
		const src = `tag First(x) { <div /> }
const y = 1`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tag at very end of file (no trailing newline)', () => {
		const src = `const y = 1
tag Last(x) { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles consecutive tags with no code between', () => {
		const src = `tag A(x) { <div /> }tag B(y) { <span /> }tag C(z) { <p /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(3)
	})

	it('handles tag with unicode in string inside body', () => {
		const src = `tag Foo(x) {
  const msg = "Hello \\u0041\\u0042";
  <div>{msg}</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tag where body contains the word "tag" as text', () => {
		const src = `tag Foo(x) {
  <div>The word tag appears here</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles division after closing paren (not confused as regex)', () => {
		const src = `tag Foo(x) {
  const y = getValue() / 2;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles division after closing bracket (not confused as regex)', () => {
		const src = `tag Foo(x) {
  const y = arr[0] / 2;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles division after identifier (not confused as regex)', () => {
		const src = `tag Foo(x) {
  const y = count / 2;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex after assignment operator', () => {
		const src = `tag Foo(x) {
  const re = /test/;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex after return keyword', () => {
		const src = `tag Foo(x) {
  return /test/;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex after opening paren (in function call)', () => {
		const src = `tag Foo(x) {
  const m = str.match(/test/);
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles nested /* inside block comment (JS does not nest)', () => {
		// JS block comments don't nest: /* outer /* inner */ closes at first */
		// So ` still comment } */` is live code — the } closes the body.
		const src = `tag Foo(x) {
  /* outer /* inner */ still comment }
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(`tag Foo(x) {
  /* outer /* inner */ still comment }`)
	})

	it('handles string with braces inside body', () => {
		const src = `tag Foo(x) {
  const msg = "use {braces} and (parens)";
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles regex after various operators in body', () => {
		const src = `tag Foo(x) {
  const a = x ? /yes/ : /no/;
  const c = x || /fallback/;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})

	it('handles interleaved tag and trait with mixed features', () => {
		const src = `
import { TraitContext } from './types'

tag Avatar(user: User) {
  <div class="avatar">
    <img src={user.avatar} />
  </div>
}

trait tooltip(ctx: TraitContext<HTMLElement, string>) {
  ctx.el.title = ctx.value;
  const re = /^tooltip-/;
}

tag Button(label: string) {
  <button .tooltip={label}>{label}</button>
}

trait ripple(ctx: TraitContext<HTMLButtonElement, void>) {
  ctx.el.addEventListener("click", () => {
    // ripple effect
    const pattern = /ripple/;
  });
}`
		const chunks = scan(src)
		expect(chunks).toHaveLength(4)
		expect(chunks[0].type).toBe('tag')
		expect(chunks[0].content).toContain('tag Avatar')
		expect(chunks[1].type).toBe('trait')
		expect(chunks[1].content).toContain('trait tooltip')
		expect(chunks[2].type).toBe('tag')
		expect(chunks[2].content).toContain('tag Button')
		expect(chunks[3].type).toBe('trait')
		expect(chunks[3].content).toContain('trait ripple')
	})

	it('handles comment with braces across many lines in body', () => {
		const src = `tag Foo(x) {
  /*
   * This comment has { and } and ( and )
   * all over the place
   */
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(src)
	})
})
