import { CharCodes } from '../utils/ascii.code'
import { IsIdentifierStart, IsQuote } from '../utils/checks'
import { IsRegexStart, SkipBalanced, SkipBlockComment, SkipIdentifier, SkipLineComment, SkipRegex, SkipString, SkipWhiteSpace } from '../utils/common'
import { Macros, type MacroChunk, type MacroChunkType } from './util'

/**
 * Extracts all `tml!` and `jml!` macro blocks from a JavaScript/TypeScript source string.
 *
 * Theory: Macros can appear anywhere in JS assignments, object properties, return
 * statements, arrays, ternaries, etc. The extractor walks the source and looks for
 * identifiers matching a macro keyword (`tml!` or `jml!`) followed by a `{ ... }` body.
 *
 * The tricky part is that strings, comments, and regex literals can contain characters
 * that look exactly like macro syntax (`tml!`, `{`, `}`). So before inspecting any
 * character, we first check if we're inside one of these "opaque" constructs and skip
 * over it entirely. This prevents false matches like `"tml! { <div /> }"` or `// tml! { ... }`.
 *
 * Once a macro keyword is found, we verify the next non-whitespace character is `{`,
 * then find the matching closing `}` (also skipping opaque tokens inside the body).
 *
 * Returns an array of chunks with precise `start`/`end` byte positions, enabling
 * surgical replacement of just the macro blocks while leaving host JS untouched.
 */
export function ExtractMacroBlocks(source: string) {
	const chunks: MacroChunk[] = []
	let position = 0

	while (position < source.length) {
		const code = source.charCodeAt(position)

		// Skip string literals, content inside quotes is just data.
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

		// We're at ordinary code. Check if this character starts a macro keyword
		// (macros always start with a letter: `t` for tml, `j` for jml).
		if (IsIdentifierStart(code)) {
			const macro = Macros.find((m) => source.startsWith(m.keyword, position))

			if (macro) {
				const chunk = TryExtractMacroBlock(source, position, position + macro.keyword.length, macro.type)

				if (chunk) {
					chunks.push(chunk)
					position = chunk.end
					continue
				}
			}

			// Not a macro skip past this identifier so we don't re-examine it.
			position = SkipIdentifier(source, position)
			continue
		}

		position++
	}

	return chunks
}

/**
 * Attempts to extract a single macro block starting after the keyword.
 *
 * After the keyword (`tml!` or `jml!`), there may be whitespace before `{`.
 * We skip that whitespace, then verify the next char is `{`. If not — the macro
 * is malformed (e.g. `tml!;` or `tml!foo`), so we bail out.
 *
 * Once `{` is confirmed, `SkipBalanced` counts matching braces while respecting
 * strings, comments, and regex inside the body, giving us the position just after
 * the closing `}`.
 */
function TryExtractMacroBlock(source: string, macroStart: number, afterKeyword: number, type: MacroChunkType): MacroChunk | null {
	const position = SkipWhiteSpace(source, afterKeyword)

	// No `{` after the keyword, not a valid macro block.
	if (source.charCodeAt(position) !== CharCodes.OpenBrace) {
		return null
	}

	// Find the matching `}`, skipping any strings/comments/regex inside the body.
	const afterBody = SkipBalanced(source, position, CharCodes.OpenBrace, CharCodes.CloseBrace)

	if (afterBody === null) {
		return null
	}

	return {
		type,
		content: source.slice(macroStart, afterBody),
		start: macroStart,
		end: afterBody,
	}
}
