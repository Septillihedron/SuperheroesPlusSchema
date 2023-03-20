# WIP readme
# SuperheroesPlusSchema

## Uses
A documentation and schema for Xemor's minecraft plugins:
* Superheroes and their extensions (skills are incomplete)
* EnchantedBosses
* EnchantedCombat

## Installation
### Prerequisites
Before you use this schema, you should [download VSCode](https://code.visualstudio.com/) and [download the YAML plugin](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) for it
### Installation
* Download the respective schema file named `<nameOfPlugin>Schema.json` from [here](https://github.com/Septillihedron/SuperheroesPlusSchema/releases/tag/v1.0.0)
* Move the file into the same folder that you have all your powers/bosses/items that you're going to edit
* Open up VSCode on the same folder by right-clicking in/on the folder and selecting `Open with VSCode` or open up VSCode then open the folder from there
* Open up the file that you're going to edit in VSCode, then add `# yaml-language-server: $schema=nameOfSchemaFile.json` at the top/beginning of the file
* You can now see if there is any errors in your file and use control+space to auto-complete

## (not so) FAQ
Q: Why does auto-complete show nothing/everything?

A: It does that when there is nothing to auto-complete or when you are auto-completing a section

To solve the latter, make sure you are below the tag and indented relative to the tag, then try again

## Other
For any questions, bug reports, miss documentation, and/or suggestions, ping me (Sepdron#5047) in `#my-plugins` in [Xemor's server](https://discord.gg/d7XA8nr)
