# [Download](https://github.com/Septillihedron/SuperheroesPlusSchema/releases/latest)
# SuperheroesPlusSchema

## Uses
A documentation and schema for Xemor's minecraft plugins:
* Superheroes and their extensions (skills are incomplete)
* EnchantedBosses
* EnchantedCombat

## Installation
### Prerequisites
Before you use this schema, you should [download VSCode](https://code.visualstudio.com/) and [download the YAML plugin](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) for it
### Instructions
* Open up VSCode on the powers/bosses/items folder by right-clicking in or on the folder and selecting `Open with VSCode` or open up VSCode then open the folder from there
  (if you're on windows, you might have to press `Show more options` first)
* Open up the file that you're going to edit in VSCode,
* Add one of the following at the top of the file
  - Superheroes version 8 and up:
    ```
    # yaml-language-server: $schema=https://septillihedron.github.io/SuperheroesPlusSchema/Superheroes8+.json
    ```
  - Superheroes below version 8:
    ```
    # yaml-language-server: $schema=https://septillihedron.github.io/SuperheroesPlusSchema/Superheroes.json
    ```
  - EnchantedCombat:
    ```
    # yaml-language-server: $schema=https://septillihedron.github.io/SuperheroesPlusSchema/EnchantedCombat.json
    ```
  - EnchantedBosses:
    ```
    # yaml-language-server: $schema=https://septillihedron.github.io/SuperheroesPlusSchema/EnchantedBosses.json
    ```
* You can now see if there is any errors in your file and use control+space to auto-complete

## (not so) FAQ
Q: Why does auto-complete show nothing/everything?

A: It does that when there is nothing more to auto-complete or when you are auto-completing a section

To solve the latter, make sure you are below the tag and indented relative to the tag, then try again

## Other
For any questions, bug reports, miss documentation, and/or suggestions, ping me (sepdron) in `#my-plugins` in [Xemor's server](https://discord.gg/d7XA8nr)
