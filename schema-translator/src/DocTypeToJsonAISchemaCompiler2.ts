import { DocPart } from "./DocPart"
import { DocType } from "./DocType"

export function compileToJsonAISchema2(part: DocPart): {} {
    const compiler = new DocTypeToJsonSchemaCompiler(part.types)
    const typesEntries = [...part.types].map(([name, doc]) => [name, compiler.toJsonSchema(doc)])
    return {
        $ref: "#/$defs/Superhero",
        $defs: {
            ...Object.fromEntries(typesEntries),
            boolean: {
                type: "boolean"
            },
            integer: {
                type: "integer"
            },
            number: {
                type: "number"
            },
            string: {
                type: "string"
            }
        }
    }
}

class DocTypeToJsonSchemaCompiler {

    types: Map<string, DocType>

    constructor(types: Map<string, DocType>) {
        this.types = types
    }

    toJsonSchema(doc: DocType): any {
        if (doc.type.includes("|")) {
            return this.toMultiTypeJsonShema(doc)
        }
        if (doc.type.endsWith("[]")) {
            return this.toArrayJsonSchema(doc)
        }
        if (doc.type.endsWith("{}")) {
            return this.toRecordJsonSchema(doc)
        }
        switch (doc.type) {
            case "boolean": return { type: "boolean", description: doc.description, default: doc.defaultValue }
            case "integer": return { type: "integer", description: doc.description, default: doc.defaultValue }
            case "number": return { type: "number", description: doc.description, default: doc.defaultValue }
            case "string": return { type: "string", description: doc.description, default: doc.defaultValue }
            case "object": return this.toObjectJsonSchema(doc)
            case "enum": return this.toEnumJsonSchema(doc)
            case "union": return this.toUnionJsonSchema(doc)
            default: return this.toRefJsonSchema(doc)
        }
    }

    toMultiTypeJsonShema(doc: DocType) {
        const types = doc.type.split("|")
            .map(type => type.trim())
            .map(type => DocType.createRefDoc(type, true, doc.defaultValue, ""))
            .map(doc => this.toJsonSchema(doc))
        return {
            description: doc.description,
            anyOf: types
        }
    }

    toArrayJsonSchema(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        const innerDoc = DocType.createRefDoc(innerType, true, "", doc.description)
        return {
            type: "array",
            items: this.toJsonSchema(innerDoc),
            description: doc.description,
            default: doc.defaultValue,
            minItems: 0,
        }
    }

    toRecordJsonSchema(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        const innerDoc = DocType.createRefDoc(innerType, true, "", doc.description)
        return {
            type: "array",
            items: this.toJsonSchema(innerDoc),
            description: doc.description,
            default: doc.defaultValue,
            minItems: 0,
        }
    }

    toObjectJsonSchema(doc: DocType) {
        const properties: Record<string, any> = {}
        doc.properties.forEach((prop, key) => {
            if (Object.values(properties).length > 10) return
            if (prop === true) properties[key] = true
            else properties[key] = this.toJsonSchema(prop)
        })
        return {
            type: "object",
            description: doc.description,
            default: doc.defaultValue,
            properties,
            required: [],
        }
    }

    toUnionJsonSchema(doc: DocType) {
        if (doc.unions.size == 0) return {}
        const unionIdentifier = doc.extraData.find(({ key }) => key === "unionIdentifier")?.value
        if (typeof unionIdentifier != "string") throw new Error("unionIdentifier isn't a string")
        const enumWithDesc = [...doc.unions.keys()].filter((_, i) => i < 2)

        const docName = [...this.types.entries()].find(([_, value]) => value == doc)?.[0]

        const extraData = Object.fromEntries(
            [...doc.unions.entries()].filter((_, i) => i < 2)
                .map(([key, doc]) => {
                    if (doc.type == docName) return [key, {}]
                    const sourceDoc = DocType.getSourceObjectDoc(doc, this.types)
                    const schema = this.toJsonSchema(sourceDoc)
                    return [key, schema]
                })
        )
        return {
            type: "object",
            properties: {
                [unionIdentifier]: {
                    type: "string",
                    enum: enumWithDesc
                },
                ...extraData
            },
            required: []
        }
    }

    toEnumJsonSchema(doc: DocType) {
        return {
            type: "string",
            enum: [...doc.enumValues.values()].filter((_, i) => i < 2),
            description: doc.description,
            default: doc.defaultValue,
        }
    }

    toRefJsonSchema(doc: DocType) {
        return {
            $ref: "#/$defs/" + doc.type,
            nullable: true,
            // description: doc.description,
            // default: doc.defaultValue,
            // ...doc.extraData
        }
    }
}