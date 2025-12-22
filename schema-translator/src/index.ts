import { mkdir, mkdirSync, readdirSync, rm, writeFileSync } from "fs";
import { DocPart } from "./DocPart";
import { compileToJsonSchema } from "./DocTypeToJsonSchemaCompiler";
import { compileToDocumentation } from "./DocTypeToDocumentationCompiler";
import { compileToJsonAISchema } from "./DocTypeToJsonAISchemaCompiler";
import { compileToJsonAISchema2 } from "./DocTypeToJsonAISchemaCompiler2";
import { compileToJsonAISchema3 } from "./DocTypeToJsonAISchemaCompiler3";
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
writeFileSync("../compiler/schemas/Superheroes8+.json", JSON.stringify(jsonSchema))

const jsonAISchema = compileToJsonAISchema(lowered)
writeFileSync(outputDir+"/ai-schema.json", JSON.stringify(jsonAISchema, null, 4))
writeFileSync("D:\\AI\\geminiAITest\\ai-schema.json", JSON.stringify(jsonAISchema, null, 4))
const jsonAISchema2 = compileToJsonAISchema2(lowered)
writeFileSync(outputDir+"/ai-schema2.json", JSON.stringify(jsonAISchema2, null, 4))
writeFileSync("D:\\AI\\geminiAITest\\ai-schema2.json", JSON.stringify(jsonAISchema2, null, 4))
const jsonAISchema3 = compileToJsonAISchema3(lowered)
writeFileSync(outputDir+"/ai-schema3.json", JSON.stringify(jsonAISchema3, null, 4))
writeFileSync("D:\\AI\\geminiAITest\\ai-schema3.json", JSON.stringify(jsonAISchema3, null, 4))