

# PotionEffectCondition - An object



## Properties



### mode - Required enum



 The mode of operation



Defaults to SELF



### effect - Required PotionEffectType



 The type of potion to check. If not specified, it will check for any type of potion



### potency - Optional RangeData



 The range of potion potency to check against



Defaults to -Infinity - Infinity



### duration - Optional RangeData



 The range of potion duration to check against (in seconds)



Defaults to -Infinity - Infinity

