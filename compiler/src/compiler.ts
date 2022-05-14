import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"
import { objectPropertyMap } from "./utils"

export function compile(preprocessed: Preprocessed.Schema): Compiled.Schema {
	var schema = new Compiled.Schema()

	addTypes(schema, preprocessed)
	addCustomSkill(schema)
	objectPropertyMap(preprocessed.conditions).forEach((condition: Preprocessed.Condition, name) => {
		if (condition.available === false) return
		addCondition(schema, name as string, condition)
	})
	objectPropertyMap(preprocessed.effects).forEach((effect: Preprocessed.Effect, name) => {
		if (effect.available === false) return
		addEffect(schema, name as string, effect)
	})

	return schema
}

function addTypes({definitions}: Compiled.Schema, preprocessed: Preprocessed.Schema): void {
	definitions.skill.addSkill("CUSTOM")
	Object.keys(preprocessed.conditions)
		.forEach(name => definitions.condition.addType(name))
	Object.keys(preprocessed.effects)
		.forEach(name => definitions.effect.addType(name))
}

function addCustomSkill({skills}: Compiled.Schema): void {
	var skill = new Compiled.SkillDefinition()
	skill.addProperty("trigger", {$ref: "#/definitions/trigger"})
	skill.addProperty("effects", {
		patternProperties: {
			".*": { $ref: "#/definitions/effect" }
		},
		type: "object",
		description: "The list of effetcs"
	})
	skills["CUSTOM"] = skill
}

function addCondition({conditions}: Compiled.Schema, name: string, condition: Preprocessed.Condition): void {
	let compiledCondition = new Compiled.ConditionDefinition(condition.supportedModes!)
	if (condition.typeProperties !== undefined) {
		objectPropertyMap(condition.typeProperties)
			.forEach((property, name) => {
				let compiledProperty = compileProperty(property, 
					new Compiled.PropertyClass(conditions, name as string, `#/conditions/${name}`))
				compiledCondition.addProperty(name as string, compiledProperty, property.required)
			})
	}
	
	conditions[name] = compiledCondition
}

function addEffect({effects}: Compiled.Schema, name: string, effect: Preprocessed.Effect): void {
	let compiledEffect = new Compiled.ConditionDefinition(effect.supportedModes!)
	if (effect.typeProperties !== undefined) {
		objectPropertyMap(effect.typeProperties)
			.forEach((property, name) => {
				let compiledProperty = compileProperty(property, 
					new Compiled.PropertyClass(effects, name as string, `#/effects/${name}`))
				compiledEffect.addProperty(name as string, compiledProperty, property.required)
			})
	}
	
	effects[name] = compiledEffect
}

type propertyPartsCompiler = {
	[Key in keyof Preprocessed.Property]-?: 
		(property: Preprocessed.Property[Key], compilingProperty: Compiled.PropertyClass) => void
}

const PropertyPartsCompiler: propertyPartsCompiler = {
	default: (defaultVal, compilingProperty) => {
		compilingProperty.setDefault(defaultVal)
	},
	required: (required, compilingProperty) => {
		if (!required) return
		if (compilingProperty.parent instanceof Compiled.PropertyClass) {
			compilingProperty.parent.addRequired(compilingProperty.name)
		}
	},
	type: (type, compilingProperty) => {
		if (type instanceof Array) {
			type.forEach(type => compilingProperty.addType(type))
		} else {
			compilingProperty.addType(type)
		}
	},
	min: (min, compilingProperty) => {
		if (min !== undefined) compilingProperty.setMin(min)
	},
	max: (max, compilingProperty) => {
		if (max !== undefined) compilingProperty.setMax(max)
	},
	items: (items, compilingProperty) => {
		if (items === undefined) return
		var itemsProperty = new Compiled.PropertyClass(compilingProperty, "items")
		deletePropertyClassHelperProperties(itemsProperty)
		PropertyPartsCompiler.type(items, itemsProperty)
		compilingProperty.setItems(itemsProperty)
	},
	properties: (properties, compilingProperty) => {
		if (properties === undefined) return
		objectPropertyMap(properties).forEach((property, name) => {
			let compiledProperty = compileProperty(property, 
				new Compiled.PropertyClass(compilingProperty, name as string))
			
			compilingProperty.addProperty(name as string, compiledProperty)
		})
	},
	patternProperties: (patternProperties, compilingProperty) => {
		if (patternProperties === undefined) return
		objectPropertyMap(patternProperties).forEach((property, name) => {
			let compiledProperty = compileProperty(property, 
				new Compiled.PropertyClass(compilingProperty, name as string))
		
			compilingProperty.addProperty(name as string, compiledProperty)
		})
	},
	propertiesMap: (property, compilingProperty) => {
		
	},
	ref: ($ref, compilingProperty) => {
		
	},
	if: (property, compilingProperty) => {
		
	},
	description: (description, compilingProperty) => {
		compilingProperty.setDescription(description)
	},
	enum: (enumVal, compilingProperty) => {
		if (enumVal === undefined) return
		compilingProperty.setEnum(enumVal)
	}
}

function compileProperty(property: Preprocessed.Property, compilingProperty: Compiled.Property): Compiled.Property {

	Object.keys(property).forEach(key => {
		(PropertyPartsCompiler as any)[key]((property as any)[key], compilingProperty)
	})

	deletePropertyClassHelperProperties(compilingProperty)

	return compilingProperty
}

function deletePropertyClassHelperProperties(property: Compiled.Property): Compiled.Property {
	Object.keys(property).forEach(key => {
		if (["parent", "path", "name"].includes(key)) delete (property as any)[key]
	})
	return property
}
