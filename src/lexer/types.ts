export enum TokenKind {
	Tml,
	Jml,
	// Control
	At, //@
	Identifier,

	Text,
	StringLiteral,

	OpenTag, // <
	CloseTag, // </
	TagEnd, // >
	SelfClosingTag, // />

	OpenBrace, // {
	CloseBrace, // }
	OpenParen, // (
	CloseParen, // )

	Equals, // =

	Expression,

	EOF,
}

interface SourcePosition {
	offset: number
	line: number
	column: number
}

interface SourceRange {
	start: SourcePosition
	end: SourcePosition
}

export interface Token<Kind extends TokenKind = TokenKind> {
	kind: Kind
	value: string | null
	range: SourceRange
}
