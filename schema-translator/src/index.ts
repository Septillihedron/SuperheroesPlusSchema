import { readdirSync, rm, writeFileSync } from "fs";
import { DocPart } from "./DocPart";
import { compileToJsonSchema } from "./DocTypeToJsonSchemaCompiler";
import { compileToDocumentation } from "./DocTypeToDocumentationCompiler";
import { compileToJsonAISchema } from "./DocTypeToJsonAISchemaCompiler";
import { compileToJsonAISchema2 } from "./DocTypeToJsonAISchemaCompiler2";
import { compileToTsTypes } from "./DocTypeToTsTypes";


const combinedDocs = readdirSync("../schemaParts")
    .map(x => "../schemaParts/"+x)
    .filter(path => path.endsWith(".complete.yaoossa"))
    .map(DocPart.loadFile)
    .reduce(DocPart.combine)
writeFileSync("./combined.yaoossa", combinedDocs.toString())
const tsTypes = compileToTsTypes(combinedDocs)
writeFileSync("./superheroes.yts", tsTypes)
const documentation = compileToDocumentation(combinedDocs)
rm("./docs", {recursive: true}, (err) => {
    if (err) console.log(err)
    documentation.forEach(([file, markdown]) => markdown.save("./docs", file))
})
const lowered = combinedDocs.lowerAll()
writeFileSync("./lowered.yaoossa", lowered.toString())
const jsonSchema = compileToJsonSchema(lowered)
writeFileSync("./schema.json", JSON.stringify(jsonSchema, null, 4))
writeFileSync("../compiler/schemas/Superheroes8+.json", JSON.stringify(jsonSchema)) // compact version
const jsonAISchema = compileToJsonAISchema(lowered)
writeFileSync("./ai-schema.json", JSON.stringify(jsonAISchema, null, 4))
writeFileSync("D:\\AI\\geminiAITest\\ai-schema.json", JSON.stringify(jsonAISchema, null, 4))
const jsonAISchema2 = compileToJsonAISchema2(lowered)
writeFileSync("./ai-schema2.json", JSON.stringify(jsonAISchema2, null, 4))
writeFileSync("D:\\AI\\geminiAITest\\ai-schema2.json", JSON.stringify(jsonAISchema2, null, 4))