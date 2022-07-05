import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"
import { objectPropertyMap } from "./utils"

export class Compiler {

	preprocessed: Preprocessed.Schema
	schema: Compiled.Schema

	constructor(preprocessed: Preprocessed.Schema) {
		this.preprocessed = preprocessed
		this.schema = new Compiled.Schema()
	}

	compile() {
		let {schema, preprocessed} = this
		this.addCustomSkill()
		objectPropertyMap(preprocessed.skills).forEach((skill: Preprocessed.Skill, name) => {
			schema.skills[name] = this.compileSkill(skill)
			if (skill.available === false) return
			schema.definitions.skill.addSkill(name as string, skill.description)
		})
		objectPropertyMap(preprocessed.triggers).forEach((trigger: Preprocessed.Trigger, name) => {
			schema.triggers[name] = this.compileTrigger(trigger)
			if (trigger.available === false) return
			schema.definitions.trigger.addType(name as string, trigger.description)
		})
		objectPropertyMap(preprocessed.conditions).forEach((condition: Preprocessed.Condition, name) => {
			schema.conditions[name] = this.compileCondition(condition)
			if (condition.available === false) return
			schema.definitions.condition.addType(name as string, condition.description)
		})
		objectPropertyMap(preprocessed.effects).forEach((effect: Preprocessed.Effect, name) => {
			schema.effects[name] = this.compileEffect(effect)
			if (effect.available === false) return
			schema.definitions.effect.addType(name as string, effect.description)
		})
		objectPropertyMap(preprocessed.types).forEach((type: Preprocessed.TypeDefinition, name) => {
			if (["condition", "effect"].includes(name as string)) return
			schema.types[name] = this.compileType(name as string, type)
		})
		this.addInternalTypes();

		return schema
	}

	addCustomSkill(): void {
		let {definitions, skills} = this.schema
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

	compileSkill(skill: Preprocessed.Skill): Compiled.SkillDefinition {
		let compiledSkill = new Compiled.SkillDefinition()
		if (skill.extends !== undefined) {
			let extendedName = skill.extends
			let properties = this.preprocessed.skills[extendedName].properties;
			if (properties === undefined) properties = {}
			compiledSkill.setExtension(extendedName, properties)
		}
		if (skill.properties === undefined) return compiledSkill
		objectPropertyMap(skill.properties)
			.forEach((property, name) => {
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass({}, name as string, `#/skills/${name}`))
				compiledSkill.addProperty(name as string, compiledProperty, property.required)
			})
		return compiledSkill
	}
	
	compileTrigger(trigger: Preprocessed.Trigger): Compiled.TriggerDefinition {
		let compiledTrigger = new Compiled.TriggerDefinition()
		if (trigger.extends !== undefined) {
			let extendedName = trigger.extends
			let properties = this.preprocessed.triggers[extendedName].properties;
			if (properties === undefined) properties = {}
			compiledTrigger.setExtension(extendedName, properties)
		}
		if (trigger.properties === undefined) return compiledTrigger
		objectPropertyMap(trigger.properties)
			.forEach((property, name) => {
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass({}, name as string, `#/triggers/${name}`))
				compiledTrigger.addProperty(name as string, compiledProperty, property.required)
			})
	
		return compiledTrigger
	}
	
	compileCondition(condition: Preprocessed.Condition): Compiled.ConditionDefinition {
		let compiledCondition = new Compiled.ConditionDefinition(condition.supportedModes!)
		let requireMode: boolean | undefined = undefined
		if (condition.extends !== undefined) {
			let extendedName = condition.extends
			let extendedCondition = this.preprocessed.conditions[extendedName]
			let properties = extendedCondition.properties;
			if (properties === undefined) properties = {}
			compiledCondition.setExtension(extendedName, properties)
			requireMode = extendedCondition.requireMode
		}
		requireMode = condition.requireMode === undefined? requireMode : condition.requireMode
		if (requireMode === true || requireMode === undefined) compiledCondition.requireMode()
		if (condition.properties === undefined) return compiledCondition
		objectPropertyMap(condition.properties)
			.forEach((property, name) => {
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass({}, name as string, `#/conditions/${name}`))
				compiledCondition.addProperty(name as string, compiledProperty, property.required)
			})
	
		return compiledCondition
	}
	
	compileEffect(effect: Preprocessed.Effect): Compiled.EffectDefinition {
		let compiledEffect = new Compiled.EffectDefinition(effect.supportedModes!)
		let requireMode: boolean | undefined = undefined
		if (effect.extends !== undefined) {
			let extendedName = effect.extends
			let extendedEffect = this.preprocessed.effects[extendedName]
			let properties = extendedEffect.properties;
			if (properties === undefined) properties = {}
			compiledEffect.setExtension(extendedName, properties)
			requireMode = extendedEffect.requireMode
		}
		requireMode = effect.requireMode === undefined? requireMode : effect.requireMode
		if (requireMode === true || requireMode === undefined) compiledEffect.requireMode()
		if (effect.properties === undefined) return compiledEffect
		objectPropertyMap(effect.properties)
			.forEach((property, name) => {
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass({}, name as string, `#/effects/${name}`))
				compiledEffect.addProperty(name as string, compiledProperty, property.required)
			})
	
		return compiledEffect
	}
	
	compileType(name: string, type: Preprocessed.TypeDefinition): Compiled.Property {
		let compiledType = new Compiled.PropertyClass(this.schema.types, name, `#/types/${name}`)
		
		compiledType.pattern = type.pattern
		compiledType.additionalProperties = false
		if (type.type !== undefined) this.PropertyPartsCompiler.type(type.type, compiledType)
		this.PropertyPartsCompiler.enum(type.enum, compiledType)
		this.PropertyPartsCompiler.properties(type.properties, compiledType)
		this.PropertyPartsCompiler.patternProperties(type.patternProperties, compiledType)
		this.PropertyPartsCompiler.propertiesMap(type.propertiesMap, compiledType)
		if (type.extends !== undefined) compiledType.set$ref(`#/types/${type.extends}`)
		deletePropertyClassHelperProperties(compiledType)
	
		return compiledType
	}
	
	addInternalTypes(): void {
		let {types} = this.schema
		types["condition"] = {
			type: "object",
			$ref: "#/definitions/condition"
		}
		types["effect"] = {
			type: "object",
			$ref: "#/definitions/effect"
		}
	}

	PropertyPartsCompiler: propertyPartsCompiler = {
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
			if (typeof items === "string" || items instanceof Array) {
				deletePropertyClassHelperProperties(itemsProperty)
				this.PropertyPartsCompiler.type(items, itemsProperty)
			} else {
				this.compileProperty(items, itemsProperty)
			}
			compilingProperty.setItems(itemsProperty)
		},
		properties: (properties, compilingProperty) => {
			if (properties === undefined) return
			compilingProperty.additionalProperties = false
			objectPropertyMap(properties).forEach((property, name) => {
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass(compilingProperty, name as string))
				
				compilingProperty.addProperty(name as string, compiledProperty)
			})
		},
		patternProperties: (patternProperties, compilingProperty) => {
			if (patternProperties === undefined) return
			compilingProperty.additionalProperties = false
			objectPropertyMap(patternProperties).forEach((property, name) => {
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass(compilingProperty, name as string))
	
				compilingProperty.addPatternProperty(name as string, compiledProperty)
			})
		},
		propertiesMap: (propertiesMap, compilingProperty) => {
			if (propertiesMap === undefined) return
			compilingProperty.additionalProperties = false
			let keyProperty = new Compiled.PropertyClass(compilingProperty, "propertyNames")
			this.compileProperty({required: false, ...propertiesMap.key}, keyProperty)
			let valueProperty = new Compiled.PropertyClass(compilingProperty, "propertyContent")
			propertiesMap.value.required = false
			this.compileProperty(propertiesMap.value, valueProperty)
			compilingProperty.setPropertyNames(keyProperty)
			
			let typesName = propertiesMap.key.type
			if (!(typesName instanceof Array)) {
				typesName = [typesName]
			}
			let enumValues: string[] = []
			typesName.forEach(typeName => {
				let type = this.preprocessed.types[typeName]
				if (type.enum !== undefined) {
					enumValues.push(...type.enum)
				}
				while (type.extends !== undefined) {
					type = this.preprocessed.types[type.extends]
					if (type.enum !== undefined) {
						enumValues.push(...type.enum)
					}
				}
			})
			if (enumValues.length === 0) {
				compilingProperty.addPatternProperty(".*", valueProperty)
				return
			}
			compilingProperty.setPropertyContent(valueProperty)
			let propertyContentPath = `${compilingProperty.path.asString()}/propertyContent`
			enumValues.forEach(value => compilingProperty.addProperty(value, {$ref: propertyContentPath}))
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

	compileProperty(property: Preprocessed.Property, compilingProperty: Compiled.Property): Compiled.Property {

		Object.keys(property).forEach(key => {
			if (key in this.PropertyPartsCompiler) {
				(this.PropertyPartsCompiler as any)[key]((property as any)[key], compilingProperty)
			} else {
				(compilingProperty as any)[key] = (property as any)[key]
			}
		})

		deletePropertyClassHelperProperties(compilingProperty)
	
		return compilingProperty
	}

}

type propertyPartsCompiler = {
	[Key in keyof Preprocessed.Property]-?: 
		(property: Preprocessed.Property[Key], compilingProperty: Compiled.PropertyClass) => void
}

function deletePropertyClassHelperProperties(property: Compiled.Property): Compiled.Property {
	Object.keys(property).forEach(key => {
		if (["parent", "path", "name"].includes(key)) delete (property as any)[key]
	})
	return property
}
