import { Schema, Property, PropertyMap, Type } from "./PreprocessedSchema"
import { objectPropertyMap } from "./utils"

export function preprocess(unprocessed: any): Schema {
	delete unprocessed.$schema
	unprocessed = unprocessed as Schema
	objectPropertyMap<extendableMap>(unprocessed).forEach((types: extendableMap) => {
		resolveExtends(types)
		objectPropertyMap(types).forEach((type: Type) => {
			if (!type.properties) return
			objectPropertyMap(type.properties).forEach(property => addDefaultToDescription(property))
		})
	})
	return unprocessed
}

type extendableType = Type & {extends?: string}
type extendableMap = {[key: string] : extendableType}

function resolveExtends(extendableMap: extendableMap) : void {
	objectPropertyMap(extendableMap).forEach((type, name) => {
		var extendsVal = type.extends
		if (type.available === undefined) type.available = true
		if (!extendsVal) return
		extendableMap[name] = deepMerge(extendableMap[extendsVal], type)
		delete extendableMap[name]["extends"]
	})
}

function deepMerge<T extends Object>(object: T, ...objects: T[]): T {
	if (objects.length == 0) return object
	const merged = structuredClone(object)
	const second = objects.shift()
	for (const _key in second) {
		const key = _key as keyof T & string
		if (merged[key] === undefined || typeof second[key] !== "object") merged[key] = second[key]
		else merged[key] = deepMerge<any>(merged[key], second[key])
	}
	return deepMerge(merged, ...objects)
}

function addDefaultToDescription(property: Property): void {
	if (property.properties !== undefined) {
		objectPropertyMap(property.properties).forEach((val: Property) => addDefaultToDescription(val))
	}
	if (property.patternProperties !== undefined) {
		objectPropertyMap(property.patternProperties).forEach((val: Property) => addDefaultToDescription(val))
	}
	if (property.propertiesMap !== undefined) {
		addDefaultToDescription(property.propertiesMap.value)
	}

	var defaultVal = property.default
	if (defaultVal === undefined) return
	var description = property.description
	if (property.description.match(/.*(default|Default).*/)) return

	property.description = `${description}. \nDefaults to ${JSON.stringify(defaultVal)}`

}
