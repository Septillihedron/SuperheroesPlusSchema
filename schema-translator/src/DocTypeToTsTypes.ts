import { DocPart } from "./DocPart"
import { DocType } from "./DocType"

export function compileToTsTypes(part: DocPart): string {
    const compiler = new DocTypeToTsTypesCompiler(part.types)
    const types = [...part.types]
        .map(([name, doc]) => {
            name = name.replace(/\./g, "_")
            const compiled = compiler.toTsTypes(doc)
            const description = doc.description.split("\n")
                .map(line => ` * ${line}`)
            return `/**\n${description}\n */\ntype ${name} = ${compiled}`
        })
        .join("\n\n")
    return "export type Root = Superhero\n\n" + types
}

class DocTypeToTsTypesCompiler {

    types: Map<string, DocType>

    constructor(types: Map<string, DocType>) {
        this.types = types
    }

    toTsTypes(doc: DocType): string {
        if (doc.type.includes("|")) {
            return this.toMultiTypeTsTypes(doc)
        }
        if (doc.type.endsWith("[]")) {
            return this.toArrayTsTypes(doc)
        }
        if (doc.type.endsWith("{}")) {
            return this.toRecordTsTypes(doc)
        }
        if (doc.type.startsWith("{") && doc.type.endsWith("}")) {
            return this.toMappingTsTypes(doc)
        }
        switch (doc.type) {
            case "boolean": return "boolean"
            case "integer": return "number"
            case "number": return "number"
            case "string": return "string"
            case "object": return this.toObjectTsTypes(doc)
            case "enum": return this.toEnumTsTypes(doc)
            case "union": return this.toUnionTsTypes(doc)
            default: return this.toRefTsTypes(doc)
        }
    }

    toMultiTypeTsTypes(doc: DocType) {
        return doc.type.split("|")
            .map(type => type.trim())
            .map(type => DocType.createRefDoc(type, true, doc.defaultValue, ""))
            .map(doc => this.toTsTypes(doc))
            .map(type => `(${type})`)
            .join(" | ")
    }

    toArrayTsTypes(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        const innerDoc = DocType.createRefDoc(innerType, true, "", "")
        const innerTsType = this.toTsTypes(innerDoc)
        return `${innerTsType}[]`
    }

    toRecordTsTypes(doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length - 2)
        const innerDoc = DocType.createRefDoc(innerType, true, "", "")
        const innerTsType = this.toTsTypes(innerDoc)
        return `Record<string, ${innerTsType}>`
    }

    toMappingTsTypes(doc: DocType) {
        const [keyType, valueType] = DocType.getMappingTypes(doc.type)
        const valueDoc = DocType.createRefDoc(valueType, true, "", "")
        const valueTsType = this.toTsTypes(valueDoc)
        return `Record<${keyType}, ${valueTsType}>`
    }

    toObjectTsTypes(doc: DocType) {
        if (doc.properties.size == 0) return "{}"
        let properties = ""
        doc.properties.forEach((prop, key) => {
            if (prop === true) {
                properties += `\n    ${key}: any;`
                return
            }
            const propType = this.toTsTypes(prop)
            if (key.startsWith("/") && key.endsWith("/")) {
                const keyType = key.substring(1, key.length - 1).trim()
                properties += `\n    [${keyType}]: ${propType};`
                return
            }
            const description = prop.description.split("\n")
                .map(line => `     * ${line}`)
                .join("\n")
            const optionallity = prop.required ? "" : "?"
            properties += ""
                +`\n    /**`
                +`\n${description}`
                +`\n     */`
                +`\n    ${key}${optionallity}: ${propType};`
        })
        return `{${properties}\n}`
    }

    toUnionTsTypes(doc: DocType) {
        if (doc.unions.size == 0) throw new Error("Union type has no unions defined")
        const unionIdentifier = doc.extraData.find(({ key }) => key === "unionIdentifier")?.value
        if (typeof unionIdentifier != "string") throw new Error("unionIdentifier isn't a string")

        const properties = this.toObjectTsTypes(doc)

        const extraData = [...doc.unions.entries()]
            .map(([name, unionDoc]) => {
                

                if (name.startsWith("/") && name.endsWith("/")) {
                    name = name.substring(1, name.length - 1).trim()
                } else {
                    name = `"${name}"`
                }

                let unionTsType
                if (DocType.getSourceObjectDoc(unionDoc, this.types) == doc) {
                    unionTsType = "{}"
                } else {
                    unionTsType = this.toTsTypes(unionDoc)
                }

                const description = unionDoc.description.split("\n")
                    .map(line => `     * ${line}`).join("\n")
                
                return ""
                    +`    /**\n`
                    +`${description}\n`
                    +`     */\n`
                    +`    ({${unionIdentifier}: ${name}} & ${unionTsType})`
            })
            .join(" | \n")
        
        return `(${properties}) & (\n${extraData}\n)`
    }

    toEnumTsTypes(doc: DocType) {
        return [...doc.enumValues]
            .map(value => `"${value}"`)
            .join(" | ")
    }

    toRefTsTypes(doc: DocType) {
        return doc.type.replace(/\./g, "_")
    }
}