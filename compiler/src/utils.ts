
export function objectPropertyMap<T>(object: {[key: string]: T}): Map<string | number, T> {
	var map = new Map<string | number, T>()
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
