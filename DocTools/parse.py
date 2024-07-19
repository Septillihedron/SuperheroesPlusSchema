
import re

def toJSON(obj: object) -> str:
    if type(obj) == list:
        values = (toJSON(value) for value in obj)
        values = ", ".join(values)
        return f"[{values}]"
    elif type(obj) == dict:
        values = (f'"{key}": {toJSON(value)}' for (key, value) in obj.items())
        values = map(indent, values)
        values = ", \n".join(values)
        return f"{{\n{values}\n}}"
    elif type(obj) == str:
        return f'"{obj}"'
    else:
        return str(obj)

def indent(str: str) -> str:
    splitted = re.split("\r\n|\r|\n", str)
    indented = ("\t"+x for x in splitted)
    return "\n".join(indented)

with open("unparsed.yml") as f:
    file = "".join(f.readlines())

file = re.sub(" |:|\n|\r", "", file)
file = file.replace(",", ", ")

entries = file.split("'")
enums = {}
for i in range(len(entries)//2):
    key = entries[2*i]
    values = entries[2*i+1]
    values = values[1:-1]
    values = values.split(", ")
    values = [value[1:-1] for value in values]
    enums[key] = {
        "description": "",
        "type": "string",
        "enum": values
    }

with open("parsed.json", mode="w") as f:
    f.write(toJSON(enums))

