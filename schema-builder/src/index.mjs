import { deepMerge, parseItem } from "./tools.mjs";


const schema = {
    skills: {
        DAMAGEMODIFIER: parseItem({
            expectedMaxDamage: "number? 30.0 # The maximum damage used in the easing calculation", 
            maxDamage: "number? 15.0 # The maximum resulting damage (after calculation)", 
            minDamage: "number? 0.0 # The minimum damage (before calculation)", 
            causes: "damageCause[]? [] # The list of damage causes that is/is not effected",
            entities: "entity[]? [] # The list of entities that is/is not effected",
            whitelist: "boolean? false # Whether to use the `causes` and `entities` list as whitelist",
            incoming: "boolean? false # Whether to apply this for incoming damage", 
            outgoing: "boolean? false # Whether to apply this for outgoing damage / attacks", 
            eased: "boolean? false # Whether to ease out the damage quadratically", 
            priority: "integer? 0 # The priority of the skill. Only the highest priority between the skills of the two players will be applied", 
        }, "Constrains damage, with optional easing out")
    },
    entityData: {
        LIVING_ENTITY: parseItem({
            canEquip: "boolean? false # Whether the entity can pick up items",
            equipment: "EquipmentData? {} # The equipment(s) the entity has",
        }),
        AXOLOTL: parseItem({
            __extends__: "LIVING_ENTITY",
            variant: "axolotlVariant? random # The variant of axolotl. \n\nDefaults to a random variant",
        }),
        ABSTRACT_ARROW: parseItem({
            knockbackStrength: "integer? 0 # The knockback strength of the arrow",
            damage: "number? 2.0 # The amount of damage the arrow will do (in hp / half hearts)",
            pierceLevel: "integer(0..127)? 0 # The amount of times the arrow can pierce through an entity",
            critical: "boolean? false # Whether the arrow should do critical damage",
            pickupStatus: "arrowPickupStatus? DISALLOWED # How the arrow can be picked up",
        }),
        ARROW: parseItem({
            __extends__: "ABSTRACT_ARROW",
            potion: "PotionItemData? {} # The potion data for the arrow",
        }),
        CREEPER: parseItem({
            __extends__: "LIVING_ENTITY",
            fuse: "integer? 30 # The fuse time of the creeper (in ticks)",
            ignited: "boolean? false # Whether the creeper is already ignited/primed",
            explosionRadius: "integer? 3 # The radius of the creeper explosion (in blocks)",
            powered: "boolean? false # Whether the creeper is charged",
        }),
        DROPPED_ITEM: parseItem({
            item: "ItemStackData! # The item the dropped item will be",
        }),
        EXPERIENCE_ORB: parseItem({
            experience: "integer? 1 # The amount of xp this xp orb will have",
        }),
        FALLING_BLOCK: parseItem({
            block: "BlockDataData! # The block that is falling",
            dropItem: "boolean? true # Whether the block can be dropped as an item when the falling block cannot be placed",
            cancelDrop: "boolean? false # Whether or not the block can be placed or dropped as an item",
            hurtEntities: "boolean? false # Whether entities can be damaged by this falling block",
            damagePerBlock: "number? 2 # The damage per block this falling block will deal to an entity",
            maxDamage: "integer? 40 # The maximum damage this falling block can deal",
        }),
        HORSE: parseItem({
            __extends__: "LIVING_ENTITY",
            tamingDifficulty: "integer? 1 # How hard this horse is to tame",
            jumpStrength: "number(0.7..2)? 0.7 # The strength of the horse's jump. TODO",
            hasChest: "boolean? false # Whether this horse have a chest",
            tamed: "boolean? false # Whether this horse is tamed",
            armorSection: "ItemStackData? {} # The armor this horse wears. \n\nDefaults to not wearing armor",
            hasSaddle: "boolean? false # Whether this horse has a saddle",
            color: "horseColor? CHESTNUT # The color of the horse",
            style: "horseStyle? NONE # The style of the horse",
        }),
        SKELETON_HORSE: parseItem({
            __extends__: "HORSE",
        }), 
        ZOMBIE_HORSE: parseItem({
            __extends__: "HORSE",
        }),
        LLAMA: parseItem({
            __extends__: "HORSE", 
            color: "llamaColor? null # The color of this llama. \n\nDefaults to a random color",
            strength: "integer? 1 # How much inventory space this llama can has, equal to `strength*3`",
        }), 
        PRIMED_TNT: parseItem({
            fuseTicks: "integer? 100 # The number of ticks until this TNT blows up (in ticks)",
        }),
        SPECTRAL_ARROW: parseItem({
            __extends__: "ABSTRACT_ARROW",
            glowingTicks: "integer? 200 # The amount of time to apply the glowing effect for (in ticks)",
        }),
        SPLASH_POTION: parseItem({
            potion: "ItemStackData! # The item that this splash potion represent",
        }),
        RABBIT: parseItem({
            variant: "rabbitType? null # The variant of the rabbit. \n\nDefault to a random variant",
        }),
        TRIDENT: parseItem({
            __extends__: "ABSTRACT_ARROW",
        }),
        WITHER_SKULL: parseItem({
            charged: "boolean? false # Whether this wither skull is blue/charged",
        }),
        WOLF: parseItem({
            __extends__: "LIVING_ENTITY",
            angry: "boolean? false # Whether this wolf is angry",
        }),
    },
    particleShape: {
        HELIX: parseItem({
            radius: "number? 0.5",
            speed: "number? 1",
            wave_frequency: "number? 1",
            frequency: "number? 0.05",
            height: "number? 2",
        }),
        // WINGS: parseItem({
            
        // }),
        POINT: parseItem({
            spread: "number? 0.5",
            offset: "number? 0",
        }),
        HALO: parseItem({
            height: "number? 0.3",
            radius: "number? 0.3",
            resolution: "number? 32",
        }),
        WISP: parseItem({
            radius: "number? 0.5",
            speed: "number? 1",
            wave_frequency: "number? 1",
            height: "number? 2",
        }),
        HEART: parseItem({
            height: "number? 2",
            frequency: "number? 0.05",
            size: "number? 1",
        }),
        FAIRY_WINGS: parseItem({
            height: "number? 1",
            frequency: "number? 0.05",
            size: "number? 1",
        }),
        EARS: parseItem({
            height: "number? 0.2",
            frequency: "number? 0.05",
            size: "number? 1",
            spread: "number? 0.2",
        }),
    },
    types: {
        EntityData: parseItem({
            type: "entity! ZOMBIE # The entity type",
            shouldDespawn: "boolean? true # Whether the entity can despawn. TODO",
            nametag: "string? # The nametag of the spawned entity. \n\nDefaults to no nametag",
            customNameVisible: "boolean? false # Whether the entity shows it's custom name/nametag above it like a player",
            silent: "boolean? false # Whether the entity makes sound",
            visualFire: "boolean? false # Whether the entity will always be on fire (only visually)",
            attributes: "AttributeData? {} # The attributes of the entity",
            passenger: "EntityData? {} # The entity riding this entity"
        }),
        ParticleData: parseItem({
            type: "particle? PORTAL",
            duration: "number? 2.5 # in seconds",
            amount: "integer? 1",
            extra: "integer? 0",
            shape: "particleShape!",
            options: "ParticleOptionsData? 0 # only for dust particle",
        }),
        ParticleOptionsData: parseItem({
            colours: "Colour{}? {}",
            scale: "number? 1",
        }),
        Colour: parseItem({
            red: "integer? 0",
            green: "integer? 0",
            blue: "integer? 0",
        }),
        PotionItemData: parseItem({
            type: "potionItemType! UNCRAFTABLE # The potion type", 
            extended: "boolean? false # Whether the potion duration is extended (like when redstone is added when brewing)", 
            upgraded: "boolean? false # Whether the potion is upgraded (level 2) (like when glowstone is added when brewing)", 
        }),
        EquipmentData: parseItem({
            helmet: "EquipmentItemStackData? {} # The item data for the helmet slot", 
            chestplate: "EquipmentItemStackData? {} # The item data for the chestplate slot", 
            leggings: "EquipmentItemStackData? {} # The item data for the leggings slot", 
            boots: "EquipmentItemStackData? {} # The item data for the boots slot", 
            mainhand: "EquipmentItemStackData? {} # The item data for the mainhand slot", 
            offhand: "EquipmentItemStackData? {} # The item data for the offhand slot", 
        }),
        EquipmentItemStackData: parseItem({
            type: "material! STONE # The type of item",
            amount: "integer? 1 # The amount of item to give",
            metadata: "ItemMetaData? {} # The metadata of the item",
            droprate: "number(0.0..1.0)? 0.0 # The chance to drop the item",
        })
    }
}

/* Add entity attributes */ {
    const attributeToEntities = {
        baby: ["HUSK", "ZOMBIE_VILLAGER", "SKELETON_HORSE", "ZOMBIE_HORSE", "DONKEY", "MULE", "ZOMBIE", "ZOMBIFIED_PIGLIN", "PIG", "SHEEP", "COW", "CHICKEN", "WOLF", "MOOSHROOM", "OCELOT", "HORSE", "RABBIT", "POLAR_BEAR", "LLAMA", "PARROT", "VILLAGER", "TURTLE", "DROWNED", "CAT", "PANDA", "TRADER_LLAMA", "WANDERING_TRADER", "FOX", "BEE", "HOGLIN", "PIGLIN", "STRIDER", "ZOGLIN", "PIGLIN_BRUTE", "AXOLOTL", "GOAT", "FROG", "CAMEL", "SNIFFER", "ARMADILLO", ],
        colorable: ["SHULKER", "SHEEP", ],
        explosive: ["FIREBALL", "SMALL_FIREBALL", "WITHER_SKULL", "TNT", "DRAGON_FIREBALL", "WIND_CHARGE", "BREEZE_WIND_CHARGE", ],
        size: ["SLIME", "MAGMA_CUBE", "PHANTOM", ],
        throwableProjectile: ["EGG", "SNOWBALL", "ENDER_PEARL", "POTION", "EXPERIENCE_BOTTLE", "TRIDENT", ],
        zombifiable: ["HOGLIN", "PIGLIN", "PIGLIN_BRUTE", ],
    }
    const attributeToData = {
        baby: () => parseItem({
            isBaby: "boolean? false # Whether the entity is a baby", 
        }),
        colorable: () => parseItem({
            color: "dyeColor! # The color of the entity. Works for shulkers and sheep", 
        }),
        explosive: () => parseItem({
            yield: "number? 2.5 # The radius affected by this explosive's explosion", 
            isIncendiary: "boolean? false # Whether this explosive's explosion will cause fire", 
        }),
        size: () => parseItem({
            size: "integer! 0 # The size of this entity. Works for slimes, magma cubes, and phantoms", 
        }),
        throwableProjectile: () => parseItem({
            item: "ItemStackData? {} # The display ItemStack for the thrown projectile", 
        }),
        zombifiable: () => parseItem({
            isZombifiable: "boolean? false # Whether the entity is immune to zombification. Works for hoglins, piglins, and piglin brutes"
        }),
    }

    for (const attribute in attributeToEntities) {
        if (!(attribute in attributeToData)) {
            console.error("Missing attribute data for " + attribute)
        }
        const data = attributeToData[attribute]
        for (const entity of attributeToEntities[attribute]) {
            schema.entityData[entity] = deepMerge(data(), schema.entityData[entity])
        }
    }
}

/* Add entity description */ {
    for (const [key, data] of Object.entries(schema.entityData)) {
        const name = key.toLowerCase().replace("_", " ");
        data.description = `The data for a ${name}`
    }
}

console.log(JSON.stringify(schema, null, 4));

