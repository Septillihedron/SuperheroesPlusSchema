
export type Predicate<T> = ((t: T) => boolean) & {
    or: (predicate: Predicate<T>) => Predicate<T>, 
    and: (predicate: Predicate<T>) => Predicate<T>
}
export type CharPredicate = Predicate<string | null>

export type Position = {
    line: number, 
    character: number, 
}

export class StringView {

    source: string
    data: string
    index: number

    constructor(data: string, source: string) {
        this.data = data
        this.index = 0
        this.source = source
    }

    consume(str: string): boolean {
        const value = this.peek(str.length)
        if (value === str) {
            this.index += str.length
            return true
        }
        return false
    }
    consumeEndline(): boolean {
        if (this.peek() === null) return true //eof
        if (this.consume("\r\n")) return true
        if (this.consume("\r")) return true
        if (this.consume("\n")) return true
        return false
    }
    consumeEOF(): boolean {
        return this.peek() === null
    }

    consumeOrThrow(str: string) {
        if (!this.consume(str)) {
            const position = this.getPosition()
            throw new Error(
                "Unexpected: \"" + this.peek(str.length) + "\"\n"
                + "Expected: \"" + str + "\"\n"
                + "line: " + position.line + " character: " + position.character + "\n"
                + "file: " + this.source + ":" + position.line + ":" + position.character
            )
        }
    }

    throw(message: string): never {
        const position = this.getPosition()
        throw new Error(
            message + "\n"
            + "line: " + position.line + " character: " + position.character + "\n"
            + "file: " + this.source + ":" + position.line + ":" + position.character
        )
    }

    getPosition() {
        const stringView = new StringView(this.data.slice(0, this.index+1), "StringView.position from "+this.source)
        let line = 0
        let character = 0
        do  {
            character = stringView.takeWhile(not(isEndline)).length + 1
            line++
        } while (stringView.consumeEndline() && !isEOF(stringView.peek()));

        return {
            line, character
        }
    }

    peek(n = 1): string | null {
        if (this.index+n >= this.data.length) {
            n = this.data.length - this.index
            if (n == 0) return null
        }
        return this.data.slice(this.index, this.index+n)
    }

    take(): string {
        const value = this.data[this.index]
        this.index++
        return value
    }

    takeWhile(predicate: CharPredicate): string {
        let accumulator = ""
        let char = this.peek()
        while (char != null && predicate(char)) {
            accumulator += this.take()
            char = this.peek()
        }
        return accumulator
    }

    skip(n: number) {
        this.index += n
    }

    skipWhitespace() {
        this.takeWhile(isWhitespace)
    }
    skipEndline() {
        this.consumeEndline()
    }

    undo(length: number) {
        this.index -= length
    }

    toString(): string {
        return this.peek(this.data.length) ?? ""
    }

}

export const isWhitespace = toCharPredicate((char: string | null) => {
    return char?.match(/[ \t]/) != null
})
export const isEndline = toCharPredicate((char: string | null) => {
    if (char == null) return true //eof
    return char.match(/\r|\n|\r\n/) != null
})
export const isEOF = toCharPredicate((char: string | null) => {
    return char === null
})
export const isLetter = toCharPredicate((char: string | null) => {
    return char?.match(/\w/) != null
})
export const is = (toMatch: string) => toCharPredicate((char: string | null) => {
    return char == toMatch
})
export const isAny = (toMatch: string) => toCharPredicate((char: string | null) => {
    for (const targetChar of toMatch) {
        if (char == targetChar) return true
    }
    return false
})

export function not(predicate: CharPredicate): CharPredicate {
    return toCharPredicate((char) => !predicate(char))
}
function toCharPredicate(f: (t: string | null) => boolean): CharPredicate {
    return toPredicate(f)
}
function toPredicate<T>(f: (t: T) => boolean): Predicate<T> {
    const fPredicate = f as Predicate<T>
    fPredicate.or = (predicate: Predicate<T>) => toPredicate((t: T) => f(t) || predicate(t));
    fPredicate.and = (predicate: Predicate<T>) => toPredicate((t: T) => f(t) && predicate(t));
    return fPredicate
}
