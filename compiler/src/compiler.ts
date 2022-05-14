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

function compileProperty(property: Preprocessed.Property, compilingProperty: Compiled.Property): Compiled.Property {
	return {}
}
