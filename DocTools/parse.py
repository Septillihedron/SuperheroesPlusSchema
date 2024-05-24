
import re

with open("config.yml") as f:
    file = "".join(f.readlines())

file = re.sub(" |:|\n|\r", "", file)
file = file.replace(",", ", ")

entries = file.split("'")
pairs = []
for i in range(len(entries)//2):
    pairs.append((entries[2*i], entries[2*i+1]))


with open("parsed.txt", mode="w") as f:
    for x in pairs:
        f.write(x[0] + ": \n" + x[1] + "\n" + x[1].upper() + "\n")
