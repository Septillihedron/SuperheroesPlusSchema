

# MetadataCondition - An object



## Properties



### value - Required [Expression](Expression)



 The value to compare against



### comparison - Optional [ComparisonCondition.Comparison](ComparisonCondition.Comparison)



 The comparison to use



Defaults to EQUAL



### mode - Required [enum](enum)



 The mode of operation



Defaults to SELF



### otherwise - Optional [EffectList](EffectList)



 A list of effects that will run if this condition is false



### else - Optional [EffectList](EffectList)



 A list of effects that will run if this condition is false



### variable - Required [string](string)



 The variable to compare

