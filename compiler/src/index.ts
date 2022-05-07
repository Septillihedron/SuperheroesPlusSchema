import {readFileSync, writeFileSync} from 'fs';
import JSON5 from 'json5';
import { compile } from './compiler';
import { preprocess } from './preprocessor';
import { Properties } from './Properties';

var code : string = readFileSync('../properties.json', 'utf-8');
var preprocessed: Properties = preprocess(JSON5.parse(code));
var compiled: object = compile(preprocessed)
writeFileSync('./compiled-properties.json', JSON.stringify(compiled), 'utf-8');
