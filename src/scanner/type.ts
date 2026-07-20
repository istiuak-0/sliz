export enum SourceType {
	Host,
	Jml,
}

export interface Chunk {
	type: SourceType
	context: string
}
