import { DocPart } from "./DocPart"
import { DocType } from "./DocType"

export function compileToJsonAISchema(part: DocPart): {} {
    const compiler = new DocTypeToJsonSchemaCompiler(part.types)
    const typesEntries = [...part.types].map(([name, doc]) => [name, compiler.toJsonSchema(doc)])
    return {
        $ref: "#/$defs/Superhero",
        $defs: Object.fromEntries(typesEntries)
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
            .map(this.toRefJsonSchema)
        return {
            description: doc.description,
            anyOf: types
        }
    }

    toArrayJsonSchema(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        return {
            type: "array",
            items: {
                $ref: "#/$defs/" + innerType,
                description: doc.description
            },
            description: doc.description,
            default: doc.defaultValue,
        }
    }

    toRecordJsonSchema(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        return {
            type: "array",
            items: {
                $ref: "#/$defs/" + innerType,
                properties: {
                    _name: {
                        type: "string"
                    }
                },
                description: doc.description
            },
            description: doc.description,
            default: doc.defaultValue,
        }
    }

    toObjectJsonSchema(doc: DocType) {
        const properties: Record<string, any> = {}
        doc.properties.forEach((prop, key) => {
            if (prop === true) properties[key] = true
            else properties[key] = this.toJsonSchema(prop)
        })
        return {
            type: "object",
            description: doc.description,
            default: doc.defaultValue,
            properties
        }
    }

    toUnionJsonSchema(doc: DocType) {
        if (doc.unions.size == 0) return {}
        const unionIdentifier = doc.extraData.find(({ key }) => key === "unionIdentifier")?.value
        if (typeof unionIdentifier != "string") throw new Error("unionIdentifier isn't a string")
        
        const extraData = [...doc.unions.entries()]
            .map(([name, doc]) => [name, this.toJsonSchema(doc)] as [string, any])

        return {
            type: "object",
            properties: {
                [unionIdentifier]: {
                    type: "string",
                    enum: [...doc.unions.keys()]
                },
                ...Object.fromEntries(extraData)
            }
        }
    }

    toEnumJsonSchema(doc: DocType) {
        return {
            type: "string",
            enum: [...doc.enumValues.values()],
            description: doc.description,
            default: doc.defaultValue,
        }
    }

    toRefJsonSchema(doc: DocType) {
        return {
            $ref: "#/$defs/" + doc.type,
            description: doc.description,
            default: doc.defaultValue,
        }
    }
}