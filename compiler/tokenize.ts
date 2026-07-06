export function Tokenize(content: string) {

   let cursor = 0
   const tokens = []

   while (cursor < content.length) {

      const char = content[cursor]


      if (content[cursor] === 'c' && content.startsWith('component', cursor)) {
         console.log('Found Components Definition At', cursor);


      }


      cursor++
   }




}

