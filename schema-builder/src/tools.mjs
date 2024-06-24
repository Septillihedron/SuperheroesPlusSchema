

/**
 * @param {object} code
 */
export function parseItem(code) {
    const docItem = {
        description: "",
        properties: {}
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
    const tokens = code.match(/^(?<Type>[a-zA-Z]+)(?<Array>\[\]|\{\})?(?<Require>\?|!)(?<Default>[^#]+)?#?(?<Description>.*)$/)?.groups
    if (!tokens) {
        return {
            type: "Err, invalid match"
        }
    }
    const {
        Type, Array, Require, Default, Description
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

    property.required = Require == "!"
    if ((Default ?? "").trim().length !== 0) {
        property.default = parseDefault(Default.trim(), property.type) ?? undefined
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

