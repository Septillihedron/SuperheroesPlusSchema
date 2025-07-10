import { DocPart } from "./DocPart"
import { DocType } from "./DocType"

export function compileToJsonSchema(part: DocPart): {} {
    const compiler = new DocTypeToJsonSchemaCompiler(part.types)
    const typesEntries = [...part.types].map(([name, doc]) => [name, compiler.toJsonSchema(doc)])
    return {
        $schema: "http://json-schema.org/draft-07/schema#",
        $ref: "#/definitions/Superhero",
        definitions: {
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

    toJsonSchema(doc: DocType) {
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
                $ref: "#/definitions/" + innerType,
                description: doc.description
            },
            description: doc.description,
            default: doc.defaultValue,
            ...doc.extraData
        }
    }

    toRecordJsonSchema(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        return {
            type: "object",
            patternProperties: {
                ".*": {
                    $ref: "#/definitions/" + innerType,
                    description: doc.description
                }
            },
            description: doc.description,
            default: doc.defaultValue,
            ...doc.extraData
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
            ...doc.extraData,
            properties
        }
    }

    toUnionJsonSchema(doc: DocType) {
        if (doc.unions.size == 0) return {}
        const unionIdentifier = doc.extraData.find(({ key }) => key === "unionIdentifier")?.value
        if (typeof unionIdentifier != "string") throw new Error("unionIdentifier isn't a string")
        const enumWithDesc = [...doc.unions.entries()]
            .map(([key, doc]) => ({
                const: key,
                description: doc.description
            }))

        const docName = [...this.types.entries()].find(([_, value]) => value == doc)?.[0]

        const ifRef: any[] = [...doc.unions.entries()]
            .map(([key, doc]) => ({
                if: {
                    properties: {
                        [unionIdentifier]: { const: key }
                    }
                },
                then: doc.type == docName ? {} : this.toJsonSchema(doc)
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

    toEnumJsonSchema(doc: DocType) {
        return {
            type: "string",
            enum: [...doc.enumValues.values()],
            description: doc.description,
            default: doc.defaultValue,
            ...doc.extraData
        }
    }

    toRefJsonSchema(doc: DocType) {
        return {
            $ref: "#/definitions/" + doc.type,
            description: doc.description,
            default: doc.defaultValue,
            ...doc.extraData
        }
    }
}