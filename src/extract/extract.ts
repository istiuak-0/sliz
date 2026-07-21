import { CharCodes } from '../utils/ascii.code'
import { IsIdentifierStart } from '../utils/checks'
import { isWordBoundary, skipBalanced, skipIdentifier, skipOpaqueToken, skipWhiteSpace } from '../utils/common'
import { isJmlKeyword, JmlBlockType, JmlChunk } from './util'

/**
 *
 * Finds every Jml Blocks:
 * `tag Name(...) { ... }`
 * `trait Name(...) { ... }`
 *
 * Within a Source. And Skip Everything Else.
 */
export function ExtractJmlBlocks(source: string) {
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
            const block = tryExtractJmlBlock({
               source,
               keywordStart: position,
               afterKeyword: wordEnd,
               blockType: word,
            })

            if (block) {
               chunks.push(block.chunk)
               position = block.end
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

function tryExtractJmlBlock(input: {
   source: string
   keywordStart: number
   afterKeyword: number
   blockType: JmlBlockType
}): {
   chunk: JmlChunk
   end: number
} | null {


   const { source, afterKeyword, blockType, keywordStart } = input
   let position = skipWhiteSpace(source, afterKeyword)

   // Component name, e.g. `MyButton`
   if (!IsIdentifierStart(source.charCodeAt(position))) {
      return null
   }
   position = skipIdentifier(source, position)
   position = skipWhiteSpace(source, position)


   // Parameter list, e.g. `(props)`
   if (source.charCodeAt(position) !== CharCodes.OpenParen) {
      return null
   }

   const afterParams = skipBalanced(source, position, CharCodes.OpenParen, CharCodes.CloseParen)


   if (afterParams === null) {
      return null
   }

   position = skipWhiteSpace(source, afterParams)


   // Body, e.g. `{ ... }`

   if (source.charCodeAt(position) !== CharCodes.OpenBrace) {
      return null
   }
   const afterBody = skipBalanced(source, position, CharCodes.OpenBrace, CharCodes.CloseBrace)
   if (afterBody === null) {
      return null
   }



   return {
      chunk: { type: blockType, content: source.slice(keywordStart, afterBody) },
      end: afterBody,


   }
}
