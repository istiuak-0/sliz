import { tokenize } from "./parser/lexer.js";
import { parse } from "./parser/index.js";
import { transform } from "./transform/index.js";
import { generate } from "./codegen/index.js";

export function compile(source: string): string {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const transformed = transform(ast);
  return generate(transformed);
}

export type {
  Program,
  TagDeclaration,
  TraitDeclaration,
  MacroDeclaration,
  LayDeclaration,
  Parameter,
  Block,
  Element,
  Text,
  Interpolation,
  MacroInvocation,
  TraitBinding,
  Attribute,
  Expression,
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  MemberExpression,
  CallExpression,
  SourceLocation,
  SourceSpan,
  NodeType,
  BaseNode,
  TopLevelDeclaration,
  Statement,
} from "./ast/types.js";

export type { Token, TokenType } from "./parser/tokens.js";
export { tokenize } from "./parser/lexer.js";
export { parse } from "./parser/index.js";
export { transform } from "./transform/index.js";
export { generate } from "./codegen/index.js";
