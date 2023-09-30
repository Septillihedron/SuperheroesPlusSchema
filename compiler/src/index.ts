import { readFileSync } from 'fs';
import JSON5 from 'json5';
import { compile } from './compiler';
import { preprocess } from './preprocessor';
import { splitFullSchema } from './SchemaSplitter';
import { forEachEntry } from './utils';
import { writeFile } from 'fs/promises';

const code = readFileSync('../properties.json', 'utf-8')
const ast = JSON5.parse(code)
const preprocessed = preprocess(ast)
const fullSchema = compile(preprocessed)
const splitted = splitFullSchema(fullSchema)

function saveSchema(name: string, json: any, readable=false) {
    const jsonString = JSON.stringify(json, undefined, readable? 4 : undefined)
    writeFile(`./schemas/${name}.json`, jsonString, 'utf-8')
}

saveSchema('FullSchema', fullSchema, true)
forEachEntry(splitted, (plugin, schema) => {
    saveSchema(plugin, schema)
})
