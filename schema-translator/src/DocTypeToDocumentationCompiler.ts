import { mkdir, writeFile } from "fs/promises"
import { DocPart } from "./DocPart"
import { DocType } from "./DocType"
import { dirname } from "path"

export function compileToDocumentation(part: DocPart): [string, Markdown][] {
    const compiler = new DocTypeToDocumentationCompiler(part.types)
    const docs: [string, Markdown][] = []
    part.types.forEach((doc, name) => {
        const compiled = compiler.toDocumentation(name, doc)
        if (compiled instanceof Markdown) {
            docs.push([name, compiled])
            return
        }
        docs.push([name, compiled.markdown])
        compiled.children.forEach(([childName, md]) => docs.push([name+"/"+childName, md]))
    })
    return docs
}

class DocTypeToDocumentationCompiler {

    types: Map<string, DocType>

    constructor(types: Map<string, DocType>) {
        this.types = types
    }

    toDocumentation(name: string, doc: DocType): Markdown | {markdown: Markdown, children: [string, Markdown][]} {
        if (doc.type.endsWith("[]")) {
            return this.toArrayDocumentation(name, doc)
        }
        if (doc.type.endsWith("{}")) {
            return this.toRecordDocumentation(name, doc)
        }
        if (doc.isMappingType(doc.type)) {
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
            .heading(name + " - An array of" + this.link(innerType))
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .subHeading("Structure")
            .codeBlock("yaml", ""
                + `- A value of ${this.link(innerType)}\n`
                + `- A value of ${this.link(innerType)}\n`
                + `...`
            )
    }
    toRecordDocumentation(name: string, doc: DocType) {
        const innerType = doc.type.substring(0, doc.type.length-2)
        return new Markdown()
            .heading(name + " - A mapping from name (any string) to " + this.link(innerType))
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .subHeading("Structure")
            .codeBlock("yaml", ""
                + `name1: A value of ${this.link(innerType)}\n`
                + `name2: A value of ${this.link(innerType)}\n`
                + `...`
            )
    }
    toMappingDocumentation(name: string, doc: DocType) {
        const [keyType, valueType] = doc.type.substring(1, doc.type.length-1).split(":")
        return new Markdown()
            .heading(name + " - A mapping from " + this.link(keyType.trim()) + " to " + this.link(valueType.trim()))
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .subHeading("Structure")
            .codeBlock("yaml", ""
                + `A value of ${this.link(keyType)}: A value of ${this.link(valueType)}\n`
                + `A value of ${this.link(keyType)}: A value of ${this.link(valueType)}\n`
                + `...`
            )
    }
    toObjectDocumentation(name: string, doc: DocType) {
        const properties = doc.handleSuperDocs(this.types, new Map(doc.properties))

        const md = new Markdown()
            .heading(name + " - An object")
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .subHeading("Properties")
        properties.forEach((property, name) => {
            if (property == true) return
            if (name.startsWith("/") && name.endsWith("/")) {
                name = "/"+this.link(name.substring(1, name.length-1))+"/"
            }
            const required = property.required? "Required" : "Optional"
            const type = property.type
            md.subSubHeading(`${name} - ${required} ${this.link(type)}`)
            const description = property.description
            md.paragraph(`${description}`)
            const def = property.defaultValue
            if (def != "") md.paragraph(`Defaults to ${def}`)
        })

        return md
    }

    toEnumDocumentation(name: string, doc: DocType) {
        const md = new Markdown()
            .heading(name + " - Enum")
            .paragraph(doc.description)
            .paragraph(doc.defaultValue == ""? "" : "Defaults to " + doc.defaultValue)
            .subHeading("Allowed values")
            .list([...doc.enumValues])
        
        return md
    }

    toUnionDocumentation(name: string, doc: DocType) {
        const differentiator = doc.extraData.find(({ key }) => key === "unionIdentifier")?.key!
        const unionsData: [string, string, string][] = []
        doc.unions.forEach((subtype, name) => {
            if (name.startsWith("/") && name.endsWith("/")) {
                name = "/"+this.link(name.substring(1, name.length-1))+"/"
            }
            unionsData.push([name, subtype.description, this.link(subtype.type)])
        })
        const md = new Markdown()
            .heading(name + " - A union of types with a differentiator")
            .paragraph(doc.description)
            .paragraph("Differentiator: "+differentiator)
            .subHeading("Possible Types")
            .table([differentiator, "Description", "Subtype"], unionsData)

        return md
    }

    toRefDocumentation(name: string, doc: DocType) {
        return new Markdown()
            .heading(name + " - Type: " + this.link(doc.type))
            .paragraph(doc.description)
    }

    link(type: string) {
        return Markdown.link(type, type)
    }
}

class Markdown {

    content: string

    constructor() {
        this.content = ""
    }

    heading(heading: string, subness=0) {
        this.content +=  `\n\n${"#".repeat(subness+1)} ${heading}\n\n`
        return this
    }
    subHeading(heading: string) {
        return this.heading(heading, 1)
    }
    subSubHeading(heading: string) {
        return this.heading(heading, 2)
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
        await mkdir(dirname(fullPath), {
            recursive: true
        })
        await writeFile(fullPath, this.content)
    }


}