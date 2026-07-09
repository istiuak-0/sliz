#!/usr/bin/env node

import { cac } from "cac"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { Compile } from "../compiler/compile"

const cli = cac("jml")
const root = process.cwd()

cli
  .command("compile", "Compile a .jml file")
  .option("--input <path>", "Input .jml file")
  .option("--output <path>", "Output file")
  .action((options: { input?: string; output?: string }) => {
    if (!options.input || !options.output) {
      console.error("--input and --output are required")
      process.exit(1)
    }

    const inputFilePath = join(root, options.input)
    const content = readFileSync(inputFilePath, "utf8")
    const compiled = Compile(content)
    const outputFilePath = join(root, options.output);
    writeFileSync(outputFilePath, compiled, "utf8")
  })

cli.help()
cli.parse()
