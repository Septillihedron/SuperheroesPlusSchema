import { CharPredicate, is, isAny, isEndline, isEOF, isLetter, isWhitespace, not, StringView } from "./StringView"

export class DocType {

    type: string
    extraData: Map<string, string | true>
    required: boolean
    defaultValue: string
    description: string
    properties: Map<string, DocType | true>
    enumValues: Set<string>
    unions: Map<string, DocType>

    constructor(
        type: string, 
        extraData: Map<string, string | true>, 
        required: boolean, 
        defaultValue: string, 
        description: string, 

        properties: Map<string, DocType | true>,
        enumValues: Set<string>,
        unionTypes: Map<string, DocType>
    ) {
        this.type = type
        this.extraData = extraData
        this.required = required
        this.defaultValue = defaultValue
        this.description = description
        this.properties = DocType.sortProperties(properties)
        this.enumValues = DocType.sortEnum(enumValues)
        this.unions = DocType.sortProperties(unionTypes)
    }
    
    static parse(view: StringView, indent: string): DocType {
        const type = DocType.parseType(view)
        const extraData = DocType.parseExtraData(view)
        const required = DocType.parseRequired(view)
        const defaults = DocType.parseDefaults(view)
        const description = DocType.parseDescription(view)
        view.skipEndline()
        const {properties, enumValues, unions} = DocType.parseFields(view, indent)


        const docType = new DocType(
            type, extraData, required, defaults, description,
            properties, 
            enumValues,
            unions
        )

        return docType
    }

    static parseType(view: StringView) {
        return view.takeWhile(not(isAny("?!()")).or(isEndline))
    }

    static parseExtraData(view: StringView): Map<string, string | true> {
        if (!view.consume("(")) return new Map<string, string | true>()
        const extraData = new Map<string, string | true>()
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
            extraData.set(key, value)
        } while (view.consume(","))
        view.consumeOrThrow(")")
        return extraData
    }

    static parseRequired(view: StringView): boolean {
        if (view.consume("?")) return false
        if (view.consume("!")) return true
        view.throw(
            "Unexpected: \""+view.peek(1)+"\"\n"
            + "Expected: \"?\" or \"!\""
        )
    }

    static parseDefaults(view: StringView) {
        return view.takeWhile(not(is("#").or(isEndline))).trim()
    }

    static parseDescription(view: StringView): string {
        if (!view.consume("#")) return ""
        return view.takeWhile(not(isEndline))
    }

    static parseFields(view: StringView, indent: string): {properties: DocType['properties'], enumValues: DocType['enumValues'], unions: DocType['unions']} {
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
                fields.properties = DocType.parsePropertiesField(view, outerIndent)
                hasNoFields = false
            } else if (view.consume("values:")) {
                fields.enumValues = DocType.parseEnumField(view, outerIndent)
                hasNoFields = false
            } else if (view.consume("unions:")) {
                fields.unions = DocType.parseUnionsField(view, outerIndent)
                hasNoFields = false
            }
        } while (view.consume(outerIndent))

        if (hasNoFields) {
            view.undo(outerIndent.length)
        }

        return fields
    }

    static parsePropertiesField(view: StringView, outerIndent: string): Map<string, DocType | true> {
        view.skipWhitespace()
        view.skipEndline()
        const innerIndent = view.takeWhile(isWhitespace)
        if (innerIndent.length <= outerIndent.length) view.throw("Empty properties")

        return DocType.parseProperties(view, innerIndent, true)
    }

    static parseProperties(view: StringView, innerIndent: string, allowTrueProperty = true): Map<string, DocType | true> {
        const properties = new Map<string, DocType | true>()
        do {
            if (view.consumeEndline()) continue
            const [name, docType] = DocType.parseProperty(view, innerIndent, allowTrueProperty)
            view.consumeEndline()
            properties.set(name, docType)
        } while (view.consume(innerIndent) && !isEOF(view.peek()))
        return properties
    }

    static parseProperty(view: StringView, indent: string, allowTrueProperty = true): [string, DocType | true] {
        const name = view.takeWhile(isLetter.or(isAny("/.")))
        view.skipWhitespace()
        view.consumeOrThrow(":")
        view.skipWhitespace()
        if (allowTrueProperty && view.consume("true")) return [name, true]
        return [name, DocType.parse(view, indent)]
    }

    static parseEnumField(view: StringView, outerIndent: string): Set<string> {
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

    static parseUnionsField(view: StringView, outerIndent: string): Map<string, DocType> {
        view.skipWhitespace()
        view.skipEndline()
        const innerIndent = view.takeWhile(isWhitespace)
        if (innerIndent.length <= outerIndent.length) view.throw("Empty unions")

        return DocType.parseProperties(view, innerIndent, false) as Map<string, DocType>
    }

    static combine(doc1: DocType, doc2: DocType): DocType {
        if (doc1.type != doc2.type) throw new Error("Can't combine docs because their type differs");
        
        return new DocType(
            doc1.type, 
            DocType.combineMap(doc1.extraData, doc2.extraData), 
            doc1.required || doc2.required, 
            doc1.defaultValue, 
            doc1.description, 
            DocType.combineMap(doc1.properties, doc2.properties),
            DocType.combineSet(doc1.enumValues, doc2.enumValues), 
            DocType.combineMap(doc1.unions, doc2.unions)
        )
    }

    private static combineMap<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
        const combined = new Map<K, V>()
        map1.forEach((value, key) => combined.set(key, value))
        map2.forEach((value, key) => {
            if (combined.has(key) && combined.get(key) !== value) throw new Error("Can't combine maps because key \"" + key + "\" has 2 possible values")
            combined.set(key, value)
        })
        return combined
    }
    private static combineSet<T>(set1: Set<T>, set2: Set<T>): Set<T> {
        const combined = new Set<T>()
        set1.forEach(value => combined.add(value))
        set2.forEach(value => combined.add(value))
        return combined
    }

    static sortProperties(map: Map<string, DocType>): Map<string, DocType>
    static sortProperties(map: Map<string, DocType | true>): Map<string, DocType | true>
    static sortProperties(map: Map<string, DocType | true>) {
        return new Map([...map.entries()].sort((a, b) => {
            const [aKey, aDoc] = a
            const [bKey, bDoc] = b
            const typeDifference = DocType.docTypeToOrdinal(bDoc) - DocType.docTypeToOrdinal(aDoc);
            if (typeDifference != 0) return typeDifference;
            return aKey.toLocaleLowerCase().localeCompare(bKey.toLocaleLowerCase())
        }))
    }
    private static docTypeToOrdinal(doc: DocType | true): number {
        if (doc === true) return 3;
        switch (doc.type) {
            case "union": return 2;
            case "object": return 1;
            case "enum": return 0;
            default: return -1;
        };
    }

    static sortEnum(set: Set<string>) {
        return new Set([...set.values()].sort())
    }

    lower(types: Map<string, DocType>) {

    }

    toString(): string {
        let extraData = this.extraDataToString()
        const requiredStr = this.required? "!" : "?"
        const descriptionStr = " # " + this.description

        let fields = ""
        const indent = " ".repeat(4)
        if (this.properties.size !== 0) {
            fields += indent + "properties: \n"
            for (const [key, value] of this.properties) {
                fields += indent + indent + key + ": " + value.toString() + "\n"
            }
        }
        if (this.enumValues.size !== 0 && this.enumValues.size < 100) {
            fields += indent + "values: \n"
            for (const value of this.enumValues) {
                fields += indent + "  - " + value + "\n"
            }
        }
        if (this.unions.size !== 0) {
            fields += indent + "unions: \n"
            for (const [key, value] of this.unions) {
                fields += indent + indent + key + ": " + value.toString() + "\n"
            }
        }
        if (fields.length != 0) fields = "\n" + fields

        return this.type + extraData + requiredStr + this.defaultValue + descriptionStr + fields
    }

    private extraDataToString() {
        let extraData = ""
        for (const [key, value] of this.extraData) {
            if (extraData.length != 0) extraData += ", "
            extraData += key
            if (value !== true) extraData += " = " + value
        }
        if (extraData.length != 0) extraData = "(" + extraData + ")"
        return extraData
    }
}


