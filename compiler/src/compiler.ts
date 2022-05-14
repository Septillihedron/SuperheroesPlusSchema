import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"

export function compile(preprocessed: Preprocessed.Schema): Compiled.Schema {
	var schema = new Compiled.Schema()

	addTypes(schema, preprocessed)
	addCustomSkill(schema)

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
