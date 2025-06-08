import { readdirSync, writeFileSync } from "fs";
import { DocPart } from "./DocPart";


const combinedDocs = readdirSync("../schemaParts")
    .map(x => "../schemaParts/"+x)
    .filter(path => path.endsWith(".complete.yaoossa"))
    .map(DocPart.loadFile)
    .reduce(DocPart.combine)

writeFileSync("./combined.yaoossa", combinedDocs.toString())

