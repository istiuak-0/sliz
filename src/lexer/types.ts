export enum TokenType {
  Tag,
  Identifier,
  OpenParen,
  CloseParen,
  OpenBrace,
  CloseBrace,
  HtmlChunk,
  EOF,
}

export const Keywords: Record<string, TokenType> = {
  "tag": TokenType.Tag,
  "(": TokenType.OpenParen,
  ")": TokenType.CloseParen,
  "{": TokenType.OpenParen,
  "}": TokenType.CloseParen,
};
