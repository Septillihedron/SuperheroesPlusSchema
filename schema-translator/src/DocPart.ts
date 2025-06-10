import { readFileSync } from "fs";
import { DocType } from "./DocType";
import { StringView } from "./StringView";


export class DocPart {

    types: Map<string, DocType>

    constructor(types: Map<string, DocType>) {
        this.types = DocType.sortProperties(types)
    }

    static parse(view: StringView): DocPart {
        const types = DocType.parseProperties(view, "", false) as Map<string, DocType>
        return new DocPart(types)
    }

    static loadFile(path: string): DocPart {
        const file = readFileSync(path, {encoding: "utf-8"})
        return DocPart.parse(new StringView(file, path))
    }

    static combine(part1: DocPart, part2: DocPart): DocPart {
        const combinedTypes = new Map<string, DocType>()
        part1.types.forEach((value, key) => {
            if (DocType.isInvalidType(value.type)) return
            combinedTypes.set(key, value)
        })
        part2.types.forEach((value, key) => {
            const alreadyIn = combinedTypes.get(key)
            if (alreadyIn != undefined) {
                combinedTypes.set(key, DocType.combine(value, alreadyIn))
                return
            }
            if (DocType.isInvalidType(value.type)) return
            combinedTypes.set(key, value)
        })

        return new DocPart(combinedTypes)
    }
    
    toString(): string {
        let str = ""
        for (const [name, doc] of this.types) {
            str += name + ": " + doc
        }
        return str
    }

    toJsonSchema() {
        const typesEntries = [...this.types].map(([name, doc]) => [name, doc.toJsonSchema(this.types)])
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
                },
            }
        }
    }

    lowerAll() {
        const loweredTypes = new Map<string, DocType>()
        this.types.forEach((doc, key) => {
            loweredTypes.set(key, doc.lower(this.types))
        })
        return new DocPart(loweredTypes)
    }

}
