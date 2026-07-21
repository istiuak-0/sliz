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
	Dot, // .

	Expression,

	EOF,
}

export interface SourcePosition {
	offset: number
	line: number
	column: number
}

export interface SourceRange {
	start: SourcePosition
	end: SourcePosition
}

export interface Token<Kind extends TokenKind = TokenKind> {
	kind: Kind
	value: string | null
	range: SourceRange
}
