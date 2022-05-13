import {readFileSync, writeFileSync} from 'fs';
import JSON5 from 'json5';
import { compile } from './compiler';
import { preprocess } from './preprocessor';
import { Schema } from './PreprocessedSchema';

var code : string = readFileSync('../properties.json', 'utf-8');
var preprocessed: Schema = preprocess(JSON5.parse(code));
var compiled: object = compile(preprocessed)
writeFileSync('./compiled-properties.json', JSON.stringify(compiled, null, 4), 'utf-8');
writeFileSync('./compiled-properties-compressed.json', JSON.stringify(compiled), 'utf-8');
