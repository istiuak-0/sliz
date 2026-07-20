export const CharCodes = {
	// ==>> Whitespace
	Space: 32, // ' '
	Tab: 9, // '\t'
	LineFeed: 10, // '\n'
	CarriageReturn: 13, // '\r'

	// ==>> Quotes
	SingleQuote: 39, // "'"
	DoubleQuote: 34, // '"'
	Backtick: 96, // '`'

	// ==>> Grouping
	OpenParen: 40, // '('
	CloseParen: 41, // ')'
	OpenBracket: 91, // '['
	CloseBracket: 93, // ']'
	OpenBrace: 123, // '{'
	CloseBrace: 125, // '}'

	// ==>> Operators
	Plus: 43, // '+'
	Minus: 45, // '-'
	Asterisk: 42, // '*'
	Slash: 47, // '/'
	Percent: 37, // '%'
	Equals: 61, // '='
	LessThan: 60, // '<'
	GreaterThan: 62, // '>'
	Ampersand: 38, // '&'
	Pipe: 124, // '|'
	Caret: 94, // '^'
	ExclamationMark: 33, // '!'
	QuestionMark: 63, // '?'

	// ==>> Punctuation
	Dot: 46, // '.'
	Comma: 44, // ','
	Colon: 58, // ':'
	Semicolon: 59, // ';'
	AtSign: 64, // '@'
	Hash: 35, // '#'
	DollarSign: 36, // '$'
	Underscore: 95, // '_'
	Backslash: 92, // '\\'

	// ==>> Digits
	Zero: 48, // '0'
	Nine: 57, // '9'

	// ==>> Letters
	UpperA: 65, // 'A'
	UpperZ: 90, // 'Z'
	LowerA: 97, // 'a'
	LowerZ: 122, // 'z'
} as const
