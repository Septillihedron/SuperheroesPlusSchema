
export type StringRecord<T> = Record<string, T>

export function forEachValue<T>(object: StringRecord<T> | undefined, func: (value: T) => void) {
	if (object == undefined) return;
	for (const value of Object.values(object)) {
		func(value)
	}
}

export function forEachEntry<K extends string, V>(object: Record<K, V>, func: (key: K, value: V) => void) {
	for (const [key, value] of Object.entries(object)) {
		func(key as K, value as V)
	}
}
