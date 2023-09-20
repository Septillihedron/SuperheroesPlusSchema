import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"
import { forEachEntry } from "./utils"

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
		const {skills, triggers, conditions, effects, types} = preprocessed;
		forEachEntry(skills, this.compileSkill.bind(this));
		forEachEntry(triggers, this.compileTrigger.bind(this));
		forEachEntry(conditions, this.compileCondition.bind(this));
		forEachEntry(effects, this.compileEffect.bind(this));
		delete types.effect;
		delete types.condition;
		forEachEntry(types, this.compileType.bind(this));
		this.addInternalTypes();

		return schema
	}

	addCustomSkill(): void {
		let {definitions, skills} = this.schema
		definitions.skill.addSkill("CUSTOM", "A custom skill, used in combination with the SkillsLibrary")
		var skill = new Compiled.SkillDefinition()
		skill.addProperty("trigger", { $ref: "#/definitions/trigger" })
		skill.addProperty("effects", {
			patternProperties: {
				".*": { $ref: "#/definitions/effect" }
			},
			type: "object",
			description: "The list of effetcs"
		})
		skills["CUSTOM"] = skill
	}

	addProperties(definition: Compiled.Definition, properties: Preprocessed.PropertyMap | undefined, path: string) {
		if (properties === undefined) return
		for (const [name, property] of Object.entries(properties)) {
			const propertyClass = new Compiled.PropertyClass(definition, name, path+name);
			let compiledProperty = this.compileProperty(property, propertyClass);
			definition.addProperty(name, compiledProperty, property.required)
		}
	}

	compileSkill(name: string, preprocessed: Preprocessed.Skill): void {
		let compiled = new Compiled.SkillDefinition()

		if (preprocessed.available) {
			this.schema.definitions.skill.addSkill(name, preprocessed.description)
		}
		this.addProperties(compiled, preprocessed.properties, `#/skills/${name}/properties/`);

		this.schema.skills[name] = compiled
	}
	
	compileTrigger(name: string, preprocessed: Preprocessed.Trigger): void {
		let compiled = new Compiled.TriggerDefinition()

		if (preprocessed.available) {
			this.schema.definitions.trigger.addType(name, preprocessed.description)
		}
		this.addProperties(compiled, preprocessed.properties, `#/triggers/${name}/properties/`);

		this.schema.triggers[name] = compiled
	}
	
	compileCondition(name: string, preprocessed: Preprocessed.Condition): void {
		let compiled = new Compiled.ConditionDefinition(preprocessed.supportedModes!)

		if (preprocessed.available) {
			this.schema.definitions.condition.addType(name, preprocessed.description)
		}
		if (preprocessed.requireMode) compiled.requireMode()
		this.addProperties(compiled, preprocessed.properties, `#/conditions/${name}/properties/`);

		this.schema.conditions[name] = compiled
	}
	
	compileEffect(name: string, preprocessed: Preprocessed.Effect): void {
		let compiled = new Compiled.EffectDefinition(preprocessed.supportedModes!)

		if (preprocessed.available) {
			this.schema.definitions.effect.addType(name, preprocessed.description)
		}
		
		if (preprocessed.requireMode) compiled.requireMode()
		this.addProperties(compiled, preprocessed.properties, `#/effects/${name}/properties/`);

		this.schema.effects[name] = compiled
	}
	
	compileType(name: string, type: Preprocessed.TypeDefinition): void {
		let compiledType = new Compiled.PropertyClass(this.schema.types, name, `#/types/${name}`)
		
		compiledType.pattern = type.pattern
		compiledType.additionalProperties = false
		if (type.type !== undefined) this.PropertyPartsCompiler.type(type.type, compiledType)
		this.PropertyPartsCompiler.enum(type.enum, compiledType)
		this.PropertyPartsCompiler.properties(type.properties, compiledType)
		this.PropertyPartsCompiler.patternProperties(type.patternProperties, compiledType)
		this.PropertyPartsCompiler.propertiesMap(type.propertiesMap, compiledType)
		this.PropertyPartsCompiler.requireEnum(type.requireEnum, compiledType)
		deletePropertyClassHelperProperties(compiledType)

		this.schema.types[name] = compiledType;
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
		type: (type: Preprocessed.PropertyTypes | Preprocessed.PropertyTypes[], compilingProperty) => {
			if (type instanceof Array) {
				compilingProperty.addType(type)
			} else {
				compilingProperty.addType([type])
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
			if (compilingProperty.properties === undefined) compilingProperty.properties = {}
			forEachEntry(properties, (name, property) => {
				let propertyPath = `${compilingProperty.path.asString()}/properties/${name}`
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass(compilingProperty.properties!, name as string, propertyPath))
				
				compilingProperty.addProperty(name as string, compiledProperty)
			})
		},
		patternProperties: (patternProperties, compilingProperty) => {
			if (patternProperties === undefined) return
			compilingProperty.additionalProperties = false
			if (compilingProperty.patternProperties === undefined) compilingProperty.patternProperties = {}
			forEachEntry(patternProperties, (name, property) => {
				let propertyPath = `${compilingProperty.path.asString()}/patternProperties/${name}`
				let compiledProperty = this.compileProperty(property, 
					new Compiled.PropertyClass(compilingProperty.patternProperties!, name as string, propertyPath))
	
				compilingProperty.addPatternProperty(name as string, compiledProperty)
			})
		},
		propertiesMap: (propertiesMap, compilingProperty) => {
			if (propertiesMap === undefined) return
			compilingProperty.additionalProperties = true
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
					if (type.requireEnum) compilingProperty.additionalProperties = false
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
		if: (property, compilingProperty) => {
			
		},
		description: (description, compilingProperty) => {
			compilingProperty.setDescription(description)
		},
		enum: (enumVal, compilingProperty) => {
			if (enumVal === undefined) return
			compilingProperty.setEnum(enumVal)
		},
		requireEnum: (requireEnumVal, compilingProperty) => {
			if (requireEnumVal === undefined) return
			if (compilingProperty.anyOf !== undefined) throw new Error("Outside implementation bound")
			if (compilingProperty.type !== "string") throw new Error("Outside implementation bound")
			if (compilingProperty.enum === undefined) throw new Error("Outside implementation bound / I coded something wrong")
			compilingProperty.anyOf = [{type: "string"}, {type: "string", enum: compilingProperty.enum}]
			compilingProperty.enum = undefined
			compilingProperty.type = undefined
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
