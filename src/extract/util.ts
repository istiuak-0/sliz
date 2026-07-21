export type JmlBlockType = 'tag' | 'trait'

export interface JmlChunk {
	type: JmlBlockType
	content: string
}

const jmlKeywords: readonly string[] = ['tag', 'trait']

export function isJmlKeyword(word: string) {
	return jmlKeywords.includes(word)
}
