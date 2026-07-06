import { Tokenize } from "./tokenize"

export function Compile(content: string): string {

  Tokenize(content)

  return content
}

