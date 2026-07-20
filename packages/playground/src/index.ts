import { compile } from "@jml/core";

const source = `
tag Hello(name: string) {
  <div class="hello">
    <span>Hello, {name}</span>
  </div>
}
`;

const output = compile(source);
console.log(output);
