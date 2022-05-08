
export function objectPropertyMap(object: {[key: string]: any}): Map<string | number, any> {
	var map = new Map<string | number, any>()
	Object.keys(object).forEach(key => {
		map.set(key, object[key])
	});
	return map
}

export type ExcludeType<T, U> = {
	[K in keyof T as T[K] extends U? never : K]: T[K]
}

export type ExcludeFunc<T> = ExcludeType<T, Function>

export type MonoTypeObject<U> = { [key: string | number | symbol]: U };
