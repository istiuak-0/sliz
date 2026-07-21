import { CharCodes } from './ascii.code'
import { IsAlpha, IsIdentifierPart, IsQuote, IsWhiteSpace } from './checks'

// ===>> Opaque tokens: strings, comments, regex
//
// These three constructs can contain *any* characters, including ones that
// look like the syntax we care about (quotes, braces, parens). So instead
// of looking at their contents char-by-char, we detect where one starts and
// jump straight to where it ends.

/**
 * If `position` is the start of a string, comment, or regex literal, returns the
 * position just after it ends. Otherwise returns `null` — meaning "this is
 * ordinary code, look at it one character at a time."
 */
export function skipOpaqueToken(source: string, position: number) {
	const code = source.charCodeAt(position)

	if (IsQuote(code)) {
		return skipString(source, position)
	}

	if (code === CharCodes.Slash) {
		const next = source.charCodeAt(position + 1)

		if (next === CharCodes.Slash) {
			return skipLineComment(source, position)
		}

		if (next === CharCodes.Asterisk) {
			return skipBlockComments(source, position)
		}

		if (isRegexStart(source, position)) {
			return skipRegex(source, position)
		}
	}

	return null
}

function skipString(source: string, start: number) {
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

function skipLineComment(source: string, start: number) {
	let position = start + 2
	while (position < source.length && source.charCodeAt(position) !== CharCodes.LineFeed) {
		position++
	}

	return position
}

function skipBlockComments(source: string, start: number) {
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
 * Heuristic Approach::
 *
 * a `/` starts a regex literal if the previous meaningful character is one of `= ( [ { ; , ! & | ? ^ + - % *  :`
 * or if  its the very start of the source. `<` and  `>` are intentionally skipped.
 * so </tag> (a Jsx Closing tag) is never mistaken for division-then-regex
 *
 */
function isRegexStart(source: string, position: number) {
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

function skipRegex(source: string, start: number) {
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
 * matching closing delimiter, or `null` if it's never closed. Uses
 * `skipOpaqueToken` so a `)` or `}` inside a string/comment/regex can never
 * be mistaken for the real thing.
 */

export function skipBalanced(source: string, start: number, openCode: number, closeCode: number) {
	let position = start + 1
	let depth = 1

	while (position < source.length && depth > 0) {
		const afterOpaque = skipOpaqueToken(source, position)
		if (afterOpaque !== null) {
			position = afterOpaque
			continue
		}

		const code = source.charCodeAt(position)
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

export function skipWhiteSpace(source: string, position: number): number {
	while (position < source.length && IsWhiteSpace(source.charCodeAt(position))) {
		position++
	}
	return position
}

export function skipIdentifier(source: string, position: number): number {
	while (position < source.length && IsIdentifierPart(source.charCodeAt(position))) {
		position++
	}
	return position
}

/** True if `pos` is whitespace or end-of-source — i.e. a word ends cleanly here. */
export function isWordBoundary(source: string, position: number): boolean {
	return position >= source.length || IsWhiteSpace(source.charCodeAt(position))
}
