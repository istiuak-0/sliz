import { readFileSync, writeFileSync } from 'fs'
import { extractJmlBlocks } from '../src/extract/extract'

const inputPath = process.argv[2]
const outputPath = process.argv[3] || 'demo/output.json'

if (!inputPath) {
	console.error('Usage: npx tsx demo/run.ts <input.jml> [output.json]')
	process.exit(1)
}

const source = readFileSync(inputPath, 'utf-8')
const chunks = extractJmlBlocks(source)

const result = {
	source: inputPath,
	totalChunks: chunks.length,
	chunks: chunks.map((c) => ({
		type: c.type,
		start: c.start,
		end: c.end,
		length: c.end - c.start,
		content: c.content,
	})),
	reconstructed: reconstruct(source, chunks),
}

writeFileSync(outputPath, JSON.stringify(result, null, 2))

console.log(`Extracted ${chunks.length} blocks from ${inputPath}`)
console.log(`Output written to ${outputPath}`)
console.log()

for (const chunk of chunks) {
	console.log(`[${chunk.type}] ${chunk.start}..${chunk.end} (${chunk.end - chunk.start} chars)`)
	console.log(chunk.content.slice(0, 80) + (chunk.content.length > 80 ? '...' : ''))
	console.log()
}

function reconstruct(src: string, blocks: typeof chunks) {
	let result = ''
	let cursor = 0

	for (const block of blocks) {
		result += src.slice(cursor, block.start)
		result += `/* [JML_${block.type.toUpperCase()}: replaced] */`
		cursor = block.end
	}

	result += src.slice(cursor)
	return result
}
