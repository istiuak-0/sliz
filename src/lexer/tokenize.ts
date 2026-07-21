import { MacroChunk, Macros } from '../extract/util'
import { CharCodes } from '../utils/ascii.code'
import { IsIdentifierPart, IsIdentifierStart } from '../utils/checks'
import { SkipWhiteSpace } from '../utils/common'
import { Token, TokenKind } from './types'

export function Tokenize(chunk: MacroChunk) {
	let cursor = 0
	const tokens: Token[] = []

	while (cursor < chunk.content.length) {
		cursor = SkipWhiteSpace(chunk.content, cursor)

		if (cursor >= chunk.content.length) {
			break
		}

		const start = cursor
		const code = chunk.content.charCodeAt(cursor)

		// tml!
		if (code === CharCodes.LowerT && chunk.content.startsWith('tml!', cursor)) {
			cursor += 4

			tokens.push({
				kind: TokenKind.Tml,
				value: 'tml!',
				range: {
					start: {
						offset: start,
						line: 0,
						column: start,
					},
					end: {
						offset: cursor,
						line: 0,
						column: cursor,
					},
				},
			})

			continue
		}

		// jml!
		if (code === CharCodes.LowerJ && chunk.content.startsWith('jml!', cursor)) {
			cursor += 4

			tokens.push({
				kind: TokenKind.Jml,
				value: 'jml!',
				range: {
					start: {
						offset: start,
						line: 0,
						column: start,
					},
					end: {
						offset: cursor,
						line: 0,
						column: cursor,
					},
				},
			})

			continue
		}

		// </
		if (code === CharCodes.LessThan && chunk.content.charCodeAt(cursor + 1) === CharCodes.Slash) {
			cursor += 2

			tokens.push({
				kind: TokenKind.CloseTag,
				value: '</',
				range: {
					start: {
						offset: start,
						line: 0,
						column: start,
					},
					end: {
						offset: cursor,
						line: 0,
						column: cursor,
					},
				},
			})

			continue
		}

		// />
		if (code === CharCodes.Slash && chunk.content.charCodeAt(cursor + 1) === CharCodes.GreaterThan) {
			cursor += 2

			tokens.push({
				kind: TokenKind.SelfClosingTag,
				value: '/>',
				range: {
					start: {
						offset: start,
						line: 0,
						column: start,
					},
					end: {
						offset: cursor,
						line: 0,
						column: cursor,
					},
				},
			})

			continue
		}

		let kind: TokenKind | undefined

		switch (code) {
			case CharCodes.AtSign:
				kind = TokenKind.At
				break

			case CharCodes.LessThan:
				kind = TokenKind.OpenTag
				break

			case CharCodes.GreaterThan:
				kind = TokenKind.TagEnd
				break

			case CharCodes.OpenBrace:
				kind = TokenKind.OpenBrace
				break

			case CharCodes.CloseBrace:
				kind = TokenKind.CloseBrace
				break

			case CharCodes.OpenParen:
				kind = TokenKind.OpenParen
				break

			case CharCodes.CloseParen:
				kind = TokenKind.CloseParen
				break

			case CharCodes.Equals:
				kind = TokenKind.Equals
				break
		}

		if (kind !== undefined) {
			cursor++

			tokens.push({
				kind,
				value: chunk.content.slice(start, cursor),
				range: {
					start: {
						offset: start,
						line: 0,
						column: start,
					},
					end: {
						offset: cursor,
						line: 0,
						column: cursor,
					},
				},
			})

			continue
		}

		// Identifier
		if (IsIdentifierStart(code)) {
			cursor++

			while (cursor < chunk.content.length && IsIdentifierPart(chunk.content.charCodeAt(cursor))) {
				cursor++
			}

			tokens.push({
				kind: TokenKind.Identifier,
				value: chunk.content.slice(start, cursor),
				range: {
					start: {
						offset: start,
						line: 0,
						column: start,
					},
					end: {
						offset: cursor,
						line: 0,
						column: cursor,
					},
				},
			})

			continue
		}

		cursor++
	}

	tokens.push({
		kind: TokenKind.EOF,
		value: null,
		range: {
			start: {
				offset: cursor,
				line: 0,
				column: cursor,
			},
			end: {
				offset: cursor,
				line: 0,
				column: cursor,
			},
		},
	})

	return tokens
}
