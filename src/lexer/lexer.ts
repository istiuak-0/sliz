export function Tokenize(source: string) {
  let cursor = 0;
  const tokens = [];

  while (cursor < source.length) {
    console.log(source[cursor]);

    cursor++;
  }
  console.log("EOF");
}
