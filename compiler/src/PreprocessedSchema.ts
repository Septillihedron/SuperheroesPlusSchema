
export {
	Schema,
	Descriptable,  
	PropertyMap, Type, Trigger, ConditionModes, Condition, EffectModes, Effect, TypeDefinition, 
	PropertyTypes, PropertyStringTypes, PropertyType, 
	PropertiesMap, PropertiesMapKey, Property, 
	IfPath
}

interface Schema {
	triggers: {[key: string] : Trigger}
	conditions: {[key: string] : Condition}
	effects: {[key: string] : Effect}
	types: {[key: string] : TypeDefinition}
}

interface Descriptable {
	description: string
}

type PropertyMap = {[key: string] : Property}

interface Type extends Descriptable {
	properties?: PropertyMap
	available?: boolean
	extends?: string
	requireMode?: boolean
}

interface Trigger extends Type {}

type ConditionModes = "SELF" | "OTHER" | "LOCATION" | "ITEM" | "ALL"
interface Condition extends Type {
	supportedModes?: ConditionModes[]
}

type EffectModes = "SELF" | "OTHER" | "LOCATION" | "ITEM" | "ALL"
interface Effect extends Type {
	supportedModes?: EffectModes[]
}

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
	items?: PropertyType
	properties?: PropertyMap
	patternProperties?: PropertyMap
	propertiesMap?: PropertiesMap
	ref?: string
	if?: IfPath
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
	enum?: any[]
	pattern?: string
	internal?: boolean
}
