import { removeSlashes } from "slashes"
import { DocType, ExtraData, PropertiesMap, Unions } from "./DocType"
import { is, isAny, isEndline, isEOF, isLetter, isWhitespace, not, StringView } from "./StringView"

export function parse(view: StringView, indent: string): DocType {
    const type = parseType(view)
    const extraData = parseExtraData(view)
    const required = parseRequired(view)
    const defaults = parseDefaults(view)
    const description = parseDescription(view)
    view.skipEndline()
    const { properties, enumValues, unions } = parseFields(view, indent)


    const docType = new DocType(
        type, extraData, required, defaults, description,
        properties,
        enumValues,
        unions
    )

    return docType
}

function parseType(view: StringView) {
    return view.takeWhile(not(isAny("?!()")).or(isEndline)).trim()
}

function parseExtraData(view: StringView): ExtraData {
    if (!view.consume("(")) return []
    const extraData: ExtraData = []
    do {
        view.skipWhitespace()
        const key = view.takeWhile(isLetter)
        view.skipWhitespace()
        let value: string | true = true
        if (view.consume("=")) {
            view.skipWhitespace()
            value = view.takeWhile(isLetter)
        }
        view.skipWhitespace()
        extraData.push({ key, value })
    } while (view.consume(","))
    view.consumeOrThrow(")")
    return extraData
}

function parseRequired(view: StringView): boolean {
    if (view.consume("?")) return false
    if (view.consume("!")) return true
    view.throw(
        "Unexpected: \"" + view.peek(1) + "\"\n"
        + "Expected: \"?\" or \"!\""
    )
}

function parseDefaults(view: StringView) {
    return view.takeWhile(not(is("#").or(isEndline))).trim()
}

function parseDescription(view: StringView): string {
    if (!view.consume("#")) return ""
    let description = view.takeWhile(not(isEndline))
    description = description.trim()
    description = removeSlashes(description) // decode escape sequences
    return "\n" + description
}

function parseFields(view: StringView, indent: string): { properties: DocType['properties'], enumValues: DocType['enumValues'], unions: DocType['unions'] } {
    const fields = {
        properties: new Map<string, DocType | true>(),
        enumValues: new Set<string>(),
        unions: new Map<string, DocType>()
    }
    const outerIndent = view.takeWhile(isWhitespace)
    if (outerIndent.length < indent.length) {
        view.undo(outerIndent.length)
        return fields
    }
    if (outerIndent.length == 0) return fields

    let hasNoFields = true
    do {
        if (view.consume("properties:")) {
            fields.properties = parsePropertiesField(view, outerIndent)
            hasNoFields = false
        } else if (view.consume("values:")) {
            fields.enumValues = parseEnumField(view, outerIndent)
            hasNoFields = false
        } else if (view.consume("unions:")) {
            fields.unions = parseUnionsField(view, outerIndent)
            hasNoFields = false
        }
    } while (view.consume(outerIndent))

    if (hasNoFields) {
        view.undo(outerIndent.length)
    }

    return fields
}

function parsePropertiesField(view: StringView, outerIndent: string): PropertiesMap {
    view.skipWhitespace()
    view.skipEndline()
    const innerIndent = view.takeWhile(isWhitespace)
    if (innerIndent.length <= outerIndent.length) view.throw("Empty properties")

    return parseProperties(view, innerIndent, true)
}

export function parseProperties(view: StringView, innerIndent: string, allowTrueProperty = true): PropertiesMap {
    const properties = new Map<string, DocType | true>()
    do {
        if (view.consumeEndline()) continue
        const [name, docType] = parseProperty(view, innerIndent, allowTrueProperty)
        view.consumeEndline()
        properties.set(name, docType)
    } while (view.consume(innerIndent) && !isEOF(view.peek()))
    return properties
}

function parseProperty(view: StringView, indent: string, allowTrueProperty = true): [string, DocType | true] {
    const name = view.takeWhile(not(is(":")))
    view.skipWhitespace()
    view.consumeOrThrow(":")
    view.skipWhitespace()
    if (allowTrueProperty && view.consume("true")) return [name, true]
    return [name, parse(view, indent)]
}

function parseEnumField(view: StringView, outerIndent: string): Set<string> {
    view.skipWhitespace()
    view.skipEndline()
    const innerIndent = view.takeWhile(isWhitespace)
    if (innerIndent.length < outerIndent.length) view.throw("Empty enum values")
    const values = new Set<string>()
    do {
        if (view.consumeEndline()) continue
        view.consumeOrThrow("-")
        view.skipWhitespace()
        const value = view.takeWhile(not(isEndline))
        view.consumeEndline()
        values.add(value)
    } while (view.consume(innerIndent))
    return values
}

function parseUnionsField(view: StringView, outerIndent: string): Unions {
    view.skipWhitespace()
    view.skipEndline()
    const innerIndent = view.takeWhile(isWhitespace)
    if (innerIndent.length <= outerIndent.length) view.throw("Empty unions")

    return parseProperties(view, innerIndent, false) as Unions
}