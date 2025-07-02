

# TriggerData - A union of types with a differentiator



Differentiator: unionIdentifier



## Possible Types

| unionIdentifier | Description | Subtype |
| - | - | - |
| BECOMEVEHICLE |  Triggers when an entity enters the user, thus using the user as a vehicle. \nThe target entity will be set as the entering entity | [object](object) |
| BLOCKBREAK |  Triggers when the user breaks a block. \nThe location will be set as the location of the broken block | [object](object) |
| CHANGEMAINHAND |  Triggers when the user changes where the main hand slot is (i.e. scrolls or hits a number). \nThe item will be set as the item in the new slot | [object](object) |
| COMBAT |  Triggers when the user damages an entity or gets damaged by an entity. \nThe target entity will be set as the damaged entity or the damaging entity respectively | [object](object) |
| CONSUME |  Triggers when the user consumed an item | [object](object) |
| DAMAGEDBYENTITY |  Triggers when an entity damages the user. \nThe target entity will be set as the damaging entity | [object](object) |
| DAMAGEDENTITY |  Triggers when the user damage an entity. \nThe target entity will be set as the damaged entity | [object](object) |
| DEATH |  Triggers when the user is killed. \nThe target entity will be set as the killer if it exist | [object](object) |
| ENTERVEHICLE |  Triggers when the user enters a vehicle. \nThe target entity will be set as the vehicle | [object](object) |
| EQUIPARMOR |  Triggers when the user equips an armour. \nThe item will be set as the equiped item | [object](object) |
| EXITVEHICLE |  Triggers when the user exits a vehicle. \nThe target entity will be set as the vehicle | [object](object) |
| INTERACTENTITY |  Triggers when the user right clicks an entity. \nThe target entity will be set as the interacted entity | [object](object) |
| KILL |  Triggers when the user kills an entity. \nThe target entity will be set as the killed entity | [object](object) |
| LAUNCHPROJECTILE |  Triggers when the user launched a projectile. \nThe target entity will be set as the launched projectile | [object](object) |
| MOVE |  Triggers when the user moves. \nThe location will be set as the location the user moves to | [object](object) |
| PLAYERJOIN |  Triggers when the user joins the server | [object](object) |
| PLAYERJUMP |  Triggers when the user jumps | [object](object) |
| PLAYERQUIT |  Triggers when the user exits the server | [object](object) |
| PROJECTILEHIT |  Triggers when a projectile shot by the user landed and/or hits an entity. \nThe target entity will be set as the projectile | [object](object) |
| RIPTIDE |  Triggers when the user activates the riptide enchantment | [object](object) |
| SNEAK |  Triggers when the user sneaks | [object](object) |
| SPAWN |  Triggers when the user spawns | [object](object) |
| SPRINT |  Triggers when the user starts or stops sprinting | [object](object) |
| SWAPHANDS |  Triggers when the user swaps hands | [object](object) |
| TAME |  Triggers when the user tames an entity. \nThe target entity will be set as the tamed entity | [object](object) |
| TARGET |  Triggers when the user targets an entity. \nThe target entity will be set as the target | [object](object) |
| TARGETED |  Triggers when the user is targeted by an entity. \nThe target entity will be set as the entity that targeted the user | [object](object) |
| TOGGLEGLIDE |  Triggers when the user glides or unglides | [object](object) |
| TOTEM |  Triggers when the user activates a totem. \nThe target entity will be set as the killer of the user | [object](object) |
| DAMAGED |  Triggers when the user gets damaged | [DamageData](DamageData) |
| DAMAGEDBYPROJECTILE |  Triggers when an entity damages the user. \nIf the damaging entity is a projectile, the target entity will be set as the source of the projectile. \nOtherwise, The target entity will be set as the damaging entity | [ProjectileData](ProjectileData) |
| DAMAGEDENTITYWITHPROJECTILE |  Triggers when the user damages an entity directly or with a projectile. \nThe target entity will be set as the damaged entity | [ProjectileData](ProjectileData) |
| GAINEDHERO |  | [TriggerData](TriggerData) |
| INTERACT |  Triggers when the user interacts with a block or air | [InteractData](InteractData) |
| LOOP |  Triggers periodically every couple of ticks | [LoopData](LoopData) |
| LOSTHERO |  | [TriggerData](TriggerData) |
| POTIONEFFECT |  Triggers when a potion effect is applied to the user | [PotionEffectTriggerData](PotionEffectTriggerData) |
| PROJECTILECOMBAT |  Acts like the DAMAGEDBYPROJECTILE and DAMAGEDENTITYWITHPROJECTILE triggers combined | [ProjectileData](ProjectileData) |
