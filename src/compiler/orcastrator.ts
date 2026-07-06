import { build } from "esbuild";
import { join } from "path";
import { Sliz } from "./plugin";

export class Orchestrator {
   readonly root = process.cwd()


   constructor(
      readonly input: string,
      readonly output: string
   ) { }


   async index() {
      const sliz = new Sliz()
      await build({
         entryPoints: [join(this.root, this.input)],
         outfile: join(this.root, this.output),
         bundle: false,
         format: 'esm',
         plugins: [sliz.esbuild()]
      })
   }
}