import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"
import { MonoTypeObject, objectPropertyMap } from "./utils"

export function compile(preprocessed: Preprocessed.Schema): Compiled.Schema {
	var schema = new Compiled.Schema()

	addCustomSkill(schema)
	objectPropertyMap(preprocessed.triggers).forEach((trigger: Preprocessed.Trigger, name) => {
		schema.triggers[name] = compileTrigger(trigger, preprocessed.triggers)
		if (trigger.available === false) return
		schema.definitions.trigger.addType(name as string, trigger.description)
	})
	objectPropertyMap(preprocessed.conditions).forEach((condition: Preprocessed.Condition, name) => {
		schema.conditions[name] = compileCondition(condition, preprocessed.conditions)
		if (condition.available === false) return
		schema.definitions.condition.addType(name as string, condition.description)
	})
	objectPropertyMap(preprocessed.effects).forEach((effect: Preprocessed.Effect, name) => {
		schema.effects[name] = compileEffect(effect, preprocessed.effects)
		if (effect.available === false) return
		schema.definitions.effect.addType(name as string, effect.description)
	})
	objectPropertyMap(preprocessed.types).forEach((type: Preprocessed.TypeDefinition, name) => {
		if (["condition", "effect"].includes(name as string)) return
		schema.types[name] = compileType(type, preprocessed.types)
	})
	addInternalTypes(schema);

	return schema
}

function addCustomSkill({definitions, skills}: Compiled.Schema): void {
	definitions.skill.addSkill("CUSTOM", "A custom skill, used in combination with the SkillsLibrary")
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

function compileTrigger(trigger: Preprocessed.Trigger, triggers: MonoTypeObject<Preprocessed.Trigger>): Compiled.TriggerDefinition {
	let compiledTrigger = new Compiled.TriggerDefinition()
	if (trigger.extends !== undefined) {
		let extendedName = trigger.extends
		let properties = triggers[extendedName].typeProperties;
		if (properties === undefined) properties = {}
		compiledTrigger.setExtension(extendedName, properties)
	}
	if (trigger.typeProperties === undefined) return compiledTrigger
	objectPropertyMap(trigger.typeProperties)
		.forEach((property, name) => {
			let compiledProperty = compileProperty(property, 
				new Compiled.PropertyClass(triggers, name as string, `#/triggers/${name}`))
			compiledTrigger.addProperty(name as string, compiledProperty, property.required)
		})

	return compiledTrigger
}

function compileCondition(condition: Preprocessed.Condition, conditions: MonoTypeObject<Preprocessed.Condition>): Compiled.ConditionDefinition {
	let compiledCondition = new Compiled.ConditionDefinition(condition.supportedModes!)
	if (condition.extends !== undefined) {
		let extendedName = condition.extends
		let properties = conditions[extendedName].typeProperties;
		if (properties === undefined) properties = {}
		compiledCondition.setExtension(extendedName, properties)
	}
	if (condition.typeProperties === undefined) return compiledCondition
	objectPropertyMap(condition.typeProperties)
		.forEach((property, name) => {
			let compiledProperty = compileProperty(property, 
				new Compiled.PropertyClass(conditions, name as string, `#/conditions/${name}`))
			compiledCondition.addProperty(name as string, compiledProperty, property.required)
		})

	return compiledCondition
}

function compileEffect(effect: Preprocessed.Effect, effects: MonoTypeObject<Preprocessed.Effect>): Compiled.EffectDefinition {
	let compiledEffect = new Compiled.EffectDefinition(effect.supportedModes!)
	if (effect.extends !== undefined) {
		let extendedName = effect.extends
		let properties = effects[extendedName].typeProperties;
		if (properties === undefined) properties = {}
		compiledEffect.setExtension(extendedName, properties)
	}
	if (effect.typeProperties === undefined) return compiledEffect
	objectPropertyMap(effect.typeProperties)
		.forEach((property, name) => {
			let compiledProperty = compileProperty(property, 
				new Compiled.PropertyClass(effects, name as string, `#/effects/${name}`))
			compiledEffect.addProperty(name as string, compiledProperty, property.required)
		})

	return compiledEffect
}

function compileType(type: Preprocessed.TypeDefinition, types: MonoTypeObject<Preprocessed.TypeDefinition>): Compiled.TypeDefinition {

	let compiledType: Compiled.TypeDefinition = {}

	compiledType.type = type.type as Compiled.types
	compiledType.enum = type.enum
	compiledType.pattern = type.pattern
	if (type.properties !== undefined) {
		compiledType.properties = {}
		objectPropertyMap(type.properties)
			.forEach((property, name) => {
				let compiledProperty = compileProperty(property, 
					new Compiled.PropertyClass(types, name as string, `#/types/${name}`))
				compiledType.properties![name] = compiledProperty
			})
	}
	if (type.patternProperties !== undefined) {
		compiledType.patternProperties = {}
		objectPropertyMap(type.patternProperties)
			.forEach((property, name) => {
				let compiledProperty = compileProperty(property, 
					new Compiled.PropertyClass(types, name as string, `#/types/${name}`))
				compiledType.patternProperties![name] = compiledProperty
			})
	}
	if (type.extends !== undefined) compiledType.$ref = `#/types/${type.extends}`

	return compiledType
}

function addInternalTypes({types}: Compiled.Schema): void {
	types["condition"] = {
		type: "object",
		$ref: "#/definitions/condition"
	}
	types["effect"] = {
		type: "object",
		$ref: "#/definitions/effect"
	}
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

			compilingProperty.addPatternProperty(name as string, compiledProperty)
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
