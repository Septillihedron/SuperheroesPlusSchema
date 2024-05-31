
import re

with open("unparsed.yml") as f:
    file = "".join(f.readlines())

file = re.sub(" |:|\n|\r", "", file)
file = file.replace(",", ", ")

entries = file.split("'")
pairs = []
for i in range(len(entries)//2):
    pairs.append((entries[2*i], entries[2*i+1]))


with open("parsed.json", mode="w") as f:
    for (name, values) in pairs:
        f.write(f'"{name}": {{\n\t"description": "", \n\t"type": "string", \n\t"enum": {values}\n}},\n')
