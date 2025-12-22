import { DocPart } from "./DocPart"
import { DocType } from "./DocType"

export function compileToJsonAISchema(part: DocPart): {} {
    const compiler = new DocTypeToJsonSchemaCompiler(part.types)
    const typesEntries = [...part.types]
        .flatMap(([name, doc]) => {
            const compiled = compiler.toJsonSchema(doc)
            const N = 2
            const schemas = []
            if (!hasRef(compiled)) {
                for (let i=0; i<N+1; i++) {
                    schemas.push([name+i, {$ref: "#/$defs/"+"_"+name}])
                }
                return [["_"+name, compiled], ...schemas]
            }
            for (let i=0; i<N; i++) {
                schemas.push([name+i, addRefIndex(jsonClone(compiled), i+1)])
            }
            schemas.push([name+N, {type: "null", description: "You have hit the recursion limit"}])
            return schemas
        })
    return {
        $ref: "#/$defs/Superhero0",
        $defs: Object.fromEntries(typesEntries)
    }
}

function jsonClone(x: any) {
    return JSON.parse(JSON.stringify(x));
}

function addRefIndex(schema: unknown, index: number) {
    if (schema == null) return
    if (typeof schema != "object") return
    if ("$ref" in schema) {
        if (typeof schema.$ref != "string") throw new Error("$ref should be a string, got: "+schema.$ref)
        schema.$ref = schema.$ref + index
    }
    Object.values(schema)
        .forEach(value => addRefIndex(value, index))
    return schema
}

function hasRef(schema: unknown): boolean {
    if (schema == null) return false
    if (typeof schema != "object") return false
    if ("$ref" in schema) {
        if (typeof schema.$ref != "string") throw new Error("$ref should be a string, got: "+schema.$ref)
        return true
    }
    return Object.values(schema)
        .some(value => hasRef(value))
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
        }
    }

    toRecordJsonSchema(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        const innerDoc = DocType.createRefDoc(innerType, true, "", doc.description)
        return {
            type: "array",
            items: {
                ...this.toJsonSchema(innerDoc),
                properties: {
                    _name: {
                        type: "string"
                    }
                }
            },
            description: doc.description,
            default: doc.defaultValue,
        }
    }

    toObjectJsonSchema(doc: DocType) {
        let properties: Record<string, any> = {}
        doc.properties.forEach((prop, key) => {
            if (prop === true) properties[key] = true
            else properties[key] = this.toJsonSchema(prop)
        })
        if (Object.values(properties).length == 0) {
            return {
                type: "null",
                description: "No extra data"
            }
        }
        return {
            type: "object",
            description: doc.description,
            default: doc.defaultValue,
            properties: properties
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