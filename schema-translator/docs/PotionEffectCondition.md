

# PotionEffectCondition - An object



## Properties



### mode - Required [enum](enum)



 The mode of operation



Defaults to SELF



### otherwise - Optional [EffectList](EffectList)



 A list of effects that will run if this condition is false



### else - Optional [EffectList](EffectList)



 A list of effects that will run if this condition is false



### effect - Required [PotionEffectType](PotionEffectType)



 The type of potion to check. If not specified, it will check for any type of potion



### potency - Optional [RangeData](RangeData)



 The range of potion potency to check against



Defaults to -Infinity - Infinity



### duration - Optional [RangeData](RangeData)



 The range of potion duration to check against (in seconds)



Defaults to -Infinity - Infinity

