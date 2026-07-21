import { describe, it, expect } from 'vitest'
import { Tokenize } from '../src/lexer/tokenize'
import { TokenKind } from '../src/lexer/types'
import type { MacroChunk } from '../src/extract/util'

function makeChunk(content: string): MacroChunk {
	return { type: 'tml', content, start: 0, end: content.length }
}

function kinds(content: string) {
	return Tokenize(makeChunk(content)).map((t) => TokenKind[t.kind])
}

function values(content: string) {
	return Tokenize(makeChunk(content)).map((t) => t.value)
}

describe('Whitespace', () => {
	it('skips leading whitespace', () => {
		const tokens = Tokenize(makeChunk('   <div />'))
		expect(tokens[0].kind).toBe(TokenKind.OpenTag)
	})

	it('skips trailing whitespace', () => {
		const tokens = Tokenize(makeChunk('<div />   '))
		const real = tokens.filter((t) => t.kind !== TokenKind.EOF)
		expect(real).toHaveLength(3) // < + div + />
	})

	it('skips tabs and newlines', () => {
		const tokens = Tokenize(makeChunk('\t\n  <div />\n'))
		expect(tokens[0].kind).toBe(TokenKind.OpenTag)
	})
})

describe('Macro keywords', () => {
	it('tokenizes tml!', () => {
		const result = kinds('tml!')
		expect(result).toContain('Tml')
	})

	it('tokenizes jml!', () => {
		const result = kinds('jml!')
		expect(result).toContain('Jml')
	})

	it('does not confuse identifier starting with t', () => {
		const result = kinds('table')
		expect(result).not.toContain('Tml')
	})

	it('does not confuse identifier starting with j', () => {
		const result = kinds('jump')
		expect(result).not.toContain('Jml')
	})
})

describe('HTML tags', () => {
	it('tokenizes opening tag <', () => {
		const result = kinds('<div')
		expect(result).toContain('OpenTag')
	})

	it('tokenizes closing tag start </', () => {
		const result = kinds('</div>')
		expect(result).toContain('CloseTag')
	})

	it('tokenizes tag end >', () => {
		const result = kinds('<div>')
		expect(result).toContain('TagEnd')
	})

	it('tokenizes self-closing />', () => {
		const result = kinds('<div />')
		expect(result).toContain('SelfClosingTag')
	})

	it('tokenizes < and /> separately for self-closing', () => {
		const result = kinds('<br />')
		expect(result).toContain('OpenTag')
		expect(result).toContain('SelfClosingTag')
	})
})

describe('Braces and parens', () => {
	it('tokenizes {', () => {
		const result = kinds('{')
		expect(result).toContain('OpenBrace')
	})

	it('tokenizes }', () => {
		const result = kinds('}')
		expect(result).toContain('CloseBrace')
	})

	it('tokenizes (', () => {
		const result = kinds('(')
		expect(result).toContain('OpenParen')
	})

	it('tokenizes )', () => {
		const result = kinds(')')
		expect(result).toContain('CloseParen')
	})
})

describe('Other single-char tokens', () => {
	it('tokenizes @', () => {
		const result = kinds('@')
		expect(result).toContain('At')
	})

	it('tokenizes =', () => {
		const result = kinds('=')
		expect(result).toContain('Equals')
	})
})

describe('Identifiers', () => {
	it('tokenizes a simple identifier', () => {
		const tokens = Tokenize(makeChunk('div'))
		const idents = tokens.filter((t) => t.kind === TokenKind.Identifier)
		expect(idents).toHaveLength(1)
		expect(idents[0].value).toBe('div')
	})

	it('tokenizes identifier with digits', () => {
		const tokens = Tokenize(makeChunk('item1'))
		const idents = tokens.filter((t) => t.kind === TokenKind.Identifier)
		expect(idents[0].value).toBe('item1')
	})

	it('tokenizes identifier with underscores', () => {
		const tokens = Tokenize(makeChunk('my_var'))
		const idents = tokens.filter((t) => t.kind === TokenKind.Identifier)
		expect(idents[0].value).toBe('my_var')
	})

	it('tokenizes identifier with dollar sign', () => {
		const tokens = Tokenize(makeChunk('$el'))
		const idents = tokens.filter((t) => t.kind === TokenKind.Identifier)
		expect(idents[0].value).toBe('$el')
	})
})

describe('Mixed content', () => {
	it('tokenizes <div>hello</div>', () => {
		const result = kinds('<div>hello</div>')
		expect(result).toEqual([
			'OpenTag',     // <
			'Identifier',  // div
			'TagEnd',      // >
			'Identifier',  // hello
			'CloseTag',    // </
			'Identifier',  // div
			'TagEnd',      // >
			'EOF',
		])
	})

	it('tokenizes <div class="foo">', () => {
		const result = kinds('<div class="foo">')
		expect(result).toContain('OpenTag')
		expect(result).toContain('Identifier')
		expect(result).toContain('Equals')
		expect(result).toContain('TagEnd')
	})

	it('tokenizes @if(condition) { <div /> }', () => {
		const result = kinds('@if ( condition ) { <div /> }')
		expect(result).toContain('At')
		expect(result).toContain('Identifier')
		expect(result).toContain('OpenParen')
		expect(result).toContain('CloseParen')
		expect(result).toContain('OpenBrace')
		expect(result).toContain('CloseBrace')
		expect(result).toContain('OpenTag')
		expect(result).toContain('SelfClosingTag')
	})

	it('tokenizes {name}', () => {
		const result = kinds('{ name }')
		expect(result).toContain('OpenBrace')
		expect(result).toContain('Identifier')
		expect(result).toContain('CloseBrace')
	})

	it('tokenizes <UserCard name={user} />', () => {
		const result = kinds('<UserCard name = { user } />')
		expect(result).toContain('OpenTag')
		expect(result).toContain('SelfClosingTag')
		expect(result).toContain('OpenBrace')
		expect(result).toContain('CloseBrace')
	})
})

describe('Range / position tracking', () => {
	it('tracks offset correctly', () => {
		const tokens = Tokenize(makeChunk('<div>'))
		const open = tokens.find((t) => t.kind === TokenKind.OpenTag)!
		expect(open.range.start.offset).toBe(0)
		expect(open.range.end.offset).toBe(1)
	})

	it('tracks column correctly', () => {
		const tokens = Tokenize(makeChunk('  <div />'))
		const open = tokens.find((t) => t.kind === TokenKind.OpenTag)!
		expect(open.range.start.column).toBe(2)
		expect(open.range.end.column).toBe(3)
	})

	it('skipped whitespace does not appear in ranges', () => {
		const tokens = Tokenize(makeChunk('   x'))
		const ident = tokens.find((t) => t.kind === TokenKind.Identifier)!
		expect(ident.range.start.offset).toBe(3)
		expect(ident.range.end.offset).toBe(4)
	})
})

describe('EOF', () => {
	it('always appends EOF', () => {
		const tokens = Tokenize(makeChunk(''))
		expect(tokens).toHaveLength(1)
		expect(tokens[0].kind).toBe(TokenKind.EOF)
	})

	it('EOF has null value', () => {
		const tokens = Tokenize(makeChunk('hello'))
		expect(tokens[tokens.length - 1].value).toBeNull()
	})
})

describe('Edge cases', () => {
	it('handles empty content', () => {
		const tokens = Tokenize(makeChunk(''))
		expect(tokens).toHaveLength(1)
		expect(tokens[0].kind).toBe(TokenKind.EOF)
	})

	it('handles just whitespace', () => {
		const tokens = Tokenize(makeChunk('   '))
		expect(tokens).toHaveLength(1)
		expect(tokens[0].kind).toBe(TokenKind.EOF)
	})

	it('handles single character', () => {
		const tokens = Tokenize(makeChunk('@'))
		const real = tokens.filter((t) => t.kind !== TokenKind.EOF)
		expect(real).toHaveLength(1)
		expect(real[0].kind).toBe(TokenKind.At)
	})
})
