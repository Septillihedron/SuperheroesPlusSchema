import { mkdir, writeFile } from "fs/promises"
import { DocPart } from "./DocPart"
import { DocType } from "./DocType"
import { dirname } from "path"

export function compileToDocumentation(part: DocPart): [string, Markdown][] {
    const compiler = new DocTypeToDocumentationCompiler(part.types)
    const docs: [string, Markdown][] = []
    part.types.forEach((doc, name) => docs.push(compiler.compile(name, doc)))
    docs.push(compiler.getSidebar())
    return docs
}

class DocTypeToDocumentationCompiler {

    types: Map<string, DocType>
    sidebar: Markdown

    constructor(types: Map<string, DocType>) {
        this.types = types
        this.sidebar = new Markdown()
    }

    compile(name: string, doc: DocType): [string, Markdown] {
        return [
            this.toPath(name, doc), 
            this.toDocumentation(name, doc)
        ]
    }

    getSidebar(): [string, Markdown] {
        return ["_Sidebar", this.sidebar]
    }

    toPath(name: string, doc: DocType): string {
        return name
    }

    toDocumentation(name: string, doc: DocType): Markdown {
        if (doc.type.endsWith("[]")) {
            return this.toArrayDocumentation(name, doc)
        }
        if (doc.type.endsWith("{}")) {
            return this.toRecordDocumentation(name, doc)
        }
        if (DocType.isMappingType(doc.type)) {
            return this.toMappingDocumentation(name, doc)
        }
        switch (doc.type) {
            case "object": return this.toObjectDocumentation(name, doc)
            case "enum": return this.toEnumDocumentation(name, doc)
            case "union": return this.toUnionDocumentation(name, doc)
            default: return this.toRefDocumentation(name, doc)
        }
    }

    toArrayDocumentation(name: string, doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length-2)
        return new Markdown()
            .heading0(name + " - An array of" + this.link(innerType))
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .heading1("Structure")
            .codeBlock("yaml", ""
                + `- A value of ${this.link(innerType)}\n`
                + `- A value of ${this.link(innerType)}\n`
                + `...`
            )
    }
    toRecordDocumentation(name: string, doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length-2)
        return new Markdown()
            .heading0(name + " - A mapping from name (any string) to " + this.link(innerType))
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .heading1("Structure")
            .codeBlock("yaml", ""
                + `name1: A value of ${this.link(innerType)}\n`
                + `name2: A value of ${this.link(innerType)}\n`
                + `...`
            )
    }
    toMappingDocumentation(name: string, doc: DocType) {
        const [keyType, valueType] = DocType.getMappingTypes(doc.type)
        return new Markdown()
            .heading0(name + " - A mapping from " + this.link(keyType.trim()) + " to " + this.link(valueType.trim()))
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .heading1("Structure")
            .codeBlock("yaml", ""
                + `A value of ${this.link(keyType)}: A value of ${this.link(valueType)}\n`
                + `A value of ${this.link(keyType)}: A value of ${this.link(valueType)}\n`
                + `...`
            )
    }
    toObjectDocumentation(name: string, doc: DocType) {
        const properties = doc.handleSuperDocs(this.types, new Map(doc.properties))

        const md = new Markdown()
            .heading0(name + " - An object")
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .heading1("Properties")
        properties.forEach((property, name) => {
            if (property == true) return
            if (name.startsWith("/") && name.endsWith("/")) {
                name = "/"+this.link(name.substring(1, name.length-1))+"/"
            }
            const required = property.required? "Required" : "Optional"
            const typeLink = property.type == "enum"? "enum" : this.link(property.type)
            md.heading2(`${name} - ${required} ${typeLink}`)
            if (typeLink == "enum") {
                md.heading3("Allowed values")
                md.list([...property.enumValues])
            }
            const description = property.description
            md.paragraph(`${description}`)
            const def = property.defaultValue
            if (def != "") md.paragraph(`Defaults to ${def}`)
        })

        return md
    }

    toEnumDocumentation(name: string, doc: DocType) {
        const md = new Markdown()
            .heading0(name + " - Enum")
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .heading1("Allowed values")
            .list([...doc.enumValues])
        
        return md
    }

    toUnionDocumentation(name: string, doc: DocType) {
        const differentiator = doc.extraData.find(({ key }) => key === "unionIdentifier")?.value! as string
        const unionsData: [string, string, string][] = []
        doc.unions.forEach((subtype, name) => {
            if (name.startsWith("/") && name.endsWith("/")) {
                name = "/"+this.link(name.substring(1, name.length-1))+"/"
            }
            const subtypeDescription = subtype.type == "object"? 
                "No extra data"
                : this.link(subtype.type)
            unionsData.push([name, subtype.description, subtypeDescription])
        })
        const md = new Markdown()
            .heading0(name + " - A union of types with a differentiator")
            .paragraph(doc.description)
            .paragraph("Differentiator: "+differentiator)
            .heading1("Possible Types")
            .table([differentiator, "Description", "Subtype"], unionsData)

        return md
    }

    toRefDocumentation(name: string, doc: DocType) {
        return new Markdown()
            .heading0(name + " - Type: " + this.link(doc.type))
            .paragraph(doc.description)
    }

    link(type: string): string {
        const primitiveTypes = ["boolean", "integer", "number", "string"]
        if (primitiveTypes.includes(type)) return type

        if (type.endsWith("[]")) {
            return "Array of " + this.link(type.substring(0, type.length-2))
        }
        if (type.endsWith("{}")) {
            return "Record of " + this.link(type.substring(0, type.length-2))
        }
        if (DocType.isMappingType(type)) {
            const [keyType, valueType] = DocType.getMappingTypes(type)
            return `Mapping from ${this.link(keyType)} to ${this.link(valueType)}`
        }
        if (type.includes("|")) {
            const types = type.split("|")
            return types
                .map(type => type.trim())
                .map(type => this.link(type))
                .join(" or ")
        }

        const doc = this.types.get(type)
        if (doc == undefined) throw new Error("Unresolved type: "+type)

        return Markdown.link(type, type)
    }
}

class Markdown {

    content: string

    constructor() {
        this.content = ""
    }

    private heading(heading: string, subness=0) {
        this.content +=  `\n\n${"#".repeat(subness+1)} ${heading}\n\n`
        return this
    }
    heading0(heading: string) {
        return this.heading(heading, 0)
    }
    heading1(heading: string) {
        return this.heading(heading, 1)
    }
    heading2(heading: string) {
        return this.heading(heading, 2)
    }
    heading3(heading: string) {
        return this.heading(heading, 3)
    }
    paragraph(text: string) {
        if (text == "") return this
        this.content += "\n\n" + text + "\n\n"
        return this
    }
    codeBlock(language: string, code: string) {
        this.content += "```"+language+"\n"
        this.content += code
        this.content += "\n```"
        return this
    }
    list(list: string[]) {
        list.forEach(value => this.content += "* "+value+"\n")
        return this
    }
    table<Row extends string[]>(header: Row, data: Row[]) {
        this.content += `| ${header.join(" | ")} |\n`
        this.content += `| ${header.map(() => "-").join(" | ")} |\n`
        data.forEach(row => {
            this.content += `| ${row.join(" | ")} |\n`
        })
        return this
    }

    static link(text: string, link: string) {
        return `[${text}](${link})`
    }

    async save(base: string, path: string) {
        const fullPath = base + "/" + path + ".md"
        await mkdir(dirname(fullPath), { recursive: true })
        await writeFile(fullPath, this.content)
    }


}