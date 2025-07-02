
export type Property = DocType | true
export type PropertyEntry = [string, Property]
export type PropertiesMap = Map<string, Property>
export type Unions = Map<string, DocType>
export type ExtraData = {key: string, value: string | true}[]

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
        this.properties = properties
        this.enumValues = DocType.sortEnum(enumValues)
        this.unions = DocType.sortUnions(unionTypes)
    }

    static createRefDoc(type: string, required: boolean, defaultValue: string, description: string): DocType {
        return new DocType(
            type, [], required, defaultValue, description,
            new Map(), new Set(), new Map()
        )
    }

    static sortUnions(map: Unions): Unions {
        return this.sortProperties(map) as Unions
    }
    static sortProperties(map: PropertiesMap): PropertiesMap {
        return new Map([...map.entries()].sort((a, b) => {
            const [aKey, aDoc] = a
            const [bKey, bDoc] = b
            const typeDifference = DocType.docTypeToOrdinal(bDoc) - DocType.docTypeToOrdinal(aDoc);
            if (typeDifference != 0) return typeDifference;
            return aKey.toLocaleLowerCase().localeCompare(bKey.toLocaleLowerCase())
        }))
    }
    static sortEnum(set: Set<string>) {
        return new Set([...set.values()].sort())
    }

    static docTypeToOrdinal(doc: DocType | true): number {
        if (doc === true) return 3;
        switch (doc.type) {
            case "union": return 2;
            case "object": return 1;
            case "enum": return 0;
            default: return -1;
        };
    }


    lower(types: Map<string, DocType>): DocType {
        let propertiesToLower = new Map(this.properties)
        let type = this.type
        if (this.isMappingType(type)) {
            type = "object"
            const [keyType, valueType] = this.type.substring(1, this.type.length-1).split(":")
            const valueDoc = DocType.createRefDoc(valueType.trim(), true, "", "")
            propertiesToLower.set("/"+keyType.trim()+"/", valueDoc)
        }

        propertiesToLower = this.handleSuperDocs(types, propertiesToLower)

        const loweredProperties = this.lowerProperties(propertiesToLower, types)
        const loweredUnion = this.lowerProperties(this.unions, types) as Unions

        return new DocType(
            type, this.extraData, this.required, this.defaultValue, this.description,
            loweredProperties, this.enumValues, loweredUnion
        )
    }

    private handleSuperDocs(types: Map<string, DocType>, propertiesToLower: Map<string, Property>) {
        this.extraData
            .filter(({ key }) => key === "superdoc")
            .map(({ value }) => {
                const superdoc = types.get(value as string)
                if (superdoc == null) throw new Error("Superdoc " + value + " is missing")
                return superdoc
            })
            .reverse()
            .forEach((superdoc) => {
                superdoc = DocType.getSourceObjectDoc(superdoc, types)
                propertiesToLower = DocType.combineMapOverride(superdoc.properties, propertiesToLower)
            })
        return propertiesToLower
    }

    private isMappingType(type: string) {
        return type.startsWith("{") && type.endsWith("}")
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

    static combineMap<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
        const combined = new Map<K, V>()
        map1.forEach((value, key) => combined.set(key, value))
        map2.forEach((value, key) => {
            if (combined.has(key) && combined.get(key) !== value) throw new Error("Can't combine maps because key \"" + key + "\" has 2 possible values")
            combined.set(key, value)
        })
        return combined
    }
    static combineSet<T>(set1: Set<T>, set2: Set<T>): Set<T> {
        const combined = new Set<T>()
        set1.forEach(value => combined.add(value))
        set2.forEach(value => combined.add(value))
        return combined
    }

    static getSourceObjectDoc(doc: DocType | undefined, types: Map<string, DocType>): DocType {
        if (
            doc?.type === "boolean" ||
            doc?.type === "integer" ||
            doc?.type === "number" ||
            doc?.type === "string"
        ) return doc

        if (doc === undefined) throw new Error("Undefined doc")
        if (doc.type == "object" || doc.type == "union") return doc
        return DocType.getSourceObjectDoc(types.get(doc.type), types)
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

}


