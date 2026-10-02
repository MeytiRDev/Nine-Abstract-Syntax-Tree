// @ts-nocheck
// فرض بر این است که TokenType در فایل قبلی است

import { TokenType } from "./Lexer.point.js";

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.cursor = 0;
  }

  // نقطه ورود اصلی: ساخت AST کل برنامه
  parse() {
    const body = [];
    while (!this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    return {
      type: 'Program',
      body,
      loc: {
        start: body.length > 0 ? body[0].loc.start : 0,
        end: this.peek().loc.end
      }
    };
  }

  // --- 1. مدیریت Statementها (دستورات) ---

  parseStatement() {
    if (this.match(TokenType.Const, TokenType.Let)) {
      return this.parseVariableDeclaration();
    }
    if (this.match(TokenType.If)) {
      return this.parseIfStatement();
    }
    if (this.match(TokenType.Return)) {
      return this.parseReturnStatement();
    }
    if (this.match(TokenType.LeftBrace)) {
      return this.parseBlockStatement();
    }

    return this.parseExpressionStatement();
  }

  // parse: const x = 10;
  parseVariableDeclaration() {
    const kindToken = this.previous(); // const یا let
    const idToken = this.consume(TokenType.Identifier, "نام متغیر مورد انتظار بود.");
    
    let init = null;
    if (this.match(TokenType.Equal)) {
      init = this.parseExpression();
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'VariableDeclaration',
      kind: kindToken.value,
      declarations: [{
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: idToken.value,
          loc: idToken.loc
        },
        init
      }],
      loc: {
        start: kindToken.loc.start,
        end: (init ? init.loc.end : idToken.loc.end)
      }
    };
  }

  // parse: if (condition) { ... } else { ... }
  parseIfStatement() {
    const ifToken = this.previous();
    this.consume(TokenType.LeftParen, "انتظار '(' بعد از if وجود دارد.");
    const test = this.parseExpression();
    this.consume(TokenType.RightParen, "انتظار ')' بعد از شرط if وجود دارد.");

    const consequent = this.parseStatement();
    let alternate = null;

    if (this.match(TokenType.Else)) {
      alternate = this.parseStatement();
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
      loc: {
        start: ifToken.loc.start,
        end: alternate ? alternate.loc.end : consequent.loc.end
      }
    };
  }

  // parse: return value;
  parseReturnStatement() {
    const returnToken = this.previous();
    let argument = null;

    // اگر بلافاصله به سمی‌کالن یا انتهای بلاک نرسیم، آرگومان دارد
    if (!this.check(TokenType.Semicolon) && !this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      argument = this.parseExpression();
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'ReturnStatement',
      argument,
      loc: {
        start: returnToken.loc.start,
        end: argument ? argument.loc.end : returnToken.loc.end
      }
    };
  }

  // parse: { statement1; statement2; }
  parseBlockStatement() {
    const startToken = this.previous();
    const body = [];

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    const endToken = this.consume(TokenType.RightBrace, "انتظار '}' در انتهای بلاک وجود دارد.");

    return {
      type: 'BlockStatement',
      body,
      loc: {
        start: startToken.loc.start,
        end: endToken.loc.end
      }
    };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.consumeOptionalSemicolon();
    return {
      type: 'ExpressionStatement',
      expression: expr,
      loc: expr.loc
    };
  }

  // --- 2. مدیریت Expressionها با اولویت عملگرها (Operator Precedence) ---

  parseExpression() {
    return this.parseEquality();
  }

  // عملگرهای برابری: ==
  parseEquality() {
    let expr = this.parseAdditive();

    while (this.match(TokenType.EqualEqual)) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        loc: { start: expr.loc.start, end: right.loc.end }
      };
    }

    return expr;
  }

  // عملگرهای جمع و تفریق: + و -
  parseAdditive() {
    let expr = this.parseMultiplicative();

    while (this.match(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        loc: { start: expr.loc.start, end: right.loc.end }
      };
    }

    return expr;
  }

  // عملگرهای ضرب و تقسیم: * و /
  parseMultiplicative() {
    let expr = this.parsePrimary();

    while (this.match(TokenType.Star, TokenType.Slash)) {
      const operator = this.previous().value;
      const right = this.parsePrimary();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        loc: { start: expr.loc.start, end: right.loc.end }
      };
    }

    return expr;
  }

  // نودهای پایه: اعداد، رشته‌ها، شناسه‌ها، پرانتزها
  parsePrimary() {
    if (this.match(TokenType.Number)) {
      const token = this.previous();
      return {
        type: 'NumericLiteral',
        value: token.value,
        raw: String(token.value),
        loc: token.loc
      };
    }

    if (this.match(TokenType.String)) {
      const token = this.previous();
      return {
        type: 'StringLiteral',
        value: token.value,
        loc: token.loc
      };
    }

    if (this.match(TokenType.Identifier)) {
      const token = this.previous();
      return {
        type: 'Identifier',
        name: token.value,
        loc: token.loc
      };
    }

    // گروه‌بندی با پرانتز: ( 1 + 2 )
    if (this.match(TokenType.LeftParen)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RightParen, "انتظار ')' بعد از عبارت وجود دارد.");
      return expr;
    }

    const current = this.peek();
    throw new SyntaxError(
      `توکن غیرمنتظره '${current.value}' از نوع '${current.type}' در خط ${current.loc.line}، ستون ${current.loc.column}`
    );
  }

  // --- 3. متدهای کمکی اشاره‌گر Parser ---

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, errorMessage) {
    if (this.check(type)) return this.advance();
    const current = this.peek();
    throw new SyntaxError(`${errorMessage} (دریافت شد: '${current.value}' در خط ${current.loc.line})`);
  }

  consumeOptionalSemicolon() {
    if (this.check(TokenType.Semicolon)) {
      this.advance();
    }
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.cursor++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  peek() {
    return this.tokens[this.cursor];
  }

  previous() {
    return this.tokens[this.cursor - 1];
  }
}
