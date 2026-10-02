import { Lexer } from "./pipeline/Lexer.pipe.js";

const code = `
  const total = 42 + 3.14;
  if (total == 45.14) {
    if (3 == 4) {
      return "Its"
    }
    return "Done";
  };
  function syaHi( name ) {
    return "hello meyti"
  }
`;

const lexer = new Lexer();
const tokens = lexer.tokenize(code)

console.log(tokens);

