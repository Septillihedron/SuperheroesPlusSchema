
export const Hero = {
	type: "object",
	additionalProperties: false,
	minProperties: 1,
	patternProperties: {".*": {
		description: "Hero name",
		type: "object",
		additionalProperties: false,
		required: ["colouredName", "description"],
		properties: {
			colouredName: {
				description: "The coloured name that will appear ingame",
				type: "string"
			},
			description: {
				description: "The description of the hero",
				type: "string"
			},
			skin: {
				description: "The skin that will replace the user's skin. \n\n(You can skins with values and signatures at https://mineskin.org/)",
				type: "object",
				properties: {
					value: {
						description: "The skin value",
						type: "string"
					},
					signature: {
						description: "The skin signature",
						type: "string"
					}
				},
				required: ["value", "signature"]
			},
			icon: {
				description: "The icon for this hero in the selection GUI",
				type: "object",
				$ref: "#/types/ItemStackData"
			},
			skills: {
				description: "The list of skill that the hero has",
				type: "object",
				additionalProperties: false,
				patternProperties: {
					".*": {
						$ref: "#/definitions/skill"
					}
				}
			},
			plusUltraSkills: {
				description: "Works the same as `skills` but only activates when SuperheroesPlusUltra is installed. Probably only used by the developer to add PlusUltra skills into default Superheroes heroes without breaking it",
				type: "object",
				additionalProperties: false,
				patternProperties: {
					".*": {
						$ref: "#/definitions/skill"
					}
				}
			}
		}
	}},
}
export const Hero8 = {
	description: "The hero",
	type: "object",
	additionalProperties: false,
	required: ["name", "colouredName", "description"],
	properties: {
		name: {
			description: "The name that is used in commands",
			type: "string"
		},
		colouredName: {
			description: "The coloured name that will appear ingame",
			type: "string"
		},
		description: {
			description: "The description of the hero",
			type: "string"
		},
		skin: {
			description: "The skin that will replace the user's skin. \n\n(You can skins with values and signatures at https://mineskin.org/)",
			type: "object",
			properties: {
				value: {
					description: "The skin value",
					type: "string"
				},
				signature: {
					description: "The skin signature",
					type: "string"
				}
			},
			required: ["value", "signature"]
		},
		icon: {
			description: "The icon for this hero in the selection GUI",
			type: "object",
			$ref: "#/types/ItemStackData"
		},
		skills: {
			description: "The list of skill that the hero has",
			type: "object",
			additionalProperties: false,
			patternProperties: {
				".*": {
					$ref: "#/definitions/skill"
				}
			}
		},
		plusUltraSkills: {
			description: "Works the same as `skills` but only activates when SuperheroesPlusUltra is installed. Probably only used by the developer to add PlusUltra skills into default Superheroes heroes without breaking it",
			type: "object",
			additionalProperties: false,
			patternProperties: {
				".*": {
					$ref: "#/definitions/skill"
				}
			}
		}
	}
}
export const Boss = {
	type: "object",
	additionalProperties: false,
	minProperties: 1,
	patternProperties: {".*": {
		description: "Boss name",
		type: "object",
		additionalProperties: false,
		required: ["colouredName", "description", "entity"],
		properties: {
			colouredName: {
				description: "The coloured name that will appear ingame. \n\nDefaults to Boss name",
				type: "string"
			},
			description: {
				description: "The description of the boss. \n\nDefaults to Boss name + \" description\"",
				type: "string"
			},
			entity: {
				description: "The entity that the boss is",
				$ref: "#/types/EntityData"
			},
			skills: {
				description: "The list of skill that the boss has",
				type: "object",
				additionalProperties: false,
				patternProperties: {
					".*": {
						$ref: "#/definitions/SLSkill"
					}
				}
			},
			bossbar: {
				description: "The styling for a boss bar",
				$ref: "#/types/BossBarData"
			},
			autospawn: {
				description: "The data for spawning behavior",
				$ref: "#/types/SpawnData"
			},
			damagemodifier: {
				description: "The modifier that modifies the amount of damage the boss will recieve when damaged",
				$ref: "#/definitions/damagemodifier"
			},
			reward: {
				description: "The reward for killing the boss",
				$ref: "#/definitions/reward"
			}
		}
	}}
}

export const Item = {
	type: "object",
	additionalProperties: false,
	minProperties: 1,
	patternProperties: {".*": {
		description: "Item name",
		type: "object",
		additionalProperties: false,
		required: ["item"],
		properties: {
			item: {
				description: "The skill item",
				$ref: "#/types/ItemStackData"
			},
			levels: {
				description: "The level data",
				type: "object",
				additionalProperties: false,
				properties: {
					maxLevel: {
						description: "The maximum level",
						type: "number",
						minimum: 0,
						default: 0
					}
				},
				patternProperties: {
					"^([2-9])|([1-9]+[0-9])$": {
						description: "The level data",
						type: "object",
						additionalProperties: false,
						properties: {
							experienceRequired: {
								description: "The experience required to level up",
								type: "number"
							}
						},
						required: ["experienceRequired"]
					}
				}
			},
			distribution: {
				type: "object",
				description: "The list of distributions",
				patternProperties: {
					".*": {
						$ref: "#/definitions/distribution"
					}
				}
			},
			slots: {
				description: "The list of slots",
				type: "array",
				items: {
					description: "A slot",
					anyOf: [
						{
							type: "number"
						},
						{
							$ref: "#/types/equipmentSlot"
						}
					]
				}
			},
			skills: {
				description: "The list of skill that the item has",
				type: "object",
				additionalProperties: false,
				patternProperties: {
					".*": {
						$ref: "#/definitions/SLSkill"
					}
				}
			}
		}
	}}
}