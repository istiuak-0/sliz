import { CharCodes } from '../utils/ascii.code'
import { IsIdentifierPart, IsIdentifierStart, IsQuote, IsWhiteSpace } from '../utils/checks'
import { Chunk } from './type'
export class SourceScanner {
	private source: string
	private cursor: number = 0
	private chunks: Chunk[] = []

	constructor(source: string) {
		this.source = source
	}

	//==>> Entry Point
	public scan(): Chunk[] {
		while (this.cursor < this.source.length) {
			const code = this.source.charCodeAt(this.cursor)
			// 1. Eagerly skip strings
			if (IsQuote(code)) {
				this.skipString()
				continue
			}

			// 2. Eagerly skip comments
			if (this.isLineCommentStart()) {
				this.skipLineComment()
				continue
			}
			if (this.isBlockCommentStart()) {
				this.skipBlockComment()
				continue
			}

			// 3. Find Jml Code Blocks
			if (IsIdentifierStart(code)) {
				const word = this.extractWord()
				if (word === 'tag') {
					const nextCode = this.source.charCodeAt(this.cursor)

					// Boundary check: next char must be whitespace to be a valid declaration
					if (IsWhiteSpace(nextCode)) {
						// SUCCESS! We found a valid "tag" trigger.
						// (This is where we will hook in Phase 2 next)
						console.log("Valid 'tag' trigger found at index:", this.cursor - word.length)
					}
				}
				continue
			}
		}

		return this.chunks
	}

	/// ===>> Internal Utils

	private skipString() {
		const quoteCode = this.source.charCodeAt(this.cursor)
		this.cursor++ // Move past opening quote

		while (this.cursor < this.source.length) {
			const innerCode = this.source.charCodeAt(this.cursor)

			// A. Handle Escape Characters (\)
			if (innerCode === CharCodes.Backslash) {
				this.cursor += 2
				continue
			}

			// B. Handle Closing Quote
			if (innerCode === quoteCode) {
				this.cursor++
				break
			}

			this.cursor++
		}
	}

	private isLineCommentStart() {
		return this.source.charCodeAt(this.cursor) === CharCodes.Slash && this.source.charCodeAt(this.cursor + 1) === CharCodes.Slash
	}

	private skipLineComment() {
		this.cursor += 2 // Skip "//"

		// Eagerly consume everything until newline or EOF
		while (this.cursor < this.source.length && this.source.charCodeAt(this.cursor) !== CharCodes.LineFeed) {
			this.cursor++
		}
	}

	private isBlockCommentStart() {
		return this.source.charCodeAt(this.cursor) === CharCodes.Slash && this.source.charCodeAt(this.cursor + 1) === CharCodes.Asterisk
	}

	private skipBlockComment() {
		this.cursor += 2 // Skip "/*"
		while (this.cursor < this.source.length) {
			if (this.source.charCodeAt(this.cursor) === CharCodes.Asterisk && this.source.charCodeAt(this.cursor + 1) === CharCodes.Slash) {
				this.cursor += 2 // Skip "*/"
				break
			}
			this.cursor++
		}
	}

	private extractWord() {
		let word = ''

		while (this.cursor < this.source.length && IsIdentifierPart(this.source.charCodeAt(this.cursor))) {
			word += this.source[this.cursor]
			this.cursor++
		}

		return word
	}
}
