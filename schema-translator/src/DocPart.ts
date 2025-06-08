import { readFileSync } from "fs";
import { DocType } from "./DocType";
import { StringView } from "./StringView";


export class DocPart {

    types: Map<string, DocType>

    constructor(types: Map<string, DocType>) {
        this.types = types
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
        part1.types.forEach((value, key) => combinedTypes.set(key, value))
        part2.types.forEach((value, key) => {
            const alreadyIn = combinedTypes.get(key)
            if (alreadyIn != undefined) {
                combinedTypes.set(key, DocType.combine(value, alreadyIn))
            } else {
                combinedTypes.set(key, value)
            }
        })

        return new DocPart(combinedTypes)
    }

}
