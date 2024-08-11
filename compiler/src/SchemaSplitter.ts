import { FullSchema } from "./CompiledSchema";

class PartialSchemaBuilder {
    partialSchema: any
    fullSchema: FullSchema

    constructor(fullSchema: FullSchema) {
        this.fullSchema = fullSchema
        
    }

    initialize(root: string): void {
        this.partialSchema = {
            $schema: this.fullSchema.$schema,
            type: this.fullSchema.type,
            additionalProperties: this.fullSchema.additionalProperties,
            minProperties: this.fullSchema.minProperties,
            patternProperties: { ".*": { $ref: `#/definitions/${root}` } },
            definitions: {},
        }
        this.partialSchema.definitions = {
            trigger: this.fullSchema.definitions.trigger,
            condition: this.fullSchema.definitions.condition,
            effect: this.fullSchema.definitions.effect,
            particleShape: this.fullSchema.definitions.particleShape,
            EntityData: this.fullSchema.definitions.EntityData,
        }
        this.partialSchema.definitions[root] = (this.fullSchema.definitions as any)[root]

        this.partialSchema.triggers = this.fullSchema.triggers
        this.partialSchema.conditions = this.fullSchema.conditions
        this.partialSchema.effects = this.fullSchema.effects
        this.partialSchema.particleShapes = this.fullSchema.particleShapes
        this.partialSchema.entityData = this.fullSchema.entityData
        this.partialSchema.types = this.fullSchema.types
    }

    private pluralize(x: string): string {
        return x + "s"
    }

    addItemCollection(name: string): void {
        this.partialSchema.definitions[name] = (this.fullSchema.definitions as any)[name]
        const pluralName = this.pluralize(name)
        if (!(pluralName in this.fullSchema)) return 
        this.partialSchema[pluralName] = (this.fullSchema as any)[pluralName]
    }

    build(): any {
        return this.partialSchema
    }
}

export type SplittedSchemas = {
    Superheroes: any
    EnchantedBosses: any
    EnchantedCombat: any
}

export function splitFullSchema(fullSchema: FullSchema): SplittedSchemas {
    const builder = new PartialSchemaBuilder(fullSchema)

    builder.initialize("hero")
    builder.addItemCollection("skill")
    const Superheroes = builder.build();

    builder.initialize("boss")
    builder.addItemCollection("SLSkill")
    builder.addItemCollection("damagemodifier")
    builder.addItemCollection("reward")
    const EnchantedBosses = builder.build();

    builder.initialize("item")
    builder.addItemCollection("SLSkill")
    builder.addItemCollection("distribution")
    const EnchantedCombat = builder.build();

    return { Superheroes, EnchantedBosses, EnchantedCombat }
}
