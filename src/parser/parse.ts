import { Token, TokenKind, SourceRange } from '../lexer/types'
import { Program, Text, Tag, SelfClose, Attr, Expr, If, Else, Node, NodeKind } from './types'

export class Parser {
	private cursor = 0
	private readonly tokens: Token[]

	constructor(tokens: Token[]) {
		this.tokens = tokens
	}

	private peek(): Token {
		return this.tokens[this.cursor]
	}

	private advance(): Token {
		return this.tokens[this.cursor++]
	}

	private expect(kind: TokenKind): Token {
		const tok = this.peek()
		if (tok.kind !== kind) {
			throw new Error(`Expected ${TokenKind[kind]}, got ${TokenKind[tok.kind]} at offset ${tok.range.start.offset}`)
		}
		return this.advance()
	}

	private makeRange(start: SourceRange, end: SourceRange): SourceRange {
		return { start: start.start, end: end.end }
	}

	// --- Entry point ---

	walk(): Program {
		// Skip macro wrapper: tml! { ... } or jml! { ... }
		if (this.peek().kind === TokenKind.Tml || this.peek().kind === TokenKind.Jml) this.advance()
		if (this.peek().kind === TokenKind.OpenBrace) this.advance()

		const children = this.parseChildren()

		// Skip closing brace of macro wrapper.
		if (this.peek().kind === TokenKind.CloseBrace) this.advance()

		return {
			kind: NodeKind.Program,
			children,
			range: {
				start: children.length > 0 ? children[0].range.start : { offset: 0, line: 0, column: 0 },
				end: children.length > 0 ? children[children.length - 1].range.end : { offset: 0, line: 0, column: 0 },
			},
		}
	}

	// --- Children ---

	private parseChildren(): Node[] {
		const children: Node[] = []

		while (this.cursor < this.tokens.length) {
			const tok = this.peek()

			// Stop at closing tag, closing brace, or EOF.
			if (tok.kind === TokenKind.CloseTag) break
			if (tok.kind === TokenKind.CloseBrace) break
			if (tok.kind === TokenKind.EOF) break

			const node = this.parseNode()
			if (node) children.push(node)
		}

		return children
	}

	// --- Node dispatch ---

	private parseNode(): Node | null {
		const tok = this.peek()

		switch (tok.kind) {
			case TokenKind.OpenTag: return this.parseTag()
			case TokenKind.OpenBrace: return this.parseExpr()
			case TokenKind.At: return this.parseControlFlow()
			case TokenKind.Identifier: return this.parseText()
			default:
				this.advance()
				return null
		}
	}

	// --- Text ---

	private parseText(): Text {
		const start = this.peek()
		const parts: string[] = []

		while (this.cursor < this.tokens.length) {
			const tok = this.peek()
			if (tok.kind !== TokenKind.Identifier) break
			parts.push(tok.value!)
			this.advance()
		}

		const end = this.tokens[this.cursor - 1]
		return {
			kind: NodeKind.Text,
			value: parts.join(' '),
			range: this.makeRange(start.range, end.range),
		}
	}

	// --- Expression: { ... } ---

	private parseExpr(): Expr {
		const open = this.expect(TokenKind.OpenBrace)
		const parts: string[] = []
		let depth = 1

		while (this.cursor < this.tokens.length && depth > 0) {
			const tok = this.peek()

			if (tok.kind === TokenKind.OpenBrace) {
				depth++
				parts.push(tok.value!)
				this.advance()
				continue
			}

			if (tok.kind === TokenKind.CloseBrace) {
				depth--
				if (depth === 0) {
					this.advance()
					break
				}
				parts.push(tok.value!)
				this.advance()
				continue
			}

			parts.push(tok.value!)
			this.advance()
		}

		const close = this.tokens[this.cursor - 1]
		return {
			kind: NodeKind.Expr,
			value: parts.join(' '),
			range: this.makeRange(open.range, close.range),
		}
	}

	// --- Tag: <name attrs>children</name> or <name attrs /> ---

	private parseTag(): Tag | SelfClose {
		const lt = this.expect(TokenKind.OpenTag)
		const name = this.expect(TokenKind.Identifier).value!
		const attrs = this.parseAttrs()

		// Self-closing: <img />
		if (this.peek().kind === TokenKind.SelfClosingTag) {
			this.advance()
			return {
				kind: NodeKind.SelfClose,
				name,
				attrs,
				range: { start: lt.range.start, end: this.tokens[this.cursor - 1].range.end },
			}
		}

		// Opening: <div> ... </div>
		this.expect(TokenKind.TagEnd)
		const children = this.parseChildren()
		this.expect(TokenKind.CloseTag)
		this.expect(TokenKind.Identifier)
		this.expect(TokenKind.TagEnd)

		return {
			kind: NodeKind.Tag,
			name,
			attrs,
			children,
			range: { start: lt.range.start, end: this.tokens[this.cursor - 1].range.end },
		}
	}

	// --- Attributes ---

	private parseAttrs(): Attr[] {
		const attrs: Attr[] = []

		while (this.cursor < this.tokens.length) {
			const tok = this.peek()

			// Stop at > or />
			if (tok.kind === TokenKind.TagEnd || tok.kind === TokenKind.SelfClosingTag) break

			// Dot attribute: .tooltip={label}
			if (tok.kind === TokenKind.Dot) {
				this.advance()
				const nameTok = this.expect(TokenKind.Identifier)
				let value: Expr | Text | null = null

				if (this.peek().kind === TokenKind.Equals) {
					this.advance()
					value = this.peek().kind === TokenKind.OpenBrace ? this.parseExpr() : this.parseText()
				}

				attrs.push({
					kind: NodeKind.Attr,
					name: nameTok.value!,
					dot: true,
					value,
					range: this.makeRange(tok.range, value ? value.range : nameTok.range),
				})
				continue
			}

			// Regular attribute: class="foo" or name={expr}
			if (tok.kind === TokenKind.Identifier) {
				this.advance()
				let value: Expr | Text | null = null

				if (this.peek().kind === TokenKind.Equals) {
					this.advance()
					value = this.peek().kind === TokenKind.OpenBrace ? this.parseExpr() : this.parseText()
				}

				attrs.push({
					kind: NodeKind.Attr,
					name: tok.value!,
					dot: false,
					value,
					range: this.makeRange(tok.range, value ? value.range : tok.range),
				})
				continue
			}

			break
		}

		return attrs
	}

	// --- Control flow: @if(...) { } or @else { } ---

	private parseControlFlow(): If | Else | null {
		const at = this.expect(TokenKind.At)
		const name = this.expect(TokenKind.Identifier).value!

		if (name === 'if') {
			this.expect(TokenKind.OpenParen)
			const parts: string[] = []
			let depth = 1

			while (this.cursor < this.tokens.length && depth > 0) {
				const tok = this.peek()
				if (tok.kind === TokenKind.OpenParen) { depth++; parts.push(tok.value!); this.advance(); continue }
				if (tok.kind === TokenKind.CloseParen) { depth--; if (depth === 0) { this.advance(); break }; parts.push(tok.value!); this.advance(); continue }
				parts.push(tok.value!)
				this.advance()
			}

			this.expect(TokenKind.OpenBrace)
			const children = this.parseChildren()
			this.expect(TokenKind.CloseBrace)

			return {
				kind: NodeKind.If,
				condition: parts.join(' '),
				children,
				range: { start: at.range.start, end: this.tokens[this.cursor - 1].range.end },
			}
		}

		if (name === 'else') {
			this.expect(TokenKind.OpenBrace)
			const children = this.parseChildren()
			this.expect(TokenKind.CloseBrace)

			return {
				kind: NodeKind.Else,
				children,
				range: { start: at.range.start, end: this.tokens[this.cursor - 1].range.end },
			}
		}

		// Unknown trait — skip it. Parser will extend to handle more later.
		return null
	}
}

export function Parse(tokens: Token[]): Program {
	return new Parser(tokens).walk()
}
