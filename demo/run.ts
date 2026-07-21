import { readFileSync, writeFileSync } from 'fs'
import { ExtractMacroBlocks } from '../src/extract/extract'
import { Tokenize } from '../src/lexer/tokenize'
import { TokenKind } from '../src/lexer/types'
import { Parse } from '../src/parser/parse'
import { NodeKind } from '../src/parser/types'

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
	const ast = Parse(tokens)

	return {
		type: chunk.type,
		sourceRange: { start: chunk.start, end: chunk.end },
		content: chunk.content,
		ast,
	}
})

writeFileSync(outputPath, JSON.stringify(result, null, 2))

console.log(`Extracted ${chunks.length} macro blocks from ${inputPath}`)
console.log()

function printNode(node: any, indent: number) {
	const pad = '  '.repeat(indent)

	switch (node.kind) {
		case NodeKind.Program:
			for (const child of node.children) printNode(child, indent)
			break
		case NodeKind.Text:
			console.log(`${pad}Text: ${JSON.stringify(node.value)}`)
			break
		case NodeKind.Expr:
			console.log(`${pad}Expr: {${node.value}}`)
			break
		case NodeKind.Tag:
			console.log(`${pad}<${node.name}>`)
			for (const attr of node.attrs) printNode(attr, indent + 1)
			for (const child of node.children) printNode(child, indent + 1)
			console.log(`${pad}</${node.name}>`)
			break
		case NodeKind.SelfClose:
			console.log(`${pad}<${node.name} />`)
			for (const attr of node.attrs) printNode(attr, indent + 1)
			break
		case NodeKind.Attr:
			const dot = node.dot ? '.' : ''
			if (node.value) {
				console.log(`${pad}${dot}${node.name} = ${node.value.kind === NodeKind.Expr ? '{' + node.value.value + '}' : JSON.stringify(node.value.value)}`)
			} else {
				console.log(`${pad}${dot}${node.name}`)
			}
			break
		case NodeKind.If:
			console.log(`${pad}@if(${node.condition})`)
			for (const child of node.children) printNode(child, indent + 1)
			break
		case NodeKind.Else:
			console.log(`${pad}@else`)
			for (const child of node.children) printNode(child, indent + 1)
			break
	}
}

for (const block of result) {
	console.log(`[${block.type}] ${block.sourceRange.start}..${block.sourceRange.end}`)
	printNode(block.ast, 1)
	console.log()
}
