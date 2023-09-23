import { StringRecord } from "./utils"

export {
	Schema,
	Descriptable,  
	PropertyMap,
	PropertyTypes, PropertyStringTypes, PropertyType, 
	PropertiesMap, PropertiesMapKey, Property, 
	IfPath,

	Item, Trigger, Modes, Condition, Effect, TypeDefinition, 

	Skill,
	DamageModifier, Reward,
	Distribution
}

interface Schema {
	triggers: StringRecord<Trigger>
	conditions: StringRecord<Condition>
	effects: StringRecord<Effect>

	skills: StringRecord<Skill>

	damagemodifiers: StringRecord<DamageModifier>
	rewards: StringRecord<Reward>
	
	distributions: StringRecord<Distribution>

	types: StringRecord<TypeDefinition>
}

interface Descriptable {
	description: string
}

type PropertyMap = StringRecord<Property>

type Plugins ="Superheroes" | "EnchantedBosses" | "EnchantedCombat"

interface Item extends Descriptable {
	properties?: PropertyMap
	available: boolean
	requireMode: boolean
	exclusiveTo?: Plugins
}

interface Trigger extends Item {}

type Modes = "SELF" | "OTHER" | "LOCATION" | "ITEM" | "ALL"
interface Condition extends Item {
	supportedModes?: Modes[]
}

interface Effect extends Item {
	supportedModes?: Modes[]
}

interface Skill extends Item {}

interface DamageModifier extends Item {}
interface Reward extends Item {}

interface Distribution extends Item {}

type PropertyTypes = PropertyStringTypes | "array" | "object" | "string" | "number" | "integer" | "boolean"
type PropertyStringTypes = "string" | "range" | "comparison" | "operation" | "entity" | "block" | "item" | "enchantment" | "potion" | "biome" | "world" | "equipmentSlot" | "attribute" | "sound" | "condition" | "effect"
type PropertiesMap = {
	key: PropertiesMapKey
	value: Property
}
type PropertyType = PropertyTypes | PropertyTypes[]
interface PropertiesMapKey extends Descriptable {
	type: PropertyType
}
interface Property extends Descriptable {
	default?: any
	required: boolean
	type: PropertyType
	min?: number
	max?: number
	items?: PropertyType | Property
	properties?: PropertyMap
	patternProperties?: PropertyMap
	propertiesMap?: PropertiesMap
	if?: IfPath
	requireEnum?: boolean
	enum?: any[]
}

interface IfPath {
	[key: string]: IfPath
	const?: any
}

interface TypeDefinition {
	type: PropertyType
	properties?: PropertyMap
	patternProperties?: PropertyMap
	propertiesMap?: PropertiesMap
	ref?: string
	extends?: string
	requireEnum?: boolean
	enum?: any[]
	pattern?: string
	internal?: boolean
}
