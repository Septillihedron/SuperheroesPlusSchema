

# RaytraceEffect - An object



## Properties



### mode - Required [enum](enum)



 The mode of operation



Defaults to SELF



### maxDistance - Optional [number](number)



 The maximum distance the raytrace can collide



Defaults to 10



### collisionMode - Optional [FluidCollisionMode](FluidCollisionMode)



 The collision behavior when a fluid gets hit by the raytrace



Defaults to NEVER



### ignorePassables - Optional [boolean](boolean)



 Whether to ignore passable blocks (ex. tall grass, signs, fluids)



Defaults to true



### alwaysHit - Optional [boolean](boolean)



 If true, if the raytrace does not hit anything, the location will be set as the maxDistance in the direction the user is looking



Defaults to true



### raySize - Optional [number](number)



 The collision size of the ray



Defaults to 1.0



### raysize - Optional [number](number)



 The collision size of the ray



Defaults to 1.0

