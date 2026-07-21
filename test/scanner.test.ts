import { describe, it, expect } from 'vitest'
import { ExtractMacroBlocks } from '../src/extract/extract'
import type { MacroChunks } from '../src/extract/util'

function scan(source: string): MacroChunks[] {
	return ExtractMacroBlocks(source)
}

function scanContent(source: string): string[] {
	return scan(source).map((c) => c.content)
}

describe('Basic tml! extraction', () => {
	it('extracts a simple tml block', () => {
		const src = `const Avatar = tml! {
  <div class="avatar">
    <img src={user.avatar} alt={user.name} />
  </div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(`tml! {
  <div class="avatar">
    <img src={user.avatar} alt={user.name} />
  </div>
}`)
	})

	it('extracts tml with no space before brace', () => {
		const src = `const x = tml!{ <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toBe(`tml!{ <div /> }`)
	})

	it('extracts tml with script block', () => {
		const src = `const UserCard = tml! {
  <script>
    let user: User;
    let isExpanded = false;
  </script>

  <div class="card">
    <span>{user.name}</span>
  </div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
		expect(result[0]).toContain(`<script>`)
		expect(result[0]).toContain(`</div>`)
	})

	it('reports type as "tml"', () => {
		const result = scan(`const x = tml! { <div /> }`)
		expect(result[0].type).toBe('tml')
	})

	it('reports correct start and end positions', () => {
		const src = `const x = tml! { <div /> }`
		const result = scan(src)
		expect(result[0].start).toBe(10)
		expect(result[0].end).toBe(src.length)
	})

	it('extracts content from offset', () => {
		const src = `const x = tml! { <div /> }`
		const result = scan(src)
		expect(src.slice(result[0].start, result[0].end)).toBe(result[0].content)
	})
})

describe('Basic jml! extraction', () => {
	it('extracts a simple jml block', () => {
		const src = `const Avatar = jml! {
  <div class="avatar">
    <img src={user.avatar} alt={user.name} />
  </div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`jml! {`)
	})

	it('reports type as "jml"', () => {
		const result = scan(`const x = jml! { <div /> }`)
		expect(result[0].type).toBe('jml')
	})
})

describe('Multiple blocks', () => {
	it('extracts multiple tml blocks', () => {
		const src = `const A = tml! { <div /> }
const B = tml! { <span /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
		expect(result[0]).toBe(`tml! { <div /> }`)
		expect(result[1]).toBe(`tml! { <span /> }`)
	})

	it('extracts mixed tml and jml blocks', () => {
		const src = `const A = tml! { <div /> }
const B = jml! { <span /> }`
		const chunks = scan(src)
		expect(chunks).toHaveLength(2)
		expect(chunks[0].type).toBe('tml')
		expect(chunks[1].type).toBe('jml')
	})

	it('extracts blocks separated by JS code', () => {
		const src = `const x = 1
const A = tml! { <div /> }
const y = 2
const B = tml! { <span /> }
const z = 3`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
	})
})

describe('Macro in different positions', () => {
	it('extracts tml in object property', () => {
		const src = `const components = {
  Button: tml! {
    <button>{label}</button>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})

	it('extracts tml in class field', () => {
		const src = `class App {
  readonly Card = tml! {
    <div>{title}</div>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})

	it('extracts tml in return statement', () => {
		const src = `function createWidget() {
  return tml! {
    <div>widget</div>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})

	it('extracts tml in array', () => {
		const src = `const widgets = [
  tml! { <div>a</div> },
  tml! { <span>b</span> },
]`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
	})

	it('extracts tml as function argument', () => {
		const src = `render(tml! {
  <div>hello</div>
})`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})

	it('extracts tml in ternary expression', () => {
		const src = `const widget = show
  ? tml! { <div>yes</div> }
  : tml! { <span>no</span> }`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
	})

	it('ignores tml inside template literal expression', () => {
		const src = 'const html = `before ${tml! { <div>inside</div> }} after`'
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

describe('Nested braces', () => {
	it('handles tml with nested braces in markup', () => {
		const src = `const x = tml! {
  @if(show) {
    <div>{name}</div>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})

	it('handles deeply nested braces', () => {
		const src = `const x = tml! {
  @if(a) {
    @switch(b) {
      @case('x') {
        <div />
      }
      @default {
        <span />
      }
    }
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tml with JS object inside', () => {
		const src = `const x = tml! {
  const config = { a: { nested: true } };
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

describe('Strings inside tml body', () => {
	it('handles string with } inside body', () => {
		const src = `const x = tml! {
  const msg = "use {braces}";
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles string with { inside body', () => {
		const src = `const x = tml! {
  const msg = "hello {world}";
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles escaped quotes in string', () => {
		const src = `const x = tml! {
  const msg = "he said \\"hello\\"";
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles template literal with expressions', () => {
		const src = 'const x = tml! {\n  const msg = `hello ${getLabel({id: 1})}`;\n  <div />\n}'
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

describe('Comments inside tml body', () => {
	it('handles line comment with } inside body', () => {
		const src = `const x = tml! {
  // this is a } comment
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles block comment with } inside body', () => {
		const src = `const x = tml! {
  /* } */
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles block comment with { inside body', () => {
		const src = `const x = tml! {
  /* { */
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles multi-line block comment with braces', () => {
		const src = `const x = tml! {
  /*
   * This comment has { and } and ( and )
   * all over the place
   */
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

describe('Regex inside tml body', () => {
	it('handles regex with } inside body', () => {
		const src = `const x = tml! {
  const re = /\\}/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles regex with { inside body', () => {
		const src = `const x = tml! {
  const re = /\\{/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles complex regex with braces', () => {
		const src = `const x = tml! {
  const re = /^[a-z]{1,10}$/;
  <div />
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles multiple regex in body', () => {
		const src = `const x = tml! {
  const a = /foo/;
  const b = /bar/;
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

describe('Strings and comments hiding "tml"', () => {
	it('ignores tml inside double-quoted string', () => {
		const src = `const x = "tml! { <div /> }"`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores tml inside single-quoted string', () => {
		const src = `const x = 'tml! { <div /> }'`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores tml inside template literal', () => {
		const src = 'const x = `tml! { <div /> }`'
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores tml in line comment', () => {
		const src = `// tml! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores tml in block comment', () => {
		const src = `/* tml! { <div /> } */`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('extracts real tml after string containing tml', () => {
		const src = `const x = "not a tml"
const y = tml! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('extracts real tml after comment containing tml', () => {
		const src = `// not a tml!
const y = tml! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

describe('Non-macro identifiers', () => {
	it('ignores "tml" without bang', () => {
		const src = `const x = tml { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "jml" without bang', () => {
		const src = `const x = jml { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "tml" with space then bang', () => {
		const src = `const x = tml ! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores identifier starting with tml', () => {
		const src = `const x = tmlButton! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores identifier ending with tml', () => {
		const src = `const x = mytml! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "TML" (case sensitive)', () => {
		const src = `const x = TML! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('ignores "Tml" (case sensitive)', () => {
		const src = `const x = Tml! { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

describe('Unclosed blocks', () => {
	it('rejects tml with unclosed body brace', () => {
		const src = `const x = tml! { <div />`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects tml with no body', () => {
		const src = `const x = tml!`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('rejects tml with no body after bang', () => {
		const src = `const x = tml!;`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})
})

describe('Whitespace variations', () => {
	it('handles tab between tml and !', () => {
		const src = `const x = tml\t!{ <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(0)
	})

	it('handles newline between tml! and {', () => {
		const src = `const x = tml!
{ <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml!`)
	})

	it('handles multiple spaces between tml! and {', () => {
		const src = `const x = tml!   { <div /> }`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml!`)
	})

	it('handles tab indentation in body', () => {
		const src = "const x = tml! {\n\t<div />\n}"
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})
})

describe('Boundary conditions', () => {
	it('handles empty source', () => {
		const result = scanContent('')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tml"', () => {
		const result = scanContent('tml')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tml!"', () => {
		const result = scanContent('tml!')
		expect(result).toHaveLength(0)
	})

	it('handles source that is just "tml! {"', () => {
		const result = scanContent('tml! {')
		expect(result).toHaveLength(0)
	})

	it('handles source with only whitespace', () => {
		const result = scanContent('   \n\t  \n  ')
		expect(result).toHaveLength(0)
	})

	it('handles very long body', () => {
		const body = Array.from({ length: 100 }, (_, i) => `  <div id="${i}">{${i}}</div>`).join('\n')
		const src = `const x = tml! {\n${body}\n}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})
})

describe('Real-world usage', () => {
	it('extracts tml from a full component file', () => {
		const src = `import { formatName } from './utils'

const UserCard = tml! {
  <script>
    import { formatName } from './utils';
    let user: User;
    let isExpanded = false;
  </script>

  <div class="card" class:expanded={isExpanded}>
    <span>{formatName(user.name)}</span>
    <button onClick={() => isExpanded = !isExpanded}>Toggle</button>
  </div>
}

export default UserCard`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
		expect(result[0]).toContain(`tml! {`)
	})

	it('extracts tml blocks from component registry', () => {
		const src = `import { TraitContext } from './types'

const tooltip = (ctx: TraitContext<HTMLElement, string>) => {
  ctx.el.title = ctx.value;
}

const components = {
  Avatar: tml! {
    <div class="avatar">
      <img src={user.avatar} />
    </div>
  },
  Button: tml! {
    <button>{label}</button>
  },
}

export { components }`
		const chunks = scan(src)
		expect(chunks).toHaveLength(2)
		expect(chunks[0].type).toBe('tml')
		expect(chunks[1].type).toBe('tml')
	})

	it('extracts tml blocks from class', () => {
		const src = `class App {
  readonly Header = tml! {
    <header>
      <h1>{title}</h1>
    </header>
  }

  readonly Footer = tml! {
    <footer>
      <p>© 2026</p>
    </footer>
  }
}`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
	})

	it('handles mixed tml and regular JS', () => {
		const src = `
const x = 1
const A = tml! { <div /> }
function helper() { return x }
const B = tml! { <span /> }
const y = 2`
		const result = scanContent(src)
		expect(result).toHaveLength(2)
	})

	it('handles Windows line endings', () => {
		const src = "const x = tml! {\r\n  <div />\r\n}"
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles nested tml-like text in markup', () => {
		const src = `const x = tml! {
  <div>The word tml appears here</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tml in arrow function return', () => {
		const src = `const create = () => tml! {
  <div>created</div>
}`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles tml in conditional expression', () => {
		const src = `const widget = isActive
  ? tml! { <div>active</div> }
  : null`
		const result = scanContent(src)
		expect(result).toHaveLength(1)
	})

	it('handles multiple tml in array', () => {
		const src = `const items = [
  tml! { <div>1</div> },
  tml! { <div>2</div> },
  tml! { <div>3</div> },
]`
		const result = scanContent(src)
		expect(result).toHaveLength(3)
	})
})
