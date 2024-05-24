package me.sepdron.schema.mc;

import java.io.File;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collector;
import java.util.stream.Stream;
import java.util.function.BiConsumer;
import java.util.function.BinaryOperator;
import java.util.function.Function;
import java.util.function.Supplier;

import org.bukkit.Bukkit;
import org.bukkit.Keyed;
import org.bukkit.Registry;
import org.bukkit.plugin.java.JavaPlugin;

public final class DocTools extends JavaPlugin {
	
    @Override
	public void onEnable() {
        save("entities", org.bukkit.entity.EntityType.values());
        save("blockFace", org.bukkit.block.BlockFace.values());
		saveKeyed("trimPattern", Registry.TRIM_PATTERN.stream().toArray(Keyed[]::new));
        saveKeyed("trimMaterial", Registry.TRIM_MATERIAL.stream().toArray(Keyed[]::new));
		saveKeyed("enchantment", org.bukkit.enchantments.Enchantment.values());
        saveKeyed("potion", org.bukkit.potion.PotionEffectType.values());
        save("dyeColor", org.bukkit.DyeColor.values());
        save("axolotlVariant", org.bukkit.entity.Axolotl.Variant.values());
        save("horseColor", org.bukkit.entity.Horse.Color.values());
        save("horseStyle", org.bukkit.entity.Horse.Style.values());
        save("damageCause", org.bukkit.event.entity.EntityDamageEvent.DamageCause.values());
		save("potionEffectCause", org.bukkit.event.entity.EntityPotionEffectEvent.Cause.values());
		save("potionEffectAction", org.bukkit.event.entity.EntityPotionEffectEvent.Action.values());
		save("teleportCause", org.bukkit.event.player.PlayerTeleportEvent.TeleportCause.values());
        save("action", org.bukkit.event.block.Action.values());
        save("lootTable", org.bukkit.loot.LootTables.values());
        save("biome", org.bukkit.block.Biome.values());
		getConfig().set("world", "[\"world\", \"world_nether\", \"world_the_end\"]");
        save("equipmentSlot", org.bukkit.inventory.EquipmentSlot.values());
        save("attribute", org.bukkit.attribute.Attribute.values());
        save("collisionMode", org.bukkit.FluidCollisionMode.values());
        save("sound", org.bukkit.Sound.values());
        save("particle", org.bukkit.Particle.values());
        save("material", org.bukkit.Material.values());
		
        Bukkit.getServer().shutdown();
    }
    
    <T extends Keyed> void saveKeyed(String name, T[] arr) {
        saveKeyed(name, Arrays.stream(arr));
    }
	<T extends Keyed> void saveKeyed(String name, Stream<T> stream) {
        save(name, stream, x -> x.getKey().getKey());
    }

    <T> void save(String name, T[] arr) {
        save(name, Arrays.stream(arr));
    }
	<T> void save(String name, Stream<T> stream) {
        save(name, stream, x -> x.toString());
    }
    <T> void save(String name, Stream<T> stream, Function<T, String> function) {
        String array = stream.map(function).collect(JSONArrayCollector.instance);
		
        getConfig().set(name, array);
        saveConfig();
    }
    
    static class JSONArrayCollector implements Collector<String, StringBuilder, String> {
        static final JSONArrayCollector instance;
        
        @Override
        public Supplier<StringBuilder> supplier() {
            return StringBuilder::new;
        }
        
        @Override
        public BiConsumer<StringBuilder, String> accumulator() {
            return (sb, s) -> sb.append(", ").append('\"').append(s).append('\"');
        }
        
        @Override
        public BinaryOperator<StringBuilder> combiner() {
            return (sb1, sb2) -> sb1.append(", ").append(sb2);
        }
        
        @Override
        public Function<StringBuilder, String> finisher() {
            return stringBuilder -> "["+stringBuilder.toString().substring(2)+"]";
        }
        
        @Override
        public Set<Collector.Characteristics> characteristics() {
            return Set.of(Collector.Characteristics.UNORDERED);
        }
        
        static {
            instance = new JSONArrayCollector();
        }
    }
	
}
