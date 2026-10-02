// @ts-nocheck
export class TokenType {
    static LeftParen = "LeftParen";
    static RightParen = "RightParen";
    static LeftBrace = "LeftBrace";
    static RightBrace = "RightBrace";
    static Semicolon = "Semicolon";
    static Comma = "Comma";
    static Plus = "Plus";
    static Minus = "Minus";
    static Star = "Star";
    static Slash = "Slash";
    static Equal = "Equal";
    static EqualEqual = "EqualEqual";
    // Literals & Identifiers
    static Identifier = "Identifier";
    static String = "String";
    static Number = "Number";
    // keywords
    static Const = "Const";
    static Var = "Var";
    static Let = "Let";
    static If = "If";
    static Else = "Else";
    static Function = "Function";
    static Return = "Return";
    // end of file
    static EOF = "EOF";
}
export class Keywords {
    static const = TokenType.Const;
    static var = TokenType.Var;
    static let = TokenType.Let;
    static if = TokenType.If;
    static else = TokenType.Else;
    static function = TokenType.Function;
    static return = TokenType.Return;
}
// 2. Position class / container for info & values
export class Token {
    type;
    value;
    loc;
    constructor(type, value, loc) {
        this.type = type;
        this.value = value;
        this.loc = loc;
    }
}
// 3. Lexer
export class Lexer {
    #source;
    #tokens = [];
    #cursor = 0;
    #line = 1;
    #column = 1;
    #startOffset = 0;
    #startCol = 1;
    constructor(sourceCode) {
        this.#source = sourceCode;
    }
    tokenize() {
        while (!this.isAtEnd()) {
            this.#startOffset = this.#cursor;
            this.#startCol = this.#column;
            this.scanToken();
        }
        // اضافه کردن توکن EOF برای پایان مرحله Parsing
        this.#tokens.push(new Token(TokenType.EOF, "", {
            start: this.#cursor,
            end: this.#cursor,
            line: this.#line,
            column: this.#column,
        }));
        return this.#tokens;
    }
    scanToken() {
        const char = this.advance();
        console.log(char);
        switch (char) {
            case "(":
                this.addToken(TokenType.LeftParen, "(");
                break;
            case ")":
                this.addToken(TokenType.RightParen, ")");
                break;
            case "{":
                this.addToken(TokenType.LeftBrace, "{");
                break;
            case "}":
                this.addToken(TokenType.RightBrace, "}");
                break;
            case ";":
                this.addToken(TokenType.Semicolon, ";");
                break;
            case ",":
                this.addToken(TokenType.Comma, ",");
                break;
            case "+":
                this.addToken(TokenType.Plus, "+");
                break;
            case "-":
                this.addToken(TokenType.Minus, "-");
                break;
            case "*":
                this.addToken(TokenType.Star, "*");
                break;
            case "=":
                if (this.match("=")) {
                    this.addToken(TokenType.EqualEqual, "==");
                }
                else {
                    this.addToken(TokenType.Equal, "=");
                }
                break;
            case "/":
                // بررسی کامنت‌های تک خطی //
                if (this.match("/")) {
                    while (this.peek() !== "\n" && !this.isAtEnd()) {
                        this.advance();
                    }
                }
                else {
                    this.addToken(TokenType.Slash, "/");
                }
                break;
            // مدیریت فاصله‌ها و خط جدید
            case " ":
            case "\r":
            case "\t":
                break; // فضاها نادیده گرفته می‌شوند
            case "\n":
                this.#line++;
                this.#column = 1;
                break;
            case '"':
            case "'":
                this.readString(char);
                break;
            default:
                if (this.isDigit(char)) {
                    this.readNumber();
                }
                else if (this.isAlpha(char)) {
                    this.readIdentifier();
                }
                else {
                    throw new SyntaxError(`کاراکتر نامعتبر '${char}' در خط ${this.#line}، ستون ${this.#startCol}`);
                }
                break;
        }
    }
    // --- متدهای اسکن مقادیر طولانی‌تر (Literals & Identifiers) ---
    readString(quoteType) {
        while (this.peek() !== quoteType && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.#line++;
                this.#column = 1;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            const error = new SyntaxError(`رشته بدون بسته شدن در خط ${this.#line}`);
            throw error;
        }
        // رد کردن کوتیشن پایانی
        this.advance();
        // مقدار رشته بدون کوتیشن‌ها
        const value = this.#source.slice(this.#startOffset + 1, this.#cursor - 1);
        this.addToken(TokenType.String, value);
    }
    readNumber() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        // پشتیبانی از اعداد اعشاری (Decimal)
        if (this.peek() === "." && this.isDigit(this.peekNext())) {
            this.advance(); // رد کردن نقطه‌ی ممیز
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        const value = Number(this.#source.slice(this.#startOffset, this.#cursor));
        this.addToken(TokenType.Number, value);
    }
    readIdentifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        const text = this.#source.slice(this.#startOffset, this.#cursor);
        const type = Keywords[text] || TokenType.Identifier;
        this.addToken(type, text);
    }
    // --- متدهای کمکی اشاره‌گر (Cursor Utilities) ---
    advance() {
        const char = this.#source[this.#cursor];
        this.#cursor++;
        this.#column++;
        return char;
    }
    match(expected) {
        if (this.isAtEnd() || this.#source[this.#cursor] !== expected)
            return false;
        this.#cursor++;
        this.#column++;
        return true;
    }
    peek() {
        if (this.isAtEnd())
            return "\0";
        return this.#source[this.#cursor];
    }
    peekNext() {
        if (this.#cursor + 1 >= this.#source.length)
            return "\0";
        return this.#source[this.#cursor + 1];
    }
    isAtEnd() {
        return this.#cursor >= this.#source.length;
    }
    isDigit(ch) {
        return ch >= "0" && ch <= "9";
    }
    isAlpha(ch) {
        return ((ch >= "a" && ch <= "z") ||
            (ch >= "A" && ch <= "Z") ||
            ch === "_" ||
            ch === "$");
    }
    isAlphaNumeric(ch) {
        return this.isAlpha(ch) || this.isDigit(ch);
    }
    addToken(type, value) {
        this.#tokens.push(new Token(type, value, {
            start: this.#startOffset,
            end: this.#cursor,
            line: this.#line,
            column: this.#startCol,
        }));
    }
}
