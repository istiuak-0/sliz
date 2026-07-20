import { SourceState } from "./type";

export function ScanSource(Source: string) {
   const State: SourceState = {
      Cursor: 0,
      Mode: "HOST",
      ParenDepth: 0,
      Chunks: [],
      ChunkStart: 0,
   };

   while (State.Cursor < Source.length) {
      const char = Source[State.Cursor];

      // 1. EAGERLY SKIP STRINGS
      if (char === '"' || char === "'" || char === "`") {
         const quoteType = char;
         State.Cursor++;

         while (State.Cursor < Source.length) {
            const innerChar = Source[State.Cursor];

            // A. Handle Escape Characters (\)
            if (innerChar === "\\") {
               State.Cursor += 2;
               continue;
            }

            // B. Handle Closing Quote
            if (innerChar === quoteType) {
               State.Cursor++;
               break;
            }

            State.Cursor++;
         }

         continue;
      }

      // 2. HANDLE LINE COMMENTS
      if (char === "/" && Source[State.Cursor + 1] === "/") {
         State.Cursor += 2;

         // Eagerly consume everything until newline or EOF
         while (State.Cursor < Source.length && Source[State.Cursor] !== "\n") {
            State.Cursor++;
         }
         continue;
      }

      // 4. HANDLE BLOCK COMMENTS
      if (char === "/" && Source[State.Cursor + 1] === "*") {
         State.Cursor += 2;

         while (State.Cursor < Source.length) {
            if (Source[State.Cursor] === "*" && Source[State.Cursor + 1] === "/") {
               State.Cursor += 2;
               break;
            }
            State.Cursor++;
         }
         continue;
      }



      /// Handle Keywords




      State.Cursor++;
   }
}
