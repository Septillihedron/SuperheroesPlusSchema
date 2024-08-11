import * as Preprocessed from "./PreprocessedSchema"
import * as Compiled from "./CompiledSchema"
import { StringRecord, forEachEntry } from "./utils"

export function compile(preprocessed: Preprocessed.Schema) {
	return new Compiler(preprocessed).compile()
}

export class Compiler {

	preprocessed: Preprocessed.Schema
	schema: Compiled.FullSchema
	definitionExtraProperties: Record<Compiled.Category, StringRecord<Compiled.Property | boolean>>

	constructor(preprocessed: Preprocessed.Schema) {
		this.preprocessed = preprocessed
		this.schema = new Compiled.FullSchema()
		// TODO: fix this, too error prone
		this.definitionExtraProperties = {
			triggers: { type: true, conditions: true },
			conditions: { type: true, else: true },
			effects: { type: true },
			particleShapes: { type: true },
			entityData: { type: true, shouldDespawn: true, nametag: true, customNameVisible: true, silent: true, visualFire: true, attributes: true, passenger: true},
			skills: { skill: true, conditions: true },
			damagemodifiers: { type: true },
			rewards: { type: true },
			distributions: { type: true }
		}
	}

	compile() {
		let {schema, preprocessed} = this
		this.addCustomSkill()
		const {types, ...itemsCategory} = preprocessed;
		forEachEntry(itemsCategory, 
			(category, items) => forEachEntry(items, this.compileItem.bind(this, category))
		)
		forEachEntry(types, this.compileType.bind(this));
		this.addInternalTypes();

		return schema
	}

	addCustomSkill(): void {
		let {definitions, skills} = this.schema
		definitions.skill.addType("CUSTOM", "A custom skill, used in combination with the SkillsLibrary")
		var skill = new Compiled.Definition(this.definitionExtraProperties.skills)
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

	compileItem(
		category: Compiled.Category, 
		name: string, 
		preprocessed: Preprocessed.Item, 
	) {
		const extraProperties = this.definitionExtraProperties[category];
		const compiled = new Compiled.Definition(extraProperties)
		if (preprocessed.supportedModes) {
			compiled.addProperty("mode", { enum: preprocessed.supportedModes })
		}

		if (preprocessed.supportedModes && preprocessed.requireMode) compiled.requireMode()

		const unpluralCategory = Compiled.pluralToUnpluralCategories[category]
		this.schema.definitions[unpluralCategory].addType(name, preprocessed.description)
		this.addProperties(compiled, preprocessed.properties, `#/${category}/${name}/properties/`);

		this.schema[category][name] = compiled
	}
	
	compileType(name: string, type: Preprocessed.Property): void {
		let compiledType = new Compiled.PropertyClass(this.schema.types, name, `#/types/${name}`)
		
		compiledType.additionalProperties = false
		this.PropertyPartsCompiler.recordItem(type.recordItem, compiledType)
		this.PropertyPartsCompiler.type(type.type, compiledType)
		this.PropertyPartsCompiler.enum(type.enum, compiledType)
		this.PropertyPartsCompiler.properties(type.properties, compiledType)
		this.PropertyPartsCompiler.patternProperties(type.patternProperties, compiledType)
		this.PropertyPartsCompiler.propertiesMap(type.propertiesMap, compiledType)
		this.PropertyPartsCompiler.requireEnum(type.requireEnum, compiledType)
		this.PropertyPartsCompiler.pattern(type.pattern, compiledType)
		deletePropertyClassHelperProperties(compiledType)

		this.schema.types[name] = compiledType;
	}
	
	addInternalTypes(): void {
		let {types} = this.schema
		for (const category of Object.values(Compiled.pluralToUnpluralCategories)) {
			types[category] = {
				type: "object",
				$ref: `#/definitions/${category}`
			}
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
		recordItem(recordItem, compilingProperty) {
			if (recordItem === undefined) return
			compilingProperty.setRecordItem(recordItem)
		},
		type: (type: Preprocessed.PropertyTypes | Preprocessed.PropertyTypes[], compilingProperty) => {
			if (type instanceof Array) {
				compilingProperty.setTypes(type)
			} else {
				compilingProperty.setTypes([type])
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
			})
			if (enumValues.length === 0) {
				compilingProperty.addPatternProperty(".*", valueProperty)
				return
			}
			compilingProperty.setPropertyContent(valueProperty)
			let propertyContentPath = `${compilingProperty.path.asString()}/propertyContent`
			enumValues.forEach(value => compilingProperty.addProperty(value, {$ref: propertyContentPath}))
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
		},
		pattern: (pattern, compilingProperty) => {
			if (pattern === undefined) return
			compilingProperty.setPattern(pattern)
		},
	}

	compileProperty(property: Preprocessed.Property, compilingProperty: Compiled.PropertyClass): Compiled.Property {
		this.PropertyPartsCompiler.recordItem(property.recordItem, compilingProperty)
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
		if (["recordItem", "parent", "path", "name"].includes(key)) delete (property as any)[key]
	})
	return property
}
