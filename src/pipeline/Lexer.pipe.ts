// @ts-nocheck
const specialChar = {
  "(": "LeftParen",
  ")": "RightParen",
  "{": "LeftBrace",
  "}": "RightBrace",
  "[": "LeftBracket",
  "]": "RightBracket",
  ";": "Semicolon",
  ",": "Comma",
  "+": "Plus",
  "-": "Minus",
  "*": "Star",
  "**": "Power",
  "/": "Slash",
  "=": "Equal",
  "==": "EqualEqual",
  "===": "EqualEqualEqual",
  "\n": "NewLine",
} as const;

const keyworlds = {
  const: "const",
  let: "let",
  var: "var",
  if: "if",
  function: "function",
} as const;

const tokens = {
  // special char
  LeftParen: "LeftParen",
  RightParen: "RightParen",
  LeftBrace: "LeftBrace",
  RightBrace: "RightBrace",
  Semicolon: "Semicolon",
  Comma: "Comma",
  Plus: "Plus",
  Minus: "Minus",
  Star: "Star",
  Slash: "Slash",
  Equal: "Equal",
  EqualEqual: "EqualEqual",
  // Literals & Identifiers
  Identifier: "Identifier",
  String: "String",
  Number: "Number",
  // keywords
  Const: "Const",
  Var: "Var",
  Let: "Let",
  If: "If",
  Else: "Else",
  Function: "Function",
  Return: "Return",
  // s
  NewLine: "NewLine",
  // EOF
  EOF: "EOF",
} as const;

const tokenTypes = {
  // special char
  LeftParen: "LeftParen",
  RightParen: "RightParen",
  LeftBrace: "LeftBrace",
  RightBrace: "RightBrace",
  Semicolon: "Semicolon",
  Comma: "Comma",
  Plus: "Plus",
  Minus: "Minus",
  Star: "Star",
  Slash: "Slash",
  Equal: "Equal",
  EqualEqual: "EqualEqual",
  // Literals & Identifiers
  Identifier: "Identifier",
  String: "String",
  Number: "Number",
  // keywords
  const: "Const",
  var: "Var",
  let: "Let",
  if: "If",
  else: "Else",
  function: "FunctionDeclaration",
  return: "Return",
  // s
  NewLine: "NewLine",
  // EOF
  EOF: "EOF",
} as const;

const ignoredChars = [" "];

class Token {
  type: any;
  value: any;
  loc: any;

  constructor(type: any, value: any, loc: any) {
    this.type = type;
    this.value = value;
    this.loc = loc;
  }

  injectScript({ script, pos }: InjectScriptArgs) {}

  deleteCode() {}
}

interface InjectScriptArgs {
  script: string;
  pos: "Left" | "Right" | "Bottom" | "Top";
}

export class Lexer {
  tokens: Token[] = [];
  cursor = 0;
  line = 0;

  tokenize(sourceCode: string) {
    this.cusrsorActions("Reset");

    tokenizeLoop: do {
      const char = this.getChar(sourceCode);

      if (ignoredChars.includes(char)) {
        this.cusrsorActions("Increment");
        continue tokenizeLoop;
      }

      if (char) {
        const isSpecialChar = specialChar[char];

        if (isSpecialChar === "NewLine") this.lineActions("Increment");

        if (isSpecialChar) {
          this.tokensActions(
            new Token(tokens[isSpecialChar], char, {
              start: this.cursor,
              end: this.cursor + 1,
              line: this.line,
            }),
          );
        } else {
          const completeChar = this.getCompleteChar(sourceCode, char);
          this.tokensActions(
            new Token(tokenTypes[completeChar] || "char", completeChar, {
              start: this.cursor,
              end: this.cursor + 1,
              line: this.line,
            }),
          );
        }
      } else {
        this.tokensActions(
          new Token("EOF", "End of file", {
            start: this.cursor,
            end: this.cursor + 1,
            line: this.line,
          }),
        );
      }
      this.cusrsorActions("Increment");
    } while (this.cursor <= sourceCode.length);

    return this.tokens;
  }

  cusrsorActions(type: "Reset" | "Increment" | "Decrement") {
    if (type === "Reset") this.cursor = 0;
    else if (type === "Increment") this.cursor += 1;
    else if (type === "Decrement") this.cursor -= 1;
  }

  tokensActions(token: Token) {
    this.tokens.push(token);
  }

  getChar(sourceCode: string) {
    const char = sourceCode[this.cursor];
    return char;
  }

  getCompleteChar(sourceCode: string, char: string) {
    let copedChar = char;

    do {
      this.cusrsorActions("Increment");
      const nextChar = this.getChar(sourceCode);

      if (nextChar?.trim()) {
        if (specialChar[nextChar]) {
          this.cusrsorActions("Decrement");
          break;
        }
        copedChar += nextChar.trim();
      } else break;
    } while (this.cursor <= sourceCode.length);

    return copedChar;
  }

  lineActions(type: "Increment") {
    if (type === "Increment") this.line += 1;
  }
}
