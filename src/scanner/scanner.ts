import { SourceState } from "./type"

export function ScanSource(Source: string) {

   const State: SourceState = {
      Cursor: 0,
      Mode: 'HOST',
      IsInString: null,
      ParenDepth: 0,
      Chunks: []
   }

   while (State.Cursor < Source.length) {
      const char = Source[State.Cursor]


      // 1. HANDLE STRINGS
      if (State.IsInString !== null) {
         if (State.IsInString === char) {
            State.IsInString = null // String closed
         }
         State.Cursor++
         continue
      }

      // 2. DETECT STRING START
      if (char === '"' || char === "'" || char === "`") {
         State.IsInString = char
         State.Cursor++
         continue
      }



      // 3. HANDLE LINE COMMENTS
      if (char === '/' && Source[State.Cursor + 1] === '/') {
         State.Cursor += 2 // Skip the "//"

         // Eagerly consume everything until newline or EOF
         while (State.Cursor < Source.length && Source[State.Cursor] !== '\n') {
            State.Cursor++
         }
         continue
      }

      // 4. HANDLE BLOCK COMMENTS
      if (char === '/' && Source[State.Cursor + 1] === '*') {
         State.Cursor += 2 // Skip the "/*"

         while (State.Cursor < Source.length) {
            if (Source[State.Cursor] === '*' && Source[State.Cursor + 1] === '/') {
               State.Cursor += 2 // Skip the "*/"
               break // Exit the inner loop, comment is done
            }
            State.Cursor++
         }
         continue
      }









      State.Cursor++
   }

}