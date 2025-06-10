import { readdirSync, writeFileSync } from "fs";
import { DocPart } from "./DocPart";


const combinedDocs = readdirSync("../schemaParts")
    .map(x => "../schemaParts/"+x)
    .filter(path => path.endsWith(".complete.yaoossa"))
    .map(DocPart.loadFile)
    .reduce(DocPart.combine)
writeFileSync("./combined.yaoossa", combinedDocs.toString())
const lowered = combinedDocs.lowerAll()
writeFileSync("./lowered.yaoossa", lowered.toString())
const jsonSchema = JSON.stringify(lowered.toJsonSchema(), null, 4)
writeFileSync("./schema.json", jsonSchema)
const jsonSchemaCompact = JSON.stringify(lowered.toJsonSchema())
writeFileSync("../compiler/schemas/Superheroes8+.json", jsonSchemaCompact)


