import type { SourceRange } from '../lexer/types'

export enum NodeKind {
	Program,
	Text,
	Tag,
	SelfClose,
	Attr,
	Expr,
	If,
	Else,
}

export interface Program {
	kind: NodeKind.Program
	children: Node[]
	range: SourceRange
}

export interface Text {
	kind: NodeKind.Text
	value: string
	range: SourceRange
}

export interface Tag {
	kind: NodeKind.Tag
	name: string
	attrs: Attr[]
	children: Node[]
	range: SourceRange
}

export interface SelfClose {
	kind: NodeKind.SelfClose
	name: string
	attrs: Attr[]
	range: SourceRange
}

export interface Attr {
	kind: NodeKind.Attr
	name: string
	dot: boolean
	value: Expr | Text | null
	range: SourceRange
}

export interface Expr {
	kind: NodeKind.Expr
	value: string
	range: SourceRange
}

export interface If {
	kind: NodeKind.If
	condition: string
	children: Node[]
	range: SourceRange
}

export interface Else {
	kind: NodeKind.Else
	children: Node[]
	range: SourceRange
}

export type Node = Program | Text | Tag | SelfClose | Attr | Expr | If | Else
