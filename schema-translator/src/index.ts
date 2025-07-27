import { readdirSync, rm, writeFileSync } from "fs";
import { DocPart } from "./DocPart";
import { compileToJsonSchema } from "./DocTypeToJsonSchemaCompiler";
import { compileToDocumentation } from "./DocTypeToDocumentationCompiler";
import { compileToJsonAISchema } from "./DocTypeToJsonAISchemaCompiler";


const combinedDocs = readdirSync("../schemaParts")
    .map(x => "../schemaParts/"+x)
    .filter(path => path.endsWith(".complete.yaoossa"))
    .map(DocPart.loadFile)
    .reduce(DocPart.combine)
writeFileSync("./combined.yaoossa", combinedDocs.toString())
const documentation = compileToDocumentation(combinedDocs)
rm("./docs", {recursive: true}, (err) => {
    if (err) console.log(err)
    documentation.forEach(([file, markdown]) => markdown.save("./docs", file))
})
const lowered = combinedDocs.lowerAll()
writeFileSync("./lowered.yaoossa", lowered.toString())
const jsonSchema = compileToJsonSchema(lowered)
writeFileSync("./schema.json", JSON.stringify(jsonSchema, null, 4))
const jsonAISchema = compileToJsonAISchema(lowered)
writeFileSync("./ai-schema.json", JSON.stringify(jsonAISchema, null, 4))
writeFileSync("../compiler/schemas/Superheroes8+.json", JSON.stringify(jsonSchema)) // compact version


