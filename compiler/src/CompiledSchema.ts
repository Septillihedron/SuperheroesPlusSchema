import { PropertyTypes } from "./PreprocessedSchema";
import { Boss, Hero, Hero8, Item } from "./SchemaRoots";
import { StringRecord } from "./utils";

export {
	FullSchema, 
	Property, PropertyClass, 
	Definition,
	Category, pluralToUnpluralCategories
}

type Category = keyof {
	[K in keyof FullSchema as FullSchema[K] extends StringRecord<Definition>? K : never]: K
}
type NonPluralCategory = keyof {
	[K in keyof FullSchema["definitions"] as FullSchema["definitions"][K] extends UnionType? K : never]: K
}

const pluralToUnpluralCategories: Record<Category, NonPluralCategory> = {
	triggers: "trigger",
	conditions: "condition",
	effects: "effect",
	particleShapes: "particleShape",
	entityData: "EntityData",
	skills: "skill",
	damagemodifiers: "damagemodifier",
	rewards: "reward",
	distributions: "distribution",
}


class FullSchema {
	readonly $schema = "http://json-schema.org/draft-07/schema#";
	readonly oneOf = [
		{ $ref: "#/definitions/hero" },
		{ $ref: "#/definitions/hero8+" },
		{ $ref: "#/definitions/boss" },
		{ $ref: "#/definitions/item" },
	]
	readonly definitions = {
		hero: Hero,
		"hero8+": Hero8,
		boss: Boss,
		item: Item,

		SLSkill: new SLSkill(),
		trigger: new Trigger(),
		condition: new Condition(),
		effect: new Effect(),

		particleShape: new ParticleShape(),
		EntityData: new EntityData(),
		
		skill: new Skill(),

		damagemodifier: new DamageModifier(),
		reward: new Reward(),

		distribution: new Distribution(),
	}
	readonly triggers: StringRecord<Definition> = {}
	readonly conditions: StringRecord<Definition> = {}
	readonly effects: StringRecord<Definition> = {}

	readonly entityData: StringRecord<Definition> = {}
	readonly particleShapes: StringRecord<Definition> = {}

	readonly skills: StringRecord<Definition> = {}

	readonly damagemodifiers: StringRecord<Definition> = {}
	readonly rewards: StringRecord<Definition> = {}

	readonly distributions: StringRecord<Definition> = {}

	readonly types: StringRecord<Property> = {}
}

type constDescription = {const: string, description: string}

class Types {
	readonly description: string
	readonly type = "string"
	oneOf?: constDescription[] = undefined

	addType(name: string, description: string): void {
		if (!this.oneOf) this.oneOf = []
		this.oneOf.push({const: name, description: description})
	}

	constructor(description: string) {
		this.description = description
	}
}

class IfThenReference {
	if: {properties: {type: {const: string}} | {skill: {const: string}}}
	then: {$ref: string}

	constructor(type: Category, name: string) {
		this.if = {properties: type == "skills"? {skill:{const: name}} : {type: {const: name}}}
		this.then = {$ref: `#/${type}/${name}`}
	}

}

class SLSkill {
	readonly description = "A skill"
	readonly type = "object"
	readonly properties = {
		trigger: { $ref: "#/definitions/trigger" },
		effects: {
			patternProperties: {
				".*": { $ref: "#/definitions/effect" }
			},
			type: "object",
			description: "The list of effetcs"
		}
	}

}

interface UnionType {
	addType(name: string, description: string): void
}

class Trigger implements UnionType {
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
	readonly else: {allOf: IfThenReference[]} = {allOf: []}
	readonly required = ["type"]

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("triggers", name))
	}
}

class Condition implements UnionType {
	readonly description = "A condition"
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the condition"),
		mode: {
			description: "The condition mode",
			type: "string"
		},
		else: {
			description: "The list of effects that will be called when the condition is false",
			type: "object",
			patternProperties: {
				".*": {
					$ref: "#/definitions/effect"
				}
			}
		}
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("conditions", name))
	}
}

class Effect implements UnionType {
	readonly description = "An effect"
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
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("effects", name))
	}
}

class ParticleShape implements UnionType {
	readonly description = "A particle shape"
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the particle shape")
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("particleShapes", name))
	}
}

class EntityData implements UnionType {
	readonly description = "An entity data"
	readonly type = "object"
	readonly properties = {
		type: {
			description: "The entity type. \nDefaults to \"ZOMBIE\"",
			$ref: "#/types/entity", 
		},
		shouldDespawn: {
			description: "Whether the entity can despawn. TODO. \nDefaults to true",
			type: "boolean",
			default: true
		},
		nametag: {
			description: "The nametag of the spawned entity. \n\nDefaults to no nametag",
			type: "string",
			default: ""
		},
		customNameVisible: {
			description: "Whether the entity shows it's custom name/nametag above it like a player. \nDefaults to false",
			type: "boolean",
			default: false
		},
		silent: {
			description: "Whether the entity makes sound. \nDefaults to false",
			type: "boolean",
			default: false
		},
		visualFire: {
			description: "Whether the entity will always be on fire (only visually). \nDefaults to false",
			type: "boolean",
			default: false
		},
		attributes: {
			description: "The attributes of the entity. \nDefaults to \"{}\"",
			$ref: "#/types/AttributeData",
			default: "{}"
		},
		passenger: {
			description: "The entity riding this entity. \nDefaults to \"{}\"",
			$ref: "#/types/EntityData",
			default: "{}"
		}
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, _description: string): void {
		this.else.allOf.push(new IfThenReference("entityData", name))
	}
}

class Skill implements UnionType {
	readonly description = "A skill"
	readonly type = "object"
	readonly properties = {
		skill: new Types("The type of the skill"), 
		conditions: {
			description: "The list of conditions that the skill has",
			type: "object",
			additionalProperties: false,
			patternProperties: {
				".*": {
					$ref: "#/definitions/condition"
				}
			}
		}
	}
	readonly required = ["skill"]
	readonly if = {"properties": {"skill": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.skill.addType(name, description)
		this.else.allOf.push(new IfThenReference("skills", name))
	}
}

class DamageModifier implements UnionType {
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the damage modifier")
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("damagemodifiers", name))
	}
}

class Reward implements UnionType {
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the reward")
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("rewards", name))
	}
}

class Distribution implements UnionType {
	readonly type = "object"
	readonly properties = {
		type: new Types("The type of the distribution")
	}
	readonly required = ["type"]
	readonly if = {"properties": {"type": false}}
	readonly else: {allOf: IfThenReference[]} = {allOf: []}

	addType(name: string, description: string): void {
		this.properties.type.addType(name, description)
		this.else.allOf.push(new IfThenReference("distributions", name))
	}
}

type types = "array" | "object" | "string" | "number" | "integer" | "boolean"

type PropertyMap = StringRecord<Property>

class Path {

	readonly parts: string[]

	constructor(...parts: string[]) {
		if (parts.length == 1) {
			this.parts = parts[0].split("/")
		} else {
			this.parts = parts
		}
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
	minItems?: number
	maxItems?: number
	properties?: PropertyMap
	patternProperties?: PropertyMap
	minProperties?: number
	maxProperties?: number
	$ref?: string
	if?: Property
	then?: Property
	else?: Property
	required?: string[]
	enum?: any[]
	allOf?: Property[]
	oneOf?: Property[]
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
	if?: Property
	then?: Property
	else?: Property
	required?: string[]
	enum?: any[]
	allOf?: Property[]
	oneOf?: Property[]
	anyOf?: Property[]
	propertyNames?: Property
	pattern?: string
	propertyContent?: Property
	additionalProperties?: boolean

	recordItem?: Property
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
		} else if (!("path" in parent)) {// this if should never happen
			this.path = new Path()
		} else {
			this.path = new Path(...parent.path.parts, name)
		}
	}

	setDescription(description: string): void {
		this.description = description
	}
	setDefault(defaultVal: any): void {
		this.default = defaultVal
	}
	setRecordItem(recordItem: PropertyTypes) {
		this.recordItem = this.parseType(recordItem)
	}
	setTypes(types: PropertyTypes[]): void {
		if (types.length === 0) return
		if (types.length === 1) {
			const parsedType = this.parseType(types[0])
			Object.assign(this, parsedType)
			return
		}
		types.map(this.parseType).forEach(p => this.addOneOf(p))
	}
	private static readonly typesArray = ["array", "object", "string", "number", "integer", "boolean"]
	private parseType(type: PropertyTypes): Property {
		if (PropertyClass.typesArray.includes(type)) {
			return {type: type as types}
		} else if (type === "record") {
			if (this.recordItem === undefined) {
				throw new Error("[Implementation Error] Record item is used before is set")
			}
			return {
				type: "object",
				additionalProperties: false,
				patternProperties: {
					".*": this.recordItem
				}
			}
		} else {
			return {$ref: `#/types/${type}`}
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
	setIf(ifVal: Property): void {
		this.if = ifVal
	}
	setThen(then: Property): void {
		this.then = then
	}
	setElse(elseVal: Property): void {
		this.else = elseVal
	}
	setIfThenElse(ifVal: Property, then: Property, elseVal?: Property): void {
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
	addOneOf(property: Property): void {
		if (this.oneOf === undefined) this.oneOf = []
		this.oneOf.push(property)
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

class Definition {
	readonly properties: StringRecord<Property | boolean>
	required?: string[]
	readonly additionalProperties = false
	if?: true
	then?: {$ref: string, additionalProperties: true}

	constructor(properties: StringRecord<Property | boolean>) {
		this.properties = structuredClone(properties)
	}

	addProperty(name: string, property: Property, required?: boolean): void {
		this.properties[name] = property
		if (required) this.addRequired(name)
	}
	requireMode() {
		this.addRequired("mode")
	}

	private addRequired(item: string) {
		this.required ??= [];
		this.required.push(item)
	}

}
