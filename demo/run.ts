import { readFileSync, writeFileSync } from 'fs'
import { ExtractMacroBlocks } from '../src/extract/extract'
import { Tokenize } from '../src/lexer/tokenize'
import { TokenKind } from '../src/lexer/types'

const inputPath = process.argv[2]
const outputPath = process.argv[3] || 'demo/output.json'

if (!inputPath) {
	console.error('Usage: npx tsx demo/run.ts <input.jml> [output.json]')
	process.exit(1)
}

const source = readFileSync(inputPath, 'utf-8')
const chunks = ExtractMacroBlocks(source)

const result = chunks.map((chunk) => {
	const tokens = Tokenize(chunk)
	const realTokens = tokens.filter((t) => t.kind !== TokenKind.EOF)

	return {
		type: chunk.type,
		range: { start: chunk.start, end: chunk.end },
		content: chunk.content,
		tokens: realTokens.map((t) => ({
			kind: TokenKind[t.kind],
			value: t.value,
			range: t.range,
		})),
	}
})

writeFileSync(outputPath, JSON.stringify(result, null, 2))

console.log(`Extracted ${chunks.length} macro blocks from ${inputPath}`)
console.log()

for (const block of result) {
	console.log(`[${block.type}] ${block.range.start}..${block.range.end}`)
	console.log(`  ${block.tokens.length} tokens`)
	for (const tok of block.tokens) {
		const val = tok.value === null ? '' : ` ${tok.value}`
		console.log(`    ${tok.kind.padEnd(15)} ${tok.range.start.offset}..${tok.range.end.offset}${val}`)
	}
	console.log()
}
