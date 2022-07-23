import { IfPath, PropertyTypes, EffectModes, ConditionModes } from "./PreprocessedSchema";
import { MonoTypeObject, objectPropertyMap } from "./utils";

export {
	Schema, 
	Hero, Skill, Trigger, Condition, Effect, 
	Types, IfThenRefrence, 
	Path, Property, PropertyClass, PropertyMap, types, 
	TriggerDefinition, ConditionDefinition, EffectDefinition
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
	readonly triggers: MonoTypeObject<TriggerDefinition> = {}
	readonly conditions: MonoTypeObject<ConditionDefinition> = {}
	readonly effects: MonoTypeObject<EffectDefinition> = {}
	readonly types: MonoTypeObject<Property> = {}
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

type constDescription = {const: string, description: string}

type Types_oneOf = ({ enum: string[], oneOf: constDescription[] }|{})[]

class Types {
	readonly description: string
	readonly type = "string"
	readonly oneOf: Types_oneOf = [{}]

	addType(name: string, description: string): void {
		this.oneOf.push({const: name, description: description})
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
	readonly description = "A skill"
	readonly type = "object"
	readonly properties = {
		trigger: {$ref: "#/definitions/trigger"},
		effects: {
			patternProperties: {
				".*": { $ref: "#/definitions/effect" }
			},
			type: "object",
			description: "The list of effetcs"
		}
	}

}

class Trigger {
	readonly description = "The skill trigger"
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of trigger"),
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
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenRefrence[]} = {allOf: []}
	readonly required = ["type"]

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenRefrence("trigger", name))
	}
}

class Condition {
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the condition"),
		mode: {
			description: "The condition mode",
			type: "string"
		}
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenRefrence[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenRefrence("condition", name))
	}
}

class Effect {
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the effect"),
		mode: {
			description: "The effect mode",
			type: "string"
		}
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenRefrence[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenRefrence("effect", name))
	}
}

type types = "array" | "object" | "string" | "number" | "integer" | "boolean"

type PropertyMap = MonoTypeObject<Property>

class Path {

	readonly parts: string[]

	constructor(...parts: string[]) {
		if (parts.length == 1) {
			this.parts = parts[0].split("/")
		} else {
			this.parts = parts
		}
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
	propertyNames?: Property
	pattern?: string
	propertyContent?: Property
	additionalProperties?: boolean
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
	propertyNames?: Property
	pattern?: string
	propertyContent?: Property
	additionalProperties?: boolean

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
		let parsedType = this.parseType(type)
		if (parsedType === undefined) return

		this.addAnyOf({ type: parsedType })
	}
	private static readonly typesArray = ["array", "object", "string", "number", "integer", "boolean"]
	private parseType(type: PropertyTypes): types | undefined {
		if (PropertyClass.typesArray.includes(type)) {
			return type as types
		} else {
			this.addAnyOf({$ref: `#/types/${type}`})
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
	addAnyOf(property: Property): void {
		if (this.anyOf === undefined) this.anyOf = []
		this.anyOf.push(property)
	}
	setPropertyNames(property: Property): void {
		this.propertyNames = property
	}
	setPattern(pattern: string): void {
		this.pattern = pattern
	}
	setPropertyContent(property: Property) {
		this.propertyContent = property
	}

}

abstract class Definition {
	readonly properties: MonoTypeObject<Property | boolean>
	required?: string[]
	readonly additionalProperties = false
	if?: true
	then?: {$ref: string, additionalProperties: true}

	constructor(properties: MonoTypeObject<Property | boolean>) {
		this.properties = properties
	}

	addProperty(name: string, property: Property, required?: true): void {
		this.properties[name] = property
		if (required) {
			if (this.required === undefined) this.required = []
			this.required.push(name)
		}
	}
	requireMode() {
		if (this.required === undefined) this.required = ["mode"]
		else this.required.push("mode")
	}
	protected internalSetExtension(type: string, extension: string, extendedProperties: MonoTypeObject<any>) {
		this.if = true
		this.then = {$ref: `#/${type}s/${extension.toUpperCase()}`, additionalProperties: true}
		Object.keys(extendedProperties).forEach(name => this.properties[name] = true)
	}

}

class TriggerDefinition extends Definition {

	constructor() {
		super({ type: true, conditions: true })
	}

	setExtension(extension: string, extendedProperties: MonoTypeObject<any>) {
		this.internalSetExtension("trigger", extension, extendedProperties)
	}

}

class ConditionDefinition extends Definition {
	
	constructor(modes: ConditionModes[]) {
		super({ type: true, mode: { enum: modes } })
	}

	setExtension(extension: string, extendedProperties: MonoTypeObject<any>) {
		this.internalSetExtension("condition", extension, extendedProperties)
	}

}

class EffectDefinition extends Definition {

	constructor(modes: EffectModes[]) {
		super({ type: true, mode: { enum: modes } })
	}

	setExtension(extension: string, extendedProperties: MonoTypeObject<any>) {
		this.internalSetExtension("effect", extension, extendedProperties)
	}

}
