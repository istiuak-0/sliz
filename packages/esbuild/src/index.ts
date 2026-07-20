import type { Plugin } from "esbuild";

export interface JmlEsbuildOptions {
  // TODO: add options
}

export function jml(options?: JmlEsbuildOptions): Plugin {
  return {
    name: "jml",
    // TODO: implement plugin
  };
}

export default jml;
