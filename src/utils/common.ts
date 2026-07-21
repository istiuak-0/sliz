import { CharCodes } from './ascii.code'
import { IsAlpha, IsIdentifierPart, IsQuote, IsWhiteSpace } from './checks'

// ===>> Skip individual tokens
//
// When scanning source code, we need to find macro keywords like `tml!` and
// matching `{ }` braces. The problem is that strings, comments, and regex
// literals can contain *any* characters — including `{`, `}`, and text that
// looks like `tml!`. But those characters are just data, not real syntax.
//
// Instead of parsing their contents char-by-char, we detect where one starts
// and jump straight to where it ends. This is both simpler and correct — we
// never accidentally treat a `}` inside a string as the end of a brace block.

/**
 * Skips a string literal. Starts at the opening quote, handles `\` escapes
 * (the next char after `\` is always part of the string, even if it's a quote),
 * and ends at the matching closing quote.
 */
export function SkipString(source: string, start: number) {
	const quoteCode = source.charCodeAt(start)
	let position = start + 1

	while (position < source.length) {
		const code = source.charCodeAt(position)
		if (code === CharCodes.Backslash) {
			position += 2
		} else if (code === quoteCode) {
			return position + 1
		} else {
			position++
		}
	}

	return position
}

/**
 * Skips a line comment (`// ...`). Everything from `//` to the end of the line
 * is ignored. The comment ends at (but does not consume) the newline character.
 */
export function SkipLineComment(source: string, start: number) {
	let position = start + 2
	while (position < source.length && source.charCodeAt(position) !== CharCodes.LineFeed) {
		position++
	}

	return position
}

/**
 * Skips a block comment (`/* ... * /`). Block comments do NOT nest in JS
 * the first `*/` encountered closes the comment, even if there's a `/*` inside.
 * If the comment is never closed, we return the end of the source.
 */
export function SkipBlockComment(source: string, start: number) {
	let position = start + 2
	while (position < source.length) {
		if (source.charCodeAt(position) === CharCodes.Asterisk && source.charCodeAt(position + 1) === CharCodes.Slash) {
			return position + 2
		}

		position++
	}

	return position
}

/**
 * Determines if a `/` at `position` starts a regex literal or is division.
 *
 * In JS, `/` is ambiguous — it can be a regex delimiter or a division operator.
 * The disambiguation depends on what comes before: after `=`, `(`, `{`, `,`,
 * `;`, `!`, etc., `/` starts a regex. After a value like `)` or an identifier,
 * it's division.
 *
 * We skip backwards past whitespace, then check the preceding character.
 * `<` and `>` are intentionally excluded so `</tag>` (JSX closing tag)
 * is never mistaken for division-then-regex.
 */
export function IsRegexStart(source: string, position: number) {
	let localPosition = position - 1

	while (localPosition >= 0 && IsWhiteSpace(source.charCodeAt(localPosition))) {
		localPosition--
	}

	if (localPosition < 0) {
		return true // start of source
	}

	switch (source.charCodeAt(localPosition)) {
		case CharCodes.Equals:
		case CharCodes.OpenParen:
		case CharCodes.OpenBracket:
		case CharCodes.OpenBrace:
		case CharCodes.Semicolon:
		case CharCodes.Comma:
		case CharCodes.ExclamationMark:
		case CharCodes.Ampersand:
		case CharCodes.Pipe:
		case CharCodes.QuestionMark:
		case CharCodes.Caret:
		case CharCodes.Plus:
		case CharCodes.Minus:
		case CharCodes.Percent:
		case CharCodes.Asterisk:
		case CharCodes.Colon:
			return true
		default:
			return false
	}
}

/**
 * Skips a regex literal starting at the opening `/`.
 *
 * Key rules:
 * - `\` escapes the next character (so `\/` doesn't end the regex)
 * - A newline without a preceding `\` means the regex is unterminated
 * - `[...]` is a character class — `/` inside doesn't end the regex
 * - After the closing `/`, regex flags (like `gi`) are part of the token
 */
export function SkipRegex(source: string, start: number) {
	let position = start + 1
	let inCharClass = false

	while (position < source.length) {
		const code = source.charCodeAt(position)

		if (code === CharCodes.Backslash) {
			position += 2
			continue
		}

		if (code === CharCodes.LineFeed) {
			return start + 1
		}

		if (code === CharCodes.OpenBracket) {
			inCharClass = true
		}

		if (code === CharCodes.CloseBracket) {
			inCharClass = false
		}

		if (code === CharCodes.Slash && !inCharClass) {
			position++
			while (position < source.length && IsAlpha(source.charCodeAt(position))) {
				position++
			}

			return position
		}

		position++
	}

	return position
}


// ===>> Balanced delimiters, e.g. (...) or {...}

/**
 * Starting *at* an opening delimiter, returns the position just after its
 * matching closing delimiter, or `null` if it's never closed.
 *
 * This is the core mechanism for finding the body of a macro: once we see
 * `tml! {`, we call `SkipBalanced` on the `{` to find its matching `}`.
 *
 * The tricky part: the body can contain strings, comments, and regex that
 * themselves contain `{` or `}`. So we skip over those, ensuring we only
 * count braces that are actual code.
 */
export function SkipBalanced(source: string, start: number, openCode: number, closeCode: number) {
	let position = start + 1
	let depth = 1

	while (position < source.length && depth > 0) {
		const code = source.charCodeAt(position)

		// Skip string literals content inside quotes is just data.
		if (IsQuote(code)) {
			position = SkipString(source, position)
			continue
		}

		// `/` can start a line comment, block comment, or regex literal.
		if (code === CharCodes.Slash) {
			const next = source.charCodeAt(position + 1)

			if (next === CharCodes.Slash) {
				position = SkipLineComment(source, position)
				continue
			}

			if (next === CharCodes.Asterisk) {
				position = SkipBlockComment(source, position)
				continue
			}

			if (IsRegexStart(source, position)) {
				position = SkipRegex(source, position)
				continue
			}
		}

		if (code === openCode) {
			depth++
		} else if (code === closeCode) {
			depth--
		}
		position++
	}

	return depth === 0 ? position : null
}

// ===>> Whitespace / identifiers

export function SkipWhiteSpace(source: string, position: number): number {
	while (position < source.length && IsWhiteSpace(source.charCodeAt(position))) {
		position++
	}
	return position
}

export function SkipIdentifier(source: string, position: number): number {
	while (position < source.length && IsIdentifierPart(source.charCodeAt(position))) {
		position++
	}
	return position
}
