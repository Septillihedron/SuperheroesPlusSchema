

# Condition - A union of types with a differentiator



Differentiator: unionIdentifier



## Possible Types

| unionIdentifier | Description | Subtype |
| - | - | - |
| BIOME |  Checks if the biome that the user, target entity, or location is in is one of the listed biomes | [BiomeCondition](BiomeCondition) |
| BLOCK |  Checks if the location has one of the listed blocks | [BlockCondition](BlockCondition) |
| CHANCE |  A chance for this condition to be true | [ChanceCondition](ChanceCondition) |
| COMPARISON |  Compares a variable | [ComparisonCondition](ComparisonCondition) |
| COOLDOWN |  Checks if the time since the get last effect triggered is after the cooldown | [CooldownCondition](CooldownCondition) |
| DISTANCE |  Checks if the distance between the user and target entity is in the range | [DistanceCondition](DistanceCondition) |
| ENTITY |  Checks the target entity against this whitelist/blacklist | [EntityWhitelistCondition](EntityWhitelistCondition) |
| FLY |  Checks if the user or target entity is flying | [FlyingCondition](FlyingCondition) |
| FLYING |  Checks if the user or target entity is flying | [FlyingCondition](FlyingCondition) |
| GLIDING |  Checks if the user gliding | [GlidingCondition](GlidingCondition) |
| HEALTH |  Checks if the hp percentage of the user or target entity is in the range | [HealthCondition](HealthCondition) |
| HEIGHT |  Checks if the user or target entity y coordinate is in the range | [HeightCondition](HeightCondition) |
| HOTBARSLOT |  Checks if the held item/main hand in in a range of hotbar slots | [HotbarSlotCondition](HotbarSlotCondition) |
| INBLOCK |  Checks if the user or target entity is in one of the listed blocks | [InBlockCondition](InBlockCondition) |
| ININVENTORY |  Checks if the user have their inventory GUI opened | [InInventoryCondition](InInventoryCondition) |
| ITEM |  Checks the item or the item in the declared slot against the declared item | [ItemCondition](ItemCondition) |
| ITEMWRAPPER |  Checks if all inside conditions are true. \nThe item will be set as the item in the specified slot of the user or target entity | [ItemWrapperCondition](ItemWrapperCondition) |
| LIGHT |  Checks the light level | [LightCondition](LightCondition) |
| METADATA |  Compares a user defined variable | [MetadataCondition](MetadataCondition) |
| NOT |  Inverts the inside condition | [NOTCondition](NOTCondition) |
| NPC |  Checks if the user or target entity is an npc | [NPCCondition](NPCCondition) |
| ONGROUND |  Checks if the user or target entity is on the ground | [OnGroundCondition](OnGroundCondition) |
| OR |  ORs all the conditions inside | [ORCondition](ORCondition) |
| POTIONEFFECT |  Checks whether the user or target entity has the potion effect | [PotionEffectCondition](PotionEffectCondition) |
| SHIELDED |  Checks if the user is blocking | [ShieldedCondition](ShieldedCondition) |
| SHOOTER |  Checks whether the shooter of the `OTHER` entity is the `SELF` entity | [ShooterCondition](ShooterCondition) |
| SIZE |  Checks if the size of the user or target entity is in the range (for slimes, magma cubes, and phantoms) | [SizeCondition](SizeCondition) |
| SNEAK |  Checks if the player or entity is shifting | [SneakCondition](SneakCondition) |
| SPEED |  Checks whether the speed of the user or target entity is in the range | [SpeedCondition](SpeedCondition) |
| SPRINTING |  Checks if the user or target entity is sprinting | [SprintingCondition](SprintingCondition) |
| SWIMMING |  Checks if the user or target entity is swimming | [SwimmingCondition](SwimmingCondition) |
| TAMED |  Checks if the target entity is tamed | [TamedCondition](TamedCondition) |
| TEMPERATURE |  Checks if the location or the location of the user or target entity is in the range | [TemperatureCondition](TemperatureCondition) |
| TIME |  Checks the relative in-game time (time of day) of the world that the player is in against the range. Measured in milli-hours or hours*1000 | [TimeCondition](TimeCondition) |
| VISIBILITY |  Checks if the user has a direct line of sight to the target entity | [VisibilityCondition](VisibilityCondition) |
| WEATHER |  Checks if the world that the user is in has a storm | [WeatherCondition](WeatherCondition) |
| WORLD |  Checks if the world that the user, target entity, or location is in is one of the listed worlds | [WorldCondition](WorldCondition) |
| WRAPPER |  Checks if all inside conditions are true | [WrapperCondition](WrapperCondition) |
