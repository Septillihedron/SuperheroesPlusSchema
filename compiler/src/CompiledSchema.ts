import { IfPath, PropertyTypes, EffectModes, ConditionModes } from "./PreprocessedSchema";
import { MonoTypeObject } from "./utils";

export {
	Schema, 
	Hero, Skill, Trigger, Condition, Effect, 
	Types, IfThenRefrence, 
	Path, Property, PropertyClass, PropertyMap, types, 
	SkillDefinition, ConditionDefinition, EffectDefinition
}

class Schema {

	readonly $schema = "http://json-schema.org/schema";
	readonly type = "object"
	readonly additionalProperties = false
	readonly minProperties = 1
	readonly patternProperties = {
		".*": {
			$ref: "#/definitions/hero"
		}
	}
	readonly definitions = {
		hero: new Hero(),
		skill: new Skill(),
		trigger: new Trigger(),
		condition: new Condition(),
		effect: new Effect()
	}
	readonly skills: MonoTypeObject<SkillDefinition> = {}
	readonly conditions: MonoTypeObject<ConditionDefinition> = {}
	readonly effects: MonoTypeObject<EffectDefinition> = {}

}

class Hero {
	readonly description = "Hero name"
	readonly type = "object"
	readonly additionalProperties = false
	readonly properties = {
		colouredName: {
			description: "The coloured name that will appear ingame",
			type: "string"
		},
		description: {
			description: "The description of the hero",
			type: "string"
		},
		skills: {
			description: "The list of skill that the hero has",
			type: "object",
			additionalProperties: false,
			patternProperties: {
				".*": {
					$ref: "#/definitions/skill"
				}
			}
		}
	}
}

class Types {
	readonly description: string
	static readonly type = "string"
	readonly enum: string[] = []

	addType(name: string): void {
		this.enum.push(name)
	}

	constructor(description: string) {
		this.description = description
	}
}

class IfThenRefrence {
	if: {properties: {type: {const: string}} | {skill: {const: string}}}
	then: {$ref: string}

	constructor(type: string, name: string) {
		this.if = {properties: type == "skill"? {skill:{const: name}} : {type: {const: name}}}
		this.then = {$ref: `#/${type}s/${name}`}
	}

}

class Skill {
	static readonly description = "A skill"
	static readonly type = "object"
	readonly properties = { skill: new Types("The type of the skill") }
	static readonly required = ["skill"]
	readonly if = {"properties": {"skill": {"const": null}}}
	readonly else: {allOf: IfThenRefrence[]} = {allOf: []}

	addSkill(name: string): void {
		this.properties.skill.addType(name)
		this.else.allOf.push(new IfThenRefrence("skill", name))
	}
}

class Trigger {
	static readonly description = "The skill trigger"
	static readonly type = "object"
	readonly properties = {
		// type: new Types("The type of trigger"),
		type: {
			description: "The type of trigger",
			type: "string"
		},
		conditions: {
			description: "The list of conditions",
			type: "object",
			patternProperties: {
			".*": {
					$ref: "#/definitions/condition"
				}
			}
		}
	}
	static readonly required = ["type"]

	// addType(name: string): void {
	// 	this.properties.skill.addType(name)
	// 	this.allOf.push(new IfThenRefrence("skill", name))
	// }
}

class Condition {
	static readonly type = "object"
	static readonly additionalProperties = true
	readonly properties = {
		type: new Types("The type of the condition"),
		mode: {
			description: "The condition mode",
			type: "string"
		}
	}
	static readonly required = ["type", "mode"]
	readonly if = {"properties": {"type": {"const": null}}}
	readonly else: {allOf: IfThenRefrence[]} = {allOf: []}

	addType(name: string): void {
		this.properties.type.addType(name)
		this.else.allOf.push(new IfThenRefrence("condition", name))
	}
}

class Effect {
	static readonly type = "object"
	static readonly additionalProperties = true
	readonly properties = {
		type: new Types("The type of the effect"),
		mode: {
			description: "The effect mode",
			type: "string"
		}
	}
	readonly if = {"properties": {"type": {"const": null}}}
	readonly else: {allOf: IfThenRefrence[]} = {allOf: []}

	addType(name: string): void {
		this.properties.type.addType(name)
		this.else.allOf.push(new IfThenRefrence("effect", name))
	}
}

type types = "array" | "object" | "string" | "number" | "integer" | "boolean"

type PropertyMap = MonoTypeObject<Property>

class Path {

	readonly parts: string[]

	constructor(parts: string)
	constructor(...parts: string[])
	constructor(parts: string[] | string) {
		if (parts instanceof Array) {
			this.parts = parts
			return
		}
		this.parts = parts.split("/")
	}

	asIf(content: IfPath): IfPath {
		var originalPath: IfPath = {}
		var path: IfPath = originalPath
		this.parts.forEach((part: string) => {
			path[part] = {}
			path = path[part]
		})
		return originalPath
	}
	asString(): string {
		return this.parts.join("/")
	}

}

type Property = {
	description?: string
	default?: any
	type?: types | types[]
	minimum?: number
	maximum?: number
	items?: Property
	properties?: PropertyMap
	patternProperties?: PropertyMap
	$ref?: string
	if?: IfPath
	then?: Property
	else?: Property
	required?: string[]
	enum?: any[]
	allOf?: Property[]
	anyOf?: Property[]
}

class PropertyClass implements Property {
	description?: string
	default?: any
	type?: types | types[]
	minimum?: number
	maximum?: number
	items?: Property
	properties?: PropertyMap
	patternProperties?: PropertyMap
	$ref?: string
	if?: IfPath
	then?: Property
	else?: Property
	required?: string[]
	enum?: any[]
	allOf?: Property[]
	anyOf?: Property[]

	name: string
	path: Path
	parent: object

	constructor(parent: object, name: string, path: string)
	constructor(parent: {path: Path}, name: string)
	constructor(parent: {path: Path} | object, name: string, path?: string) {
		this.name = name
		this.parent = parent

		if (path !== undefined) {
			this.path = new Path(path)
			return
		}
		if (!("path" in parent)) {// this if should never happen
			this.path = new Path()
			return
		}
		this.path = new Path(...parent.path.parts, name)
	}

	setDescription(description: string): void {
		this.description = description
	}
	setDefault(defaultVal: any): void {
		this.default = defaultVal
	}
	addType(type: PropertyTypes): void {
		if (this.type === undefined) {
			this.type = this.parseType(type)
			return
		}
		if (this.type instanceof Array) {
			this.type.push(this.parseType(type))
			return
		}
		this.type = [this.type, this.parseType(type)]
	}
	private static readonly typesArray = ["array", "object", "string", "number", "integer", "boolean"]
	private parseType(type: PropertyTypes): types {
		if (PropertyClass.typesArray.includes(type)) {
			return type as types
		} else {
			// this.addAllOf({$ref: `#/types/${type}`})
			return "string"
		}
	}
	setMin(min: number): void {
		this.minimum = min
	}
	setMax(max: number): void {
		this.maximum = max
	}
	setRange(min: number, max: number): void {
		this.minimum = min
		this.maximum = max
	}
	setItems(items: Property): void {
		this.items = items
	}
	addProperty(name: string, property: Property): void {
		if (this.properties == undefined) this.properties = {}
		this.properties[name] = property
	}
	addPatternProperty(name: string, patternPropety: Property): void {
		if (this.patternProperties == undefined) this.patternProperties = {}
		this.patternProperties[name] = patternPropety
	}
	set$ref($ref: string): void {
		this.$ref = $ref
	}
	setIf(ifVal: IfPath): void {
		this.if = ifVal
	}
	setThen(then: Property): void {
		this.then = then
	}
	setElse(elseVal: Property): void {
		this.else = elseVal
	}
	setIfThenElse(ifVal: IfPath, then: Property, elseVal?: Property): void {
		this.if = ifVal
		this.then = then
		if (elseVal !== undefined) this.else = elseVal
	}
	addRequired(required: string): void {
		if (this.required === undefined) this.required = []
		this.required.push(required)
	}
	setEnum(enumVal: any[]): void {
		this.enum = enumVal
	}
	addAllOf(property: Property): void {
		if (this.allOf === undefined) this.allOf = []
		this.allOf.push(property)
	}

}

class SkillDefinition {
	readonly properties: {
		skill: true,
		[key: string]: Property | boolean
	}
	required?: string[]
	static readonly additionalProperties = true

	constructor() {
		this.properties = { skill: true }
		this.required = []
	}

	addProperty(name: string, property: Property, required?: true): void {
		this.properties[name] = property
		if (required) {
			if (this.required === undefined) this.required = []
			this.required.push(name)
		}
	}

}

class ConditionDefinition {
	readonly properties: {
		type: true,
		mode?: {enum: ConditionModes[]},
		[key: string]: Property | boolean | undefined
	}
	required?: string[]
	static readonly additionalProperties = false
	$ref?: string
	
	constructor(modes: ConditionModes[]) {
		this.properties = { type: true, mode: { enum: modes } }
	}

	addProperty(name: string, property: Property, required?: true): void {
		this.properties[name] = property
		if (required) {
			if (this.required === undefined) this.required = []
			this.required.push(name)
		}
	}
	setExtension(condition: string) {
		this.$ref = `#/conditions/${condition.toUpperCase()}`
	}
}

class EffectDefinition {
	readonly properties: {
		type: true,
		mode?: {enum: EffectModes[]},
		[key: string]: Property | boolean | undefined
	}
	required?: string[]
	static readonly additionalProperties = false
	if?: true
	then?: {$ref: string}

	constructor(modes: EffectModes[]) {
		this.properties = { type: true, mode: { enum: modes } }
	}

	addProperty(name: string, property: Property, required?: true): void {
		this.properties[name] = property
		if (required) {
			if (this.required === undefined) this.required = []
			this.required.push(name)
		}
	}
	setExtension(condition: string) {
		this.if = true
		this.then = {$ref: `#/effects/${condition.toUpperCase()}`}
	}
}
