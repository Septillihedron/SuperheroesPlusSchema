
const identifier = `([a-zA-Z_][a-zA-Z0-9_]*)`
const constructorBody = `[^{}]*?`
const parameters = `\\(int skill, ConfigurationSection configurationSection\\)`
const classBody = `(.*?public \\k<ClassName>${parameters} {(?<ConstructorBody>${constructorBody})}.*)`
const skillBody = `(.*?public class (?<ClassName>${identifier}) extends (?<ClassExtendsName>${identifier})( implements (?<ClassImplementsName>${identifier}))? {(?<ClassBody>${classBody})})`
const skillRegex = new RegExp(skillBody, "s")

/**
 * @typedef {object} AST
 * @property {string} className
 * @property {string} classExtendsName
 * @property {string} classImplementsName
 * @property {string} constructorBody
 */

/**
 * @param {string} code
 * @returns {AST | undefined}
 */
export function parse(code, fileName) {
    const match = code.match(skillRegex)
    const groups = match?.groups
    if (!groups) {
        console.error(`Parsing error on: ${fileName}`)
        return
    }
    const className = groups.ClassName;
    const classExtendsName = groups.ClassExtendsName
    const classImplementsName = groups.ClassImplementsName
    const constructorBody = groups.ConstructorBody
    return {
        className,
        classExtendsName,
        classImplementsName,
        constructorBody
    }
}
