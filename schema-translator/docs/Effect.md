

# Effect - A union of types with a differentiator



Differentiator: unionIdentifier



## Possible Types

| unionIdentifier | Description | Subtype |
| - | - | - |
| ACTIONBAR |  Sends an action bar to the user or target entity | [ActionBarEffect](ActionBarEffect.md) |
| AOE |  Acts like a trigger. \nTriggers for every entity in the range. \nThe target entity will be set to the entity this trigger triggers for | [AOE](AOE.md) |
| ARROW |  Shoot an arrow to the location of the target entity | [ArrowEffect](ArrowEffect.md) |
| ATTRIBUTE |  Modifies an attribute owned by the user or target entity | [AttributeEffect](AttributeEffect.md) |
| BLOCKENTITY |  Change the block at target entity for a duration of time, then change it back. Same as WEB | [BlockEntityEffect](BlockEntityEffect.md) |
| BONEMEAL |  Applies bonemeal to the location or location of the user or target entity | [BonemealEffect](BonemealEffect.md) |
| CANCEL |  Cancels the event that triggered this effect | [CancelEffect](CancelEffect.md) |
| CHANGEHERO |  | [ChangeHeroEffect](ChangeHeroEffect.md) |
| COMMAND |  Excecutes a list of commands | [CommandEffect](CommandEffect.md) |
| DAMAGE |  Damages the user or the target entity | [DamageEffect](DamageEffect.md) |
| DISGUISE |  | [DisguiseEffect](DisguiseEffect.md) |
| FIRE |  Sets the user or target entity on fire. Same as FIRE | [IgniteEffect](IgniteEffect.md) |
| FLING |  Modifies the velocity of the user or target entity. Same as FLING | [VelocityEffect](VelocityEffect.md) |
| FLY |  Sets the ability for the creative flight. Alias for FLYING \n\nModes: \nSELF: For the user;\nOTHER: For the target entity. | [FlyEffect](FlyEffect.md) |
| FLYING |  Sets the ability for the creative flight. Alias for FLYING \n\nModes: \nSELF: For the user;\nOTHER: For the target entity. | [FlyEffect](FlyEffect.md) |
| FREEZE |  Modifies the user or target entity freezing ticks (ie. powdered snow effect) | [FreezeEffect](FreezeEffect.md) |
| FURNACEBURNTIME |  Modifies a furnace's burn time | [FurnaceBurnTimeEffect](FurnaceBurnTimeEffect.md) |
| GIVEITEM |  Gives the user or target entity an item | [GiveItemEffect](GiveItemEffect.md) |
| GLIDING |  Sets the gliding mode of the user or target entity (works even if an Elytra is not equipped) | [GlidingEffect](GlidingEffect.md) |
| HEALTH |  Modifies the health of the user or target entity. Also rounds down to the nearest hitpoint/half a heart | [HealthEffect](HealthEffect.md) |
| HUNGER |  Modifies the hunger value of the user or target entity | [HungerEffect](HungerEffect.md) |
| IGNITE |  Sets the user or target entity on fire. Same as FIRE | [IgniteEffect](IgniteEffect.md) |
| ITEMAMOUNT |  Modifies the item amount | [ItemAmountEffect](ItemAmountEffect.md) |
| ITEMMATERIAL |  Changes the item type in a slot | [ItemMaterialEffect](ItemMaterialEffect.md) |
| ITEMSTACK |  Acts like a trigger. \nTriggers for the item in the slot. \nThe item will be set to the item in the slot | [ItemStackWrapperEffect](ItemStackWrapperEffect.md) |
| KNOCKBACK |  Applies a velocity to the target entity in the direction that the user is looking as the direction | [KnockbackEffect](KnockbackEffect.md) |
| LAUNCH |  Launches an entity. \nMode `OTHER`: Launched in the direction of the target entity. \nMode `SELF`: Launched in the direction the user is facing | [LaunchEffect](LaunchEffect.md) |
| LIGHTNING |  Summons lightning on the user or target entity.  | [LightningEffect](LightningEffect.md) |
| LOCATIONCUBE |  Acts like a trigger. \nTriggers for every location in the cube around the user or target entity. \nThe location will be set as the location the trigger triggers for | [LocationCubeEffect](LocationCubeEffect.md) |
| LOCATIONOFFSET |  Acts like a trigger. \nTriggers the location of the user or target entity after being offseted. \nThe location will be set as the location the trigger triggers for | [LocationOffsetEffect](LocationOffsetEffect.md) |
| LOSETARGET |  Make the user lose interest in the current target | [LoseTargetEffect](LoseTargetEffect.md) |
| LUNGE |  Applies an acceleration to the user or the target entity based on the direction the entity is looking | [LungeEffect](LungeEffect.md) |
| MESSAGE |  Sends a chat message to the user or target player | [MessageEffect](MessageEffect.md) |
| METADATA |  Modifies a user defined variable | [MetadataEffect](MetadataEffect.md) |
| MODIFY |  Modifies a variable, either user defined or not | [ModifyEffect](ModifyEffect.md) |
| NEAREST |  Acts like a trigger. \nTriggers for the nearest entity in the radius. \nThe target entity will be set as the nearest entity | [NearestEffect](NearestEffect.md) |
| PARTICLE |  Spawns particles | [ParticleEffect](ParticleEffect.md) |
| PICKUP |  Pick up the target entity and places it on the user's head | [Pickup](Pickup.md) |
| PLACEBLOCK |  Replaces a block at the location for an amount of time. Retains the original block data | [PlaceBlockEffect](PlaceBlockEffect.md) |
| PLAYTRACK |  | [PlayTrackEffect](PlayTrackEffect.md) |
| POTION |  Applies the potion effect to the user or target entity | [Potion](Potion.md) |
| PROJECTILE |  Shoots an entity from the user. \nMode `SELF`: Shoots in the direction that the user is looking. \nMode `OTHER`: Shoots at the target entity. \nMode `LOCATION`: Shoots at the location | [ProjectileEffect](ProjectileEffect.md) |
| RANDOMTELEPORT |  Teleports the user or target entity a random distance | [RandomTeleportEffect](RandomTeleportEffect.md) |
| RAYTRACE |  Acts like a trigger. \nSends out a raytrace that collides with entities or blocks in the direction that the user or target entity is looking. \nThe target entity will be set as the collided entity. \nThe location will be set as the location of the collided block | [RaytraceEffect](RaytraceEffect.md) |
| REMOVEENTITY |  Removes the user or target entity | [RemoveEntityEffect](RemoveEntityEffect.md) |
| REMOVEPOTION |  Removes potion effects from the user or target entity | [RemovePotionEffect](RemovePotionEffect.md) |
| REPULSE |  Repulse the target entity | [RepulseEffect](RepulseEffect.md) |
| RESIZE |  Resizes the user or target entity (for slimes, magma cubes, and phantoms) | [ResizeEffect](ResizeEffect.md) |
| SCRAMBLEINVENTORY |  Scrambles the inventory of the user or target entity | [ScrambleInventoryEffect](ScrambleInventoryEffect.md) |
| SHOOTER |  Acts like a trigger. \nTriggers for the target entity. \nThe new target entity will be set as the source of the projectile if the old target entity is a projectile, otherwise the target entity will remain the same | [ShooterEffect](ShooterEffect.md) |
| SMITE |  Summons lightning on the user or target entity.  | [LightningEffect](LightningEffect.md) |
| SOUND |  Plays a sound at the location or at the location of the user or target entity | [SoundEffect](SoundEffect.md) |
| SPAWNENTITY |  Spawns an entity at the location or the location of the user or target entity | [SpawnEffect](SpawnEffect.md) |
| SWAP |  Swaps the position of the user and target entity | [SwapEffect](SwapEffect.md) |
| SWITCHEROO |  Acts like a trigger. \nThe target entity will be set as the original user.\n the user will be set as the original target entity | [SwitcherooWrapperEffect](SwitcherooWrapperEffect.md) |
| TARGET |  If the user is a mob, sets the target of the user to the target entity | [TargetEntityEffect](TargetEntityEffect.md) |
| TELEPORT |  Teleports the user to the location or the location of the target entity | [TeleportEffect](TeleportEffect.md) |
| TIMER |  Acts like a trigger. \nTriggers for a number of times with a period and initial delay. \nTarget items will be forwarded | [TimerEffect](TimerEffect.md) |
| VEINMINER |  Breaks surrounding blocks around a location recursively | [VeinMinerEffect](VeinMinerEffect.md) |
| VELOCITY |  Modifies the velocity of the user or target entity. Same as FLING | [VelocityEffect](VelocityEffect.md) |
| WAIT |  Acts like a trigger. \nWaits a duration of time before it triggers | [WaitEffect](WaitEffect.md) |
| WEB |  Change the block at target entity for a duration of time, then change it back. Same as WEB | [BlockEntityEffect](BlockEntityEffect.md) |
| WRAPPER |  Acts like a trigger | [WrapperEffect](WrapperEffect.md) |
