export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface SourceSpan {
  start: SourceLocation;
  end: SourceLocation;
}

export type NodeType =
  | "Program"
  | "TagDeclaration"
  | "TraitDeclaration"
  | "MacroDeclaration"
  | "LayDeclaration"
  | "Parameter"
  | "Block"
  | "Element"
  | "Text"
  | "Interpolation"
  | "MacroInvocation"
  | "TraitBinding"
  | "Attribute"
  | "Expression"
  | "Identifier"
  | "StringLiteral"
  | "NumberLiteral"
  | "BooleanLiteral";

export interface BaseNode {
  type: NodeType;
  loc?: SourceSpan;
}

export interface Program extends BaseNode {
  type: "Program";
  body: TopLevelDeclaration[];
}

export type TopLevelDeclaration =
  | TagDeclaration
  | TraitDeclaration
  | MacroDeclaration
  | LayDeclaration;

export interface TagDeclaration extends BaseNode {
  type: "TagDeclaration";
  name: string;
  parameters: Parameter[];
  body: Block;
}

export interface TraitDeclaration extends BaseNode {
  type: "TraitDeclaration";
  name: string;
  parameters: Parameter[];
  body: Block;
}

export interface MacroDeclaration extends BaseNode {
  type: "MacroDeclaration";
  name: string;
  isStatic: boolean;
  parameters: Parameter[];
  body: Block;
}

export interface LayDeclaration extends BaseNode {
  type: "LayDeclaration";
  name: string;
  selectors: string[];
  body: Block;
}

export interface Parameter extends BaseNode {
  type: "Parameter";
  name: string;
  typeName?: string;
  defaultValue?: Expression;
}

export interface Block extends BaseNode {
  type: "Block";
  body: Statement[];
}

export type Statement = Element | Text | Interpolation | MacroInvocation | Expression;

export interface Element extends BaseNode {
  type: "Element";
  tagName: string;
  attributes: Attribute[];
  traitBindings: TraitBinding[];
  children: Statement[];
  selfClosing: boolean;
}

export interface Text extends BaseNode {
  type: "Text";
  value: string;
}

export interface Interpolation extends BaseNode {
  type: "Interpolation";
  expression: Expression;
}

export interface MacroInvocation extends BaseNode {
  type: "MacroInvocation";
  name: string;
  arguments: Expression[];
  block?: Block;
}

export interface TraitBinding extends BaseNode {
  type: "TraitBinding";
  traitName: string;
  expression: Expression;
}

export interface Attribute extends BaseNode {
  type: "Attribute";
  name: string;
  value: Expression | StringLiteral;
  dynamic: boolean;
}

export type Expression =
  | Identifier
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | MemberExpression
  | CallExpression;

export interface Identifier extends BaseNode {
  type: "Identifier";
  name: string;
}

export interface StringLiteral extends BaseNode {
  type: "StringLiteral";
  value: string;
}

export interface NumberLiteral extends BaseNode {
  type: "NumberLiteral";
  value: number;
}

export interface BooleanLiteral extends BaseNode {
  type: "BooleanLiteral";
  value: boolean;
}

export interface MemberExpression extends BaseNode {
  type: "Expression";
  kind: "member";
  object: Expression;
  property: string;
}

export interface CallExpression extends BaseNode {
  type: "Expression";
  kind: "call";
  callee: string;
  arguments: Expression[];
}
