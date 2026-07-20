export type TokenType =
  | "TAG"
  | "TRAIT"
  | "MACRO"
  | "STATIC"
  | "LAY"
  | "OF"
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "LBRACE"
  | "RBRACE"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "COLON"
  | "DOT"
  | "EQUALS"
  | "LT"
  | "GT"
  | "SLASH"
  | "AT"
  | "NEWLINE"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  offset: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  tag: "TAG",
  trait: "TRAIT",
  macro: "MACRO",
  static: "STATIC",
  lay: "LAY",
  of: "OF",
  true: "BOOLEAN",
  false: "BOOLEAN",
};
