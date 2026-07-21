export type MacroChunkType = 'tml' | 'jml'

/**
 * A single extracted macro block with its type, full content, and byte positions.
 * `start` and `end` are absolute offsets into the source string, enabling
 * surgical replacement without disturbing surrounding code.
 */
export interface MacroChunk {
	type: MacroChunkType
	content: string
	start: number
	end: number
}

/**
 * All known macro keywords. The `!` is part of the keyword — `tml!` and `jml!`
 * are the complete tokens, not `tml` + `!` as separate pieces.
 */
export const Macros = [
	{ keyword: 'tml!', type: 'tml' },
	{ keyword: 'jml!', type: 'jml' },
] as const
