

# VeinMinerEffect - An object



## Properties



### mode - Required [enum](enum)



 The mode of operation



Defaults to LOCATION



### materials - Optional [Material[]](Material[])



 The list of types that can be broken



Defaults to []



### delay - Optional [Duration](Duration)



 The delay between each break in seconds (1 is 20 ticks)



Defaults to 0.05



### limit - Optional [integer](integer)



 The max recursion depth ie. the radius from the start



Defaults to 10



### allowMultiTypeVein - Optional [boolean](boolean)



 If true, the vein will break all types in the list instead of only breaking the same type of block as the one in original location



Defaults to false



### types - Optional [Material[]](Material[])



 The list of types that can be broken



Defaults to []

