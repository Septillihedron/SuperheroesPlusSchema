
export type StringRecord<T> = Record<string, T>

export function forEachValue<T>(object: StringRecord<T> | undefined, func: (value: T) => void) {
	if (object == undefined) return;
	for (const value of Object.values(object)) {
		func(value)
	}
}

export function forEachEntry<T>(object: StringRecord<T>, func: (key: string, value: T) => void) {
	for (const [key, value] of Object.entries(object)) {
		func(key, value)
	}
}
