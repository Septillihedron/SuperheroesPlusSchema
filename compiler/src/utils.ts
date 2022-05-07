
export function objectPropertyMap(object: {[key: string]: any}): Map<string | number, any> {
	var map = new Map<string | number, any>()
	Object.keys(object).forEach(key => {
		map.set(key, object[key])
	});
	return map
}
