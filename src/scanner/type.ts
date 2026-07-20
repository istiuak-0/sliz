export enum SourceType {
   Host,
   Jml
}

export interface Chunk {
   type: SourceType,
   context: string
}


export interface SourceState {
   Cursor: number,
   Mode: 'HOST' | 'JML',
   ParenDepth: number,
   IsInString: '"' | "'" | "`" | null
   Chunks:Array<Chunk>
}