

# EntityWhitelistCondition - An object



## Properties



### mode - Required [enum](enum)



 The mode of operation



Defaults to SELF



### otherwise - Optional [EffectList](EffectList)



 A list of effects that will run if this condition is false



### else - Optional [EffectList](EffectList)



 A list of effects that will run if this condition is false



### whitelist - Optional [boolean](boolean)



 If true, the entities property will whitelist. If false, the entities property will blacklist



Defaults to true



### entities - Optional [EntityType[]](EntityType[])



 If true, the entities property will whitelist. If false, the entities property will blacklist



Defaults to []

