#!/usr/bin/env node

import { Orchestrator } from "./compiler/orcastrator"
import { parseFlags } from "./flag.parser"

const [, , command, ...flags] = process.argv
const arg = parseFlags(flags, ['input', 'output'])
switch (command) {
	case 'compile':
		await new Orchestrator(arg.input, arg.output).index()
		break

	default:
		break
}