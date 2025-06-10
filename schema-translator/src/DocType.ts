import { CharPredicate, is, isAny, isEndline, isEOF, isLetter, isWhitespace, not, StringView } from "./StringView"

type PropertiesMap = Map<string, DocType | true>
type Unions = Map<string, DocType>
type ExtraData = {key: string, value: string | true}[]

export class DocType {

    type: string
    extraData: ExtraData
    required: boolean
    defaultValue: string
    description: string
    properties: PropertiesMap
    enumValues: Set<string>
    unions: Unions

    constructor(
        type: string, 
        extraData: ExtraData, 
        required: boolean, 
        defaultValue: string, 
        description: string, 

        properties: PropertiesMap,
        enumValues: Set<string>,
        unionTypes: Unions
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

    static parseExtraData(view: StringView): ExtraData {
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
            extraData.push({key, value})
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

    static parsePropertiesField(view: StringView, outerIndent: string): PropertiesMap {
        view.skipWhitespace()
        view.skipEndline()
        const innerIndent = view.takeWhile(isWhitespace)
        if (innerIndent.length <= outerIndent.length) view.throw("Empty properties")

        return DocType.parseProperties(view, innerIndent, true)
    }

    static parseProperties(view: StringView, innerIndent: string, allowTrueProperty = true): PropertiesMap {
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
        const name = view.takeWhile(not(is(":")))
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

    static parseUnionsField(view: StringView, outerIndent: string): Unions {
        view.skipWhitespace()
        view.skipEndline()
        const innerIndent = view.takeWhile(isWhitespace)
        if (innerIndent.length <= outerIndent.length) view.throw("Empty unions")

        return DocType.parseProperties(view, innerIndent, false) as Unions
    }

    static combine(doc1: DocType, doc2: DocType): DocType {
        
        return new DocType(
            DocType.combineType(doc1.type, doc2.type), 
            [...doc1.extraData, ...doc2.extraData], 
            doc1.required || doc2.required, 
            doc1.defaultValue, 
            doc1.description, 
            DocType.combineMap(doc1.properties, doc2.properties),
            DocType.combineSet(doc1.enumValues, doc2.enumValues), 
            DocType.combineMap(doc1.unions, doc2.unions)
        )
    }

    static combineType(type1: string, type2: string): string {
        if (DocType.isInvalidType(type1)) return type2
        if (DocType.isInvalidType(type2)) return type1
        if (type1 != type2) throw new Error("Can't combine docs because their type differs");
        return type1
    }
    static isInvalidType(type: string): boolean {
        return type.startsWith("#")
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

    static sortProperties(map: Unions): Unions
    static sortProperties(map: PropertiesMap): PropertiesMap
    static sortProperties(map: PropertiesMap) {
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

    lower(types: Map<string, DocType>): DocType {

        let propertiesToLower = new Map(this.properties)
        let type = this.type
        if (this.type.startsWith("{") && this.type.endsWith("}")) {
            const [keyType, valueType] = this.type.substring(1, this.type.length-1).split(":")
            type = "object"
            const valueDoc = new DocType(
                valueType.trim(), [], true, "", "", 
                new Map(), new Set(), new Map()
            )
            propertiesToLower.set("/"+keyType.trim()+"/", valueDoc)
        }

        this.extraData
            .filter(({key}) => key === "superdoc")
            .map(({value}) => types.get(value as string))
            .reverse()
            .forEach((superdoc) => {
                propertiesToLower = DocType.combineMapOverride(superdoc!.properties, propertiesToLower)
            })

        const loweredProperties = this.lowerProperties(propertiesToLower, types)
        const loweredUnion = this.lowerProperties(this.unions, types) as Unions

        return new DocType(
            type, this.extraData, this.required, this.defaultValue, this.description,
            loweredProperties, this.enumValues, loweredUnion
        )
    }

    private static combineMapOverride<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
        const combined = new Map<K, V>()
        map1.forEach((value, key) => combined.set(key, value))
        map2.forEach((value, key) => combined.set(key, value))
        return combined
    }

    lowerProperties(properties: PropertiesMap, types: Map<string, DocType>): PropertiesMap {
        const loweredProperties = new Map<string, DocType | true>()
        
        ;[...properties.entries()]
            .flatMap(([key, doc]) => {
                if (!(key.startsWith("/") && key.endsWith("/"))) return [[key, doc] as [string, DocType | true]]

                const keyType = key.substring(1, key.length-1)
                const enumDoc = types.get(keyType)
                if (enumDoc == undefined) throw new Error("Can't evaluate type "+keyType)
                if (enumDoc.type !== "enum") throw new Error("Can't evaluate type "+keyType+" because it is not an enum")
                const enumValues = [...enumDoc.enumValues.values()]
                return enumValues.map(value => [value, doc] as [string, DocType | true])
            })
            .map(([key, doc]) => [key, doc === true? true : doc.lower(types)] as [string, DocType | true])
            .forEach(([key, doc]) => {
                const alreadyIn = loweredProperties.get(key)
                if (alreadyIn == undefined || alreadyIn === true) {
                    loweredProperties.set(key, doc)
                    return
                }
                if (doc === true) return

                const objectDoc = DocType.getSourceObjectDoc(doc, types)
                const alreadyObjectDoc = DocType.getSourceObjectDoc(alreadyIn, types)

                loweredProperties.set(key, DocType.combine(objectDoc, alreadyObjectDoc))
            })

        return loweredProperties
    }

    static getSourceObjectDoc(doc: DocType | undefined, types: Map<string, DocType>): DocType {
        if (
            doc?.type === "boolean" ||
            doc?.type === "integer" ||
            doc?.type === "number" ||
            doc?.type === "string"
        ) return doc

        if (doc === undefined) throw new Error("Undefined doc")
        return doc.type == "object" ? doc 
            : DocType.getSourceObjectDoc(types.get(doc.type), types)
    }

    toString(baseIndent = ""): string {
        let extraData = this.extraDataToString()
        const requiredStr = this.required? "! " : "? "
        const descriptionStr = " # " + this.description

        let fields = ""
        const indent = " ".repeat(4)
        if (this.properties.size !== 0) {
            fields += baseIndent+indent + "properties: \n"
            for (const [key, value] of this.properties) {
                fields += baseIndent+indent + indent + key + ": " + value.toString(indent + indent).trim() + "\n"
            }
        }
        if (this.enumValues.size !== 0 && this.enumValues.size < 100) {
            fields += baseIndent+indent + "values: \n"
            for (const value of this.enumValues) {
                fields += baseIndent+indent + "  - " + value + "\n"
            }
        }
        if (this.unions.size !== 0) {
            fields += baseIndent+indent + "unions: \n"
            for (const [key, value] of this.unions) {
                fields += baseIndent+indent + indent + key + ": " + value.toString(indent + indent).trim() + "\n"
            }
        }
        fields = "\n" + fields

        return this.type + extraData + requiredStr + this.defaultValue + descriptionStr + fields
    }

    private extraDataToString() {
        let extraData = ""
        for (const {key, value} of this.extraData) {
            if (extraData.length != 0) extraData += ", "
            extraData += key
            if (value !== true) extraData += " = " + value
        }
        if (extraData.length != 0) extraData = "(" + extraData + ")"
        return extraData
    }

    toJsonSchema(types: Map<string, DocType>) {
        if (this.type.endsWith("[]")) {
            return this.toArrayJsonSchema()
        }
        if (this.type.endsWith("{}")) {
            return this.toRecordJsonSchema()
        }
        switch (this.type) {
            case "object": return this.toObjectJsonSchema(types)
            case "enum": return this.toEnumJsonSchema()
            case "union": return this.toUnionJsonSchema(types)
            default: return this.toRefJsonSchema()
        }
    }

    toArrayJsonSchema() {
        const innerType = this.type.substring(0, this.type.length-2)
        return {
            type: "array",
            items: {
                $ref: "#/definitions/"+innerType,
                description: this.description
            },
            description: this.description,
            default: this.defaultValue,
            ...this.extraData
        }
    }

    toRecordJsonSchema() {
        const innerType = this.type.substring(0, this.type.length-2)
        return {
            type: "object",
            patternProperties: {
                ".*": {
                    $ref: "#/definitions/"+innerType,
                    description: this.description
                }
            },
            description: this.description,
            default: this.defaultValue,
            ...this.extraData
        }
    }

    toObjectJsonSchema(types: Map<string, DocType>) {
        const properties: Record<string, any> = {}
        this.properties.forEach((prop, key) => {
            if (prop === true) properties[key] = true
            else properties[key] = prop.toJsonSchema(types)
        })
        return {
            type: "object",
            description: this.description,
            default: this.defaultValue,
            ...this.extraData,
            properties
        }
    }

    toUnionJsonSchema(types: Map<string, DocType>) {
        if (this.unions.size == 0) return {}
        const unionIdentifier = this.extraData.find(({key}) => key === "unionIdentifier")?.value
        if (typeof unionIdentifier != "string") throw new Error("unionIdentifier isn't a string")
        const enumWithDesc = [...this.unions.entries()]
            .map(([key, doc]) => ({
                const: key,
                description: doc.description
            }))
        
        const thisName = [...types.entries()].find(([_, value]) => value == this)?.[0]

        const ifRef: any[] = [...this.unions.entries()]
            .map(([key, doc]) => ({
                if: {
                    properties: {
                        [unionIdentifier]: { const: key }
                    }
                },
                then: doc.type == thisName? {} : doc.toJsonSchema(types)
            }))
        return {
            type: "object",
            properties: {
                [unionIdentifier]: {
                    type: "string",
                    oneOf: enumWithDesc
                },
            },
            if: {
                properties: {
                    [unionIdentifier]: false
                }
            },
            else: {
                allOf: ifRef
            }
        }
    }

    toEnumJsonSchema() {
        return {
            type: "string",
            enum: [...this.enumValues.values()],
            description: this.description,
            default: this.defaultValue,
            ...this.extraData
        }
    }

    toRefJsonSchema() {
        return {
            $ref: "#/definitions/"+this.type,
            description: this.description,
            default: this.defaultValue,
            ...this.extraData
        }
    }

}


