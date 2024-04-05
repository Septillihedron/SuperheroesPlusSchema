import { Schema, Property, Item } from "./PreprocessedSchema"
import { StringRecord, forEachEntry, forEachValue } from "./utils"

type UnprocessedItem = Item & {extends?: string, available?: boolean}

export function preprocess(unprocessed: any): Schema {
	delete unprocessed.$schema
	forEachValue(unprocessed, (items: StringRecord<UnprocessedItem>) => {
		resolveExtends(items)
		forEachValue(items, (item: Item) => {
			item.requireMode ??= true
			addExclusiveToDescription(item)
			walkItemProperties(item, addDefaultToDescription)
		})
		forEachEntry(items, (name, item) => {
			if (item.available === false) {
				delete items[name]
				return
			}
			delete item.available
		})
	})
	forEachEntry(unprocessed.types, (name, type: Property & {internal?: true}) => {
		if (type.internal === true) delete unprocessed.types[name]
	})
	return unprocessed
}

function resolveExtends(items: StringRecord<UnprocessedItem>) : void {
	forEachEntry(items, (name, type) => {
		type.available ??= true
		if (!type.extends) return
		items[name] = deepMerge(structuredClone(items[type.extends]), type)
		delete items[name].extends
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

function addExclusiveToDescription(item: Item) {
	if (!item.exclusiveTo) return
	item.description += `\n\nOnly available if you have the ${item.exclusiveTo} plugin`
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
