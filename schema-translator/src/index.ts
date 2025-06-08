import { readdirSync } from "fs";
import { DocPart } from "./DocPart";


const combinedDocs = readdirSync("../schemaParts")
    .map(x => "../schemaParts/"+x)
    .filter(path => path.endsWith(".complete.yaoossa"))
    .map(path => {
        const part = DocPart.loadFile(path)
        // console.log(path)
        // console.dir(part, {depth: 100})
        return part
    })
    .reduce(DocPart.combine)

console.dir(combinedDocs, {
    depth: 1000
})
    
