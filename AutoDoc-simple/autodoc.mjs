
import { readFileSync, readdir, readdirSync, writeFileSync } from 'fs'
import { parse } from './parser.mjs'

/**
 * @typedef {"primitive" | "enum" | "enumList" | "setData" | "configData" | "inlineConfigData" | "uncategorized"} ParameterCategory
 */

/**
 * @type {Record<ParameterCategory, RegExp>}
 */
const lineRegexes = {
    enum: /(?:[a-zA-Z_0-9]+) = (?<Type>([A-Z][a-zA-Z]+\.?)+)\.valueOf\(configurationSection.getString\("(?<ParamName>[a-zA-Z_0-9]+)"(, (?<Default>.*?))?\)\).*?;/,
    enumList: /(?:[a-zA-Z_0-9]+) = configurationSection\.getStringList\(\"(?<ParamName>[a-zA-Z_0-9]+)\"\)\.stream\(\)\.map\([^()]*(?<Type>[A-Z][a-zA-Z]+)(::|\.)valueOf.*?\)\.collect\(Collectors.to(?:[A-Z][a-z]+?)\(\)\);/,
    primitive: /(?:[a-zA-Z_0-9]+) = (\((int|float)\) )?(Math\.([a-z]+)\()?configurationSection.get(?<Type>[A-Z][a-zA-Z]+)\("(?<ParamName>[a-zA-Z_0-9]+)"(, (?<Default>[^()]*?))?\)[^\.(]*?;/,
    setData: /(?:[a-zA-Z_0-9]+) = new SetData<>\((?<Type>[A-Z][a-zA-Z]+)\.class, "(?<ParamName>[a-zA-Z_0-9]+)", configurationSection\);/,
    configData: /(?:[a-zA-Z_0-9]+) = new (?<Type>[A-Z][a-zA-Z]+)\(configurationSection\.getConfigurationSection\("(?<ParamName>[a-zA-Z_0-9]+)"\)\);/,
    inlineConfigData: /(?:[a-zA-Z_0-9]+) = new (?<Type>[a-zA-Z_0-9]+)\(configurationSection\);/,
    uncategorized: /^$/
}

const primitiveMap = new Map([
    ["Boolean", "boolean"],
    ["Int", "integer"],
    ["Long", "integer"],
    ["Double", "number"],
    ["String", "string"],
    ["StringList", "string[]"],
    ["ConfigurationSection", "section"],
])

const enumMap = new Map([
    ["BlockRayMode", "blockRayMode"],
    ["Material", "material"],
    ["EntityType", "entity"],
    ["PlayerTeleportEvent.TeleportCause", "teleportCause"]
])

/**
 * @param {"boolean" | "integer" | "number" | "string" | (string & {})} type
 * @param {any} def
 */
function toLiteral(type, def) {
    if (def == undefined) return def
    switch(type) {
        case 'string': return def.match(/^"(?<String>.*)"$/s)?.groups.String
        case 'number': return Number.parseFloat(def)
        case 'boolean': 
            if (def === "true") return true
            if (def === "false") return false
            throw new Error(`invalid boolean: ${def}`)
        case 'integer': return Number.parseInt(def)
        case 'string[]': return JSON.parse(def)
        default:
            throw new Error(`Invalid literal type: ${type}`)
    }
}

/**
 * @type {Record<ParameterCategory, (matchGroups: Record<string, string>) => [string, string | DocProperty][]>}
 */
const lineProcessors = {
    enum(matchGroups) {
        const type = enumMap.get(matchGroups['Type'])
        if (type === undefined) throw new Error(`Enum mapping missing: ${matchGroups['Type']}`)
        return [[
            matchGroups['ParamName'],
            makeDoc({
                description: "",
                required: !('Default' in matchGroups),
                type: type,
                default: toLiteral("string", matchGroups['Default'])
            })
        ]]
    },
    enumList(matchGroups) {
        const type = enumMap.get(matchGroups['Type'])
        return [[
            matchGroups['ParamName'],
            makeDoc({
                description: "",
                required: false,
                type: "array",
                items: type,
                default: []
            })
        ]]
    },
    primitive(matchGroups) {
        const type = primitiveMap.get(matchGroups['Type'])
        if (type === undefined) throw new Error(`Primitive mapping missing: ${matchGroups['Type']}`)
        const docProperty = {
            description: "",
            required: !('Default' in matchGroups),
            type: type,
            default: matchGroups['Default']
        }
        if (type.endsWith("[]")) {
            docProperty.type = "array"
            docProperty.items = type.substring(0, type.length-2)
        }
        docProperty.default = toLiteral(type, matchGroups['Default'])
        return [[
            matchGroups['ParamName'],
            makeDoc(docProperty)
        ]]
    },
    setData(matchGroups) {
        return [[
            matchGroups['ParamName'],
            makeDoc({
                description: "SetData",
                required: false,
                type: "array",
                items: matchGroups['Type'],
                default: []
            })
        ]]
    },
    configData(matchGroups) {
        return [[
            matchGroups['ParamName'],
            makeDoc({
                description: "",
                required: false,
                type: matchGroups['Type'],
                default: {}
            })
        ]]
    },
    inlineConfigData(matchGroups) {
        if (matchGroups['Type'] === "PotionEffectData") {
            return [
                ["potency", makeDoc({
					"description": "The potency or amplifier of the potion",
					"required": false,
					"type": "integer",
					"default": 1
				})],
				["type", makeDoc({
					"description": "The type of the potion",
					"required": true,
					"type": "potion",
                    "default": undefined
				})],
				["ambient", makeDoc({
					"description": "Whether to make the particles more translucent or not",
					"required": false,
					"type": "boolean",
					"default": true
				})],
				["hasParticles", makeDoc({
					"description": "Whether to make this potion effect has particles or not",
					"required": false,
					"type": "boolean",
					"default": true
				})],
				["duration", makeDoc({
					"description": "The duration of the potion in seconds (1 is 20 ticks). 0 is for infinite duration (Integer maximum ticks)",
					"required": false,
					"type": "number",
					"default": 10
				})]
            ]
        }
        return [[
            "__inline__"+matchGroups['Type'],
            {
                description: "",
                required: true,
                type: matchGroups['Type'],
                default: undefined
            }
        ]]
    },
    uncategorized(matchGroups) {
        return [[
            "__error__"+matchGroups.line,
            {
                description: "Uncategorized line",
                line: matchGroups.line,
                class: matchGroups.class,
                required: true,
                type: "error",
                default: undefined
            }
        ]]
    }
}

/**
 * 
 * @param {DocProperty} doc 
 * @returns {string}
 */
function makeDoc(doc) {
    let typeString = doc.type;
    if (doc.type === "array") {
        if (!("items" in doc)) throw Error("Invalid doc property");
        typeString = doc.items+"[]";
    } else if (doc.type === "record") {
        if (!("recordItem" in doc)) throw Error("Invalid doc property");
        typeString = doc.recordItem+"{}";
    }
    return `${typeString}${doc.required? "!" : "?"} ${doc.default} # ${doc.description}`
}

main()

function main() {
    const skillNameMapping = getSkillMapping()
    const files = readdirSync("skilldata")
    const skills = {}
    for (const file of files) {
        const parsed = parseFile(skillNameMapping, file)
        if (!parsed) continue
        skills[parsed.name] = parsed.doc
    }
    writeFileSync("./out.json", JSON.stringify(skills, null, 4))
}

function parseFile(skillNameMapping, file) {
    const code = readFileSync(`skilldata/${file}`).toString("utf-8")
    const ast = parse(code, file)
    if (ast == undefined) return
    const parameterLines = getParameterLines(ast)
    
    const lineGroups = categorizeLines(parameterLines, ast.className)
    const properties = processLines(lineGroups)
    const skillName = skillNameMapping.get(ast.className) ?? `__${ast.className}__`
    const skillObject = {
        description: "",
        extends: skillNameMapping.get(ast.classExtendsName),
        properties
    }
    return {
        name: skillName,
        doc: skillObject
    }
}



function getSkillMapping() {
    return new Map(
        readFileSync("SkillNameMapping.txt").toString('utf-8')
            .split("\n")
            .map(line => line.trim())
            .map(line => line.split(" "))
            .map(entry => [entry[1], entry[0]])
    )
}

/**
 * @typedef {object} DocProperty
 * @property {string} description
 * @property {boolean} required
 * @property {string} type
 * @property {string} [items]
 * @property {string} [recordItem]
 * @property {any} default
 */

/**
 * @param {MatchedParameterLine[]} lineGroups
 */
function processLines(lineGroups) {
    return lineGroups
        .flatMap(({match, category}) => lineProcessors[category](match))
        .reduce(PropertiesReducer, {})
}

/**
 * @param {{ [x: string]: DocProperty | string; }} acc
 * @param {[string, DocProperty | string]} current
 */
function PropertiesReducer(acc, current) {
    acc[current[0]] = current[1]
    return acc
}

/**
 * @typedef {object} MatchedParameterLine
 * @property {Record<string, string>} match
 * @property {ParameterCategory} category
 */

/**
 * @param {string[]} parameterLines
 * @returns {MatchedParameterLine[]}
 */
function categorizeLines(parameterLines, className) {
    return parameterLines.map(line => {
        for (const [category, regex] of objectEntries(lineRegexes)) {
            const match = line.match(regex)
            if (!match) continue
            if (!match.groups) {
                throw new Error(`Missing match groups for category ${category}, line ${line}`)
            }
            return {match: match.groups, category}
        }
        return {match: {line, class: className}, category: "uncategorized"}
    })
}

/**
 * @template {string} K
 * @template {any} V
 * 
 * @param {Record<K, V>} record 
 * @returns {[K, V][]}
 */
function objectEntries(record) {
    return /** @type {[K, V][]} */ (Object.entries(record))
}

/**
 * @param {import('./parser.mjs').AST} ast
 */
function getParameterLines(ast) {
    let lines = ast.constructorBody.split("\n")
        .map(line => line.trim())
        .filter(line => line.includes("configurationSection"))
        .filter(line => !line.includes("super(skill, configurationSection);"))
    if (ast.classExtendsName === "CooldownData") {
        const cooldownDataSuperRegex = /\s*super\(skill, configurationSection, "(?<Message>.*?)", (?<Time>[0-9]+)\);/
        const matchGroups = lines[0].match(cooldownDataSuperRegex)?.groups
        if (matchGroups == undefined) return lines
        lines.shift()
        lines.unshift(
            "cooldown = configurationSection.getDouble(\"cooldown\", defaultCooldown);",
            "cooldownMessage = configurationSection.getString(\"cooldownMessage\", defaultCooldownMessage);"
        )
    }
    return lines
}

