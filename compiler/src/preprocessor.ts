import { Schema, Property, PropertyMap, Type } from "./PreprocessedSchema"
import { objectPropertyMap } from "./utils"

export function preprocess(unprocessed: any): Schema {
	delete unprocessed.$schema
	unprocessed = unprocessed as Schema
	objectPropertyMap(unprocessed).forEach((types: extendableMap) => {
		resolveExtends(types)
		objectPropertyMap(types).forEach((type: Type) => {
			if (!type.properties) return
			objectPropertyMap(type.properties).forEach(property => addDefaultToDescription(property))
		})
	})
	return unprocessed
}

type extendableMap = {[key: string] : Type}

function resolveExtends(extendableMap: extendableMap) : void {
	objectPropertyMap(extendableMap).forEach((type, name) => {
		var extendsVal = type.extends
		if (!extendsVal) return
		var extendedProperties = extendableMap[extendsVal].properties
		if (!extendedProperties) return
		var properties = type.properties
		if (!properties) return

		Object.keys(extendedProperties).forEach(propertyKey => {
			delete (properties as PropertyMap)[propertyKey]
		})
	})
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
