import { Properties, PropertiesMapEntry, Property, PropertyMap, Type } from "./Properties"
import { objectPropertyMap } from "./utils"

export function preprocess(unprocessed: any): Properties {
	delete unprocessed.$schema
	unprocessed = unprocessed as Properties
	objectPropertyMap(unprocessed).forEach((types: extendableMap) => {
		resolveExtends(types)
		objectPropertyMap(types).forEach((type: Type) => {
			if (!type.typeProperties) return
			objectPropertyMap(type.typeProperties).forEach(property => addDefaultToDescription(property))
		})
	})
	return unprocessed
}

type extendableMap = {[key: string] : Type}

function resolveExtends(extendableMap: extendableMap) : void {
	objectPropertyMap(extendableMap).forEach((type, name) => {
		var extendsVal = type.extends
		if (!extendsVal) return
		delete type.extends
		var extendedProperties = extendableMap[extendsVal].typeProperties
		if (!extendedProperties) return
		var typeProperties = type.typeProperties
		if (!typeProperties) return

		Object.keys(extendedProperties).forEach(propertyKey => {
			delete (typeProperties as PropertyMap)[propertyKey]
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
		objectPropertyMap(property.propertiesMap).forEach((val: PropertiesMapEntry) => addDefaultToDescription(val.value))
	}

	var defaultVal = property.default
	if (defaultVal === undefined) return
	var description = property.description
	if (property.description.match(/.*(default|Default).*/)) return

	property.description = `${description}. \nDefaults to ${defaultVal}`

}
