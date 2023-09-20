import { Schema, Property, Item } from "./PreprocessedSchema"
import { StringRecord, forEachEntry, forEachValue } from "./utils"

type extendableType = Item & {extends?: string}
type extendableMap = StringRecord<extendableType>

export function preprocess(unprocessed: any): Schema {
	delete unprocessed.$schema
	forEachValue(unprocessed, (types: extendableMap) => {
		resolveExtends(types)
		forEachValue(types, (type: Item) => {
			type.requireMode ??= true;
			walkItemProperties(type, addDefaultToDescription);
		})
	})
	return unprocessed
}

function resolveExtends(extendableMap: extendableMap) : void {
	forEachEntry(extendableMap, (name, type) => {
		var extendsVal = type.extends
		type.available ??= true
		if (!extendsVal) return
		extendableMap[name] = deepMerge(structuredClone(extendableMap[extendsVal]), type)
		delete extendableMap[name]["extends"]
	})
}

function deepMerge<T extends Object>(merged: T, overrides: T): T {
	for (const _key in overrides) {
		const key = _key as keyof T & string
		if (merged[key] === undefined || typeof overrides[key] !== "object") merged[key] = overrides[key]
		else merged[key] = deepMerge<any>(merged[key], overrides[key])
	}
	return merged
}

function walkItemProperties(item: Item, func: (property: Property) => void) {
	forEachValue(item.properties, property => walkProperty(property, func))
}

function walkProperty(property: Property | undefined, func: (property: Property) => void) {
	if (property == undefined) return

	func(property)

	forEachValue(property.properties, property => walkProperty(property, func))
	forEachValue(property.patternProperties, property => walkProperty(property, func))
	walkProperty(property.propertiesMap?.value, func)
}

function addDefaultToDescription(property: Property | undefined): void {
	if (property == undefined) return
	var defaultVal = property.default
	if (defaultVal === undefined) return
	var description = property.description
	if (property.description.match(/.*(default|Default).*/)) return

	property.description = `${description}. \nDefaults to ${JSON.stringify(defaultVal)}`

}
