import { PropertyTypes } from "./PreprocessedSchema";
import { StringRecord } from "./utils";

export {
	FullSchema, 
	Types, IfThenReference, 
	Path, Property, PropertyClass, PropertyMap, types, 
	Definition,
	Category, NonPluralCategory, pluralToUnpluralCategories
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
	skills: "skill",
	damagemodifiers: "damagemodifier",
	rewards: "reward",
	distributions: "distribution",
}


class FullSchema {

	readonly $schema = "http://json-schema.org/schema";
	readonly type = "object"
	readonly additionalProperties = false
	readonly minProperties = 1
	readonly patternProperties = {
		".*": {
			oneOf: [
				{ $ref: "#/definitions/hero" },
				{ $ref: "#/definitions/boss" },
				{ $ref: "#/definitions/item" },
			]
		}
	}
	readonly definitions = {
		hero: new Hero(),
		boss: new Boss(),
		item: new Item(),

		SLSkill: new SLSkill(),
		trigger: new Trigger(),
		condition: new Condition(),
		effect: new Effect(),
		
		skill: new Skill(),

		damagemodifier: new DamageModifier(),
		reward: new Reward(),

		distribution: new Distribution(),
	}
	readonly triggers: StringRecord<Definition> = {}
	readonly conditions: StringRecord<Definition> = {}
	readonly effects: StringRecord<Definition> = {}

	readonly skills: StringRecord<Definition> = {}

	readonly damagemodifiers: StringRecord<Definition> = {}
	readonly rewards: StringRecord<Definition> = {}

	readonly distributions: StringRecord<Definition> = {}

	readonly types: StringRecord<Property> = {}
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
		skin: {
			description: "The skin that will replace the user's skin. \n\n(You can skins with values and signatures at https://mineskin.org/)",
			type: "object",
			properties: {
				value: {
					description: "The skin value",
					type: "string"
				},
				signature: {
					description: "The skin signature",
					type: "string"
				}
			},
			required: ["value", "signature"]
		},
		icon: {
			description: "The icon for this hero in the selection GUI",
			type: "object",
			$ref: "#/types/ItemStackData"
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
		},
		plusUltraSkills: {
			description: "Works the same as `skills` but only activates when SuperheroesPlusUltra is installed. Probably only used by the developer to add PlusUltra skills into default Superheroes heroes without breaking it",
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
class Boss {
	readonly description = "Boss name"
	readonly type = "object"
	readonly additionalProperties = false
	readonly properties = {
		colouredName: {
			description: "The coloured name that will appear ingame. \n\nDefaults to Boss name",
			type: "string"
		},
		description: {
			description: "The description of the boss. \n\nDefaults to Boss name + \" description\"",
			type: "string"
		},
		entity: {
			description: "The entity that the boss is",
			$ref: "#/types/EntityData"
		},
		skills: {
			description: "The list of skill that the boss has",
			type: "object",
			additionalProperties: false,
			patternProperties: {
				".*": {
					$ref: "#/definitions/SLSkill"
				}
			}
		},
		bossbar: {
			description: "The styling for a boss bar",
			$ref: "#/types/BossBarData"
		},
		autospawn: {
			description: "The data for spawning behavior",
			$ref: "#/types/SpawnData"
		},
		damagemodifier: {
			description: "The modifier that modifies the amount of damage the boss will recieve when damaged",
			$ref: "#/definitions/damagemodifier"
		},
		reward: {
			description: "The reward for killing the boss",
			$ref: "#/definitions/reward"
		}
	}
}
class Item {
	readonly description = "Item name"
	readonly type = "object"
	readonly additionalProperties = false
	readonly properties = {
		item: {
			description: "The skill item",
			$ref: "#/types/ItemStackData"
		},
		levels: {
			description: "The level data",
			type: "object",
			additionalProperties: false,
			properties: {
				maxLevel: {
					description: "The maximum level",
					type: "number",
					minimum: 0,
					default: 0
				}
			},
			patternProperties: {
				"^([2-9])|([1-9]+[0-9])$": {
					description: "The level data",
					type: "object",
					additionalProperties: false,
					properties: {
						experienceRequired: {
							description: "The experience required to level up",
							type: "number"
						}
					},
					required: ["experienceRequired"]
				}
			}
		},
		distribution: {
			type: "object",
			description: "The list of distributions",
			patternProperties: {
				".*": {
					$ref: "#/definitions/distribution"
				}
			}
		},
		slots: {
			description: "The list of slots",
			type: "array",
			items: {
				description: "A slot",
				anyOf: [
					{
						type: "number"
					},
					{
						$ref: "#/types/equipmentSlot"
					}
				]
			}
		},
		skills: {
			description: "The list of skill that the item has",
			type: "object",
			additionalProperties: false,
			patternProperties: {
				".*": {
					$ref: "#/definitions/SLSkill"
				}
			}
		}
	}
	readonly required = ["item"]
}


type constDescription = {const: string, description: string}

type Types_oneOf = ({ enum: string[], oneOf: constDescription[] }|{})[]

class Types {
	readonly description: string
	readonly type = "string"
	oneOf?: Types_oneOf = undefined

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

	constructor(type: string, name: string) {
		this.if = {properties: type == "skill"? {skill:{const: name}} : {type: {const: name}}}
		this.then = {$ref: `#/${type}s/${name}`}
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
		this.else.allOf.push(new IfThenReference("trigger", name))
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
		this.else.allOf.push(new IfThenReference("condition", name))
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
		this.else.allOf.push(new IfThenReference("effect", name))
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
		this.else.allOf.push(new IfThenReference("skill", name))
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
		this.else.allOf.push(new IfThenReference("damagemodifier", name))
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
		this.else.allOf.push(new IfThenReference("reward", name))
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
		this.else.allOf.push(new IfThenReference("distribution", name))
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
	addType(types: PropertyTypes[]): void {
		if (types.length === 0) return
		if (types.length === 1) {
			const parsedType = this.parseType(types[0])
			Object.assign(this, parsedType)
			return
		}
		types.map(this.parseType).forEach(p => this.addAnyOf(p))
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
