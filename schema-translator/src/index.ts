import { mkdir, mkdirSync, readdirSync, rm, writeFileSync } from "fs";
import { DocPart } from "./DocPart";
import { compileToJsonSchema } from "./DocTypeToJsonSchemaCompiler";
import { compileToDocumentation } from "./DocTypeToDocumentationCompiler";
import { compileToTsTypes } from "./DocTypeToTsTypes";

const outputDir = "./result";
mkdirSync(outputDir, { recursive: true })


const combinedDocs = readdirSync("../schemaParts")
    .map(x => "../schemaParts/"+x)
    .filter(path => path.endsWith(".complete.yaoossa"))
    .map(DocPart.loadFile)
    .reduce(DocPart.combine)
writeFileSync(outputDir+"/combined.yaoossa", combinedDocs.toString())

const tsTypes = compileToTsTypes(combinedDocs)
writeFileSync(outputDir+"/superheroes.yts", tsTypes)

const documentation = compileToDocumentation(combinedDocs)
rm(outputDir+"/docs", {recursive: true}, (err) => {
    if (err) console.log(err)
    documentation.forEach(([file, markdown]) => markdown.save(outputDir+"/docs", file))
})

const lowered = combinedDocs.lowerAll()
writeFileSync(outputDir+"/lowered.yaoossa", lowered.toString())

const jsonSchema = compileToJsonSchema(lowered)
writeFileSync(outputDir+"/schema.json", JSON.stringify(jsonSchema, null, 4))
// compact version
mkdirSync("../schemas", { recursive: true })
writeFileSync("../schemas/Superheroes8+.json", JSON.stringify(jsonSchema))
