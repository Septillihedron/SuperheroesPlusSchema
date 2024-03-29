const { writeFileSync } = require('fs')

/**
 * @param {string} s 
 * @returns {string}
 */
const removeComments = s => {
    let slashes = 0
    let inString = false
    let res = []
    let inComment = false
    for (let c of s) {
        if (inString) {
            if (c == '"') inString = false
        } else {
            if (c == '"') inString = true
            if (slashes == 2) {
                inComment = true
                // remove the two slashes
                res.pop()
                res.pop()
            }
            if (c == '/') slashes++
            else slashes = 0;
            if (inComment) {
                if (/\n|\r/.test(c)) inComment = false
                else continue
            }
        }
        if (!inComment) res.push(c)
    }
    return res.join("")
}

const readFile = require('fs').readFileSync
const readJsonFile = file => JSON.parse(removeComments(readFile(file).toString()))

/**
 * @type {unknown[]}
 */
const o1 = readJsonFile(process.argv[2])
/**
 * @type {unknown[]}
 */
const o2 = readJsonFile(process.argv[3])

/**
 * @typedef {[string, string] | Record<string, object>} Difference
 */

/**
 * @param {unknown} o1 
 * @param {unknown} o2 
 * @returns {Difference}
 */
function findDifferences(o1, o2) {
    if (typeof o1 !== typeof o2) return [`type ${typeof o1}`, `type ${typeof o2}`]
    if (Array.isArray(o1) !== Array.isArray(o2)) {
        const o1Type = Array.isArray(o1)? 'array' : 'object'
        const o2Type = Array.isArray(o2)? 'array' : 'object'
        return [`type ${o1Type}`, `type ${o2Type}`]
    }

    if (typeof o1 === "object") {
        const keys = Object.keys({...o1, ...o2})
        return keys
            .map(key => {
                const difference = findDifferences(o1[key], o2[key])
                return { key, difference };
            })
            .filter(({ difference }) => Object.keys(difference).length != 0)
            .reduce((acc, { key, difference }) => {
                acc[key] = difference
                return acc
            }, {})
    }
    if (o1 !== o2) return [o1, o2]
    return []
}

const differences = findDifferences(o1, o2, "this")
if (Object.keys(differences).length === 0) console.log("No differences")
else console.log("Differences")

writeFileSync('differences.json', JSON.stringify(differences, null, 4))
