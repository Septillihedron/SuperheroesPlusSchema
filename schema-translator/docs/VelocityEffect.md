

# VelocityEffect - An object



## Properties



### operation - Optional [ModifyEffect.Operation](ModifyEffect.Operation)



 The operation to do



Defaults to SET



### value - Optional [Expression](Expression)



 The number on the right side of the operation



Defaults to 1



### mode - Required [enum](enum)



 The mode of operation



Defaults to SELF



### component - Optional [string](string)



 The component(s) to modify, `ALL` means all components (ex. `XZ` would only modify the X and Z velocities and leave Y unmodified)



Defaults to Y

