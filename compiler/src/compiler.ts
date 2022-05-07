import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"

export function compile(preprocessed: Preprocessed.Schema): Compiled.Schema {
	var schema = new Compiled.Schema()

	addTypes(schema, preprocessed)

	return schema
}

function addTypes({definitions}: Compiled.Schema, preprocessed: Preprocessed.Schema): void {
	definitions.skill.addSkill("CUSTOM")
	Object.keys(preprocessed.conditions)
		.forEach(name => definitions.condition.addType(name))
	Object.keys(preprocessed.effects)
		.forEach(name => definitions.effect.addType(name))
}
