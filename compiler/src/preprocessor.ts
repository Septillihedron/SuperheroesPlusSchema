import { Properties, PropertyMap, Type } from "./Properties"

export function preprocess(unprocessed: any): Properties {
	delete unprocessed.$schema
	unprocessed = unprocessed as Properties
	Object.keys(unprocessed).forEach(key => {
		resolveExtends(unprocessed[key])
	})
	return unprocessed
}

type extendableMap = {[key: string] : Type}

function resolveExtends(extendableMap: extendableMap) : void {
	Object.keys(extendableMap).forEach(name => {
		var type = extendableMap[name]
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
