

const extraDataHandler = {
    "integer": (extraData, property) => {
        const [min, max] = extraData.split("..").map(x => Number.parseInt(x))
        if (!Number.isNaN(min)) property.min = min
        if (!Number.isNaN(max)) property.max = max
    },
    "number": (extraData, property) => {
        const [min, max] = extraData.split("..").map(x => Number.parseFloat(x))
        if (!Number.isNaN(min)) property.min = min
        if (!Number.isNaN(max)) property.max = max
    }
}

/**
 * @param {object} code
 */
export function parseItem(code, description = "") {
    const docItem = {
        extends: undefined,
        description,
        properties: {}
    }
    if ('__extends__' in code) {
        docItem.extends = code['__extends__']
        delete code['__extends__']
    }
    for (const [name, value] of Object.entries(code)) {
        if (typeof value === "string") {
            docItem.properties[name] = parse(value)
        } else {
            docItem.properties[name] = value
        }
    }
    return docItem
}

/**
 * 
 * @param {string} code 
 */
export function parse(code) {
    const tokens = code.match(/^(?<Type>[a-zA-Z]+)(\((?<ExtraData>[^\)]*)\))?(?<Array>\[\]|\{\})?(?<Require>\?|!)(?<Default>[^#]+)?#?(?<Description>.*)$/s)?.groups
    if (!tokens) {
        console.error("Invalid match: ", code)
        return {
            type: "Err, invalid match"
        }
    }
    const {
        Type, ExtraData, Array, Require, Default, Description
    } = tokens

    const property = {}

    property.description = (Description ?? "").trim()

    if (Array == "[]") {
        property.type = "array"
        property.items = Type
    } else if (Array == "{}") {
        property.type = "record"
        property.recordItem = Type
    } else {
        property.type = Type
    }

    property.required = (Require == "!")
    if ((Default ?? "").trim().length !== 0) {
        property.default = parseDefault(Default.trim(), property.type) ?? undefined
    }

    if (ExtraData != undefined) {
        if (Type in extraDataHandler) {
            extraDataHandler[Type](ExtraData, property)
        } else {
            console.warn("Unused extra data: ", ExtraData, "in", code)
        }
    }

    return property;
}

/**
 * 
 * @param {string} Default 
 * @param {string} type 
 */
function parseDefault(Default, type) {
    switch (type) {
        case "array": return JSON.parse(Default)
        case "object": return JSON.parse(Default)
        case "record": return JSON.parse(Default)
        case "string": return JSON.parse(Default)
        case "number": return Number.parseFloat(Default)
        case "integer": return Number.parseInt(Default)
        case "boolean": return Default === "true" ? true : false
        default: return Default
    }
}

export function deepMerge(merged, overrides) {
	for (const key in overrides) {
		if (merged[key] === undefined || typeof overrides[key] !== "object") merged[key] = overrides[key]
		else merged[key] = deepMerge(merged[key], overrides[key])
	}
	return merged
}

