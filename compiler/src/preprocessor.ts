import { Properties, PropertyMap, Type } from "./Properties"
import { objectPropertyMap } from "./utils"

export function preprocess(unprocessed: any): Properties {
	delete unprocessed.$schema
	unprocessed = unprocessed as Properties
	objectPropertyMap(unprocessed).forEach((types: extendableMap) => {
		resolveExtends(types)
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

