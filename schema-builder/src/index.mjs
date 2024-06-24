import { parse, parseItem } from "./tools.mjs";


const schema = {
    particleShape: {
        HELIX: parseItem({
            radius: "number? 0.5",
            speed: "number? 1",
            wave_frequency: "number? 1",
            frequency: "number? 0.05",
            height: "number? 2",
        }),
        // WINGS: parseItem({
            
        // }),
        POINT: parseItem({
            spread: "number? 0.5",
            offset: "number? 0",
        }),
        HALO: parseItem({
            height: "number? 0.3",
            radius: "number? 0.3",
            resolution: "number? 32",
        }),
        WISP: parseItem({
            radius: "number? 0.5",
            speed: "number? 1",
            wave_frequency: "number? 1",
            height: "number? 2",
        }),
        HEART: parseItem({
            height: "number? 2",
            frequency: "number? 0.05",
            size: "number? 1",
        }),
        FAIRY_WINGS: parseItem({
            height: "number? 1",
            frequency: "number? 0.05",
            size: "number? 1",
        }),
        EARS: parseItem({
            height: "number? 0.2",
            frequency: "number? 0.05",
            size: "number? 1",
            spread: "number? 0.2",
        }),
    },
    types: {
        ParticleData: parseItem({
            type: "particle? PORTAL",
            duration: "number? 2.5 # in seconds",
            amount: "integer? 1",
            extra: "integer? 0",
            shape: "particleShape!",
            options: "ParticleOptionsData? 0 # only for dust particle",
        }),
        ParticleOptionsData: parseItem({
            colours: "Colour{}? {}",
            scale: "number? 1"
        }),
        Colour: parseItem({
            red: "integer? 0",
            green: "integer? 0",
            blue: "integer? 0",
        })
    }
}

console.log(JSON.stringify(schema, null, 4));

