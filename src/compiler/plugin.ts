import { Plugin } from "esbuild";
import { readFileSync } from "fs";

export class Sliz {
   esbuild(): Plugin {
      return {
         name: 'sliz:compiler',
         setup(build) {
            console.log(build);

            build.onLoad({
               filter: /\.sliz$/
            }, (args) => {
               const content = readFileSync(args.path, 'utf8')
               console.log(content);
               return {
                  contents: content,
                  loader: 'text'
               }
            })
         },
      }
   }
}


