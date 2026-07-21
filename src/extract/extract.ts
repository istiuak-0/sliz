import { CharCodes } from '../utils/ascii.code'
import { IsIdentifierStart } from '../utils/checks'
import { isWordBoundary, skipBalanced, skipIdentifier, skipOpaqueToken, skipWhiteSpace } from '../utils/common'
import { isJmlKeyword, JmlBlockType, JmlChunk } from './util'

export function extractJmlBlocks(source: string) {
	const chunks: JmlChunk[] = []
	let position = 0

	while (position < source.length) {
		const afterOpaque = skipOpaqueToken(source, position)

		if (afterOpaque !== null) {
			position = afterOpaque
			continue
		}

		if (IsIdentifierStart(source.charCodeAt(position))) {
			const wordEnd = skipIdentifier(source, position)
			const word = source.slice(position, wordEnd) as JmlBlockType

			if (isJmlKeyword(word) && isWordBoundary(source, wordEnd)) {
				const chunk = tryExtractJmlBlock(source, position, wordEnd, word)

				if (chunk) {
					chunks.push(chunk)
					position = chunk.end
					continue
				}
			}
			position = wordEnd
			continue
		}

		position++
	}

	return chunks
}

function tryExtractJmlBlock(source: string, keywordStart: number, afterKeyword: number, blockType: JmlBlockType): JmlChunk | null {
	let position = skipWhiteSpace(source, afterKeyword)

	if (!IsIdentifierStart(source.charCodeAt(position))) {
		return null
	}
	position = skipIdentifier(source, position)
	position = skipWhiteSpace(source, position)

	if (source.charCodeAt(position) !== CharCodes.OpenParen) {
		return null
	}

	const afterParams = skipBalanced(source, position, CharCodes.OpenParen, CharCodes.CloseParen)

	if (afterParams === null) {
		return null
	}

	position = skipWhiteSpace(source, afterParams)

	if (source.charCodeAt(position) !== CharCodes.OpenBrace) {
		return null
	}

	const afterBody = skipBalanced(source, position, CharCodes.OpenBrace, CharCodes.CloseBrace)

	if (afterBody === null) {
		return null
	}

	return {
		type: blockType,
		content: source.slice(keywordStart, afterBody),
		start: keywordStart,
		end: afterBody,
	}
}
