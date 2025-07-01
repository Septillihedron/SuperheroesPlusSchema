import { readFileSync } from "fs";
import { DocType } from "./DocType";
import { StringView } from "./StringView";
import { parseProperties } from "./DocTypeLoader";


export class DocPart {

    types: Map<string, DocType>

    constructor(types: Map<string, DocType>) {
        this.types = DocType.sortProperties(types) as Map<string, DocType>
    }

    static parse(view: StringView): DocPart {
        const types = parseProperties(view, "", false) as Map<string, DocType>
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

    lowerAll() {
        const loweredTypes = new Map<string, DocType>()
        this.types.forEach((doc, key) => {
            loweredTypes.set(key, doc.lower(this.types))
        })
        return new DocPart(loweredTypes)
    }

}
