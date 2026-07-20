import type { Program } from "../ast/types.js";
import type { Token } from "./tokens.js";

export function parse(tokens: Token[]): Program {
  // TODO: implement parser
  return { type: "Program", body: [] };
}
