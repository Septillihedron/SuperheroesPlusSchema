package me.sepdron.schema.mc;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.BinaryOperator;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collector;
import java.util.stream.Stream;

import org.bukkit.Bukkit;
import org.bukkit.Keyed;
import org.bukkit.Registry;
import org.bukkit.entity.Ageable;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Explosive;
import org.bukkit.entity.Hoglin;
import org.bukkit.entity.Phantom;
import org.bukkit.entity.PiglinAbstract;
import org.bukkit.entity.Slime;
import org.bukkit.entity.ThrowableProjectile;
import org.bukkit.material.Colorable;
import org.bukkit.plugin.java.JavaPlugin;

public final class DocTools extends JavaPlugin {
	
    @Override
	public void onEnable() {
        // createEnumTypes();

        getConfig().set("Baby", new ArrayList<String>());
        getConfig().set("Colorable", new ArrayList<String>());
        getConfig().set("Explosive", new ArrayList<String>());
        getConfig().set("Size", new ArrayList<String>());
        getConfig().set("ThrowableProjectile", new ArrayList<String>());
        getConfig().set("Zombifiable", new ArrayList<String>());
        for (EntityType entity : EntityType.values()) {
            Class<?> entityClass = entity.getEntityClass();
            if (entityClass == null) {
                getLogger().warning("Entity class: " + entity.toString() + " is null");
                continue;
            }
            if (Ageable.class.isAssignableFrom(entityClass)) {
                List<String> list = getConfig().getStringList("Baby");
                list.add(entity.toString());
                getConfig().set("Baby", list);
            }
            if (Colorable.class.isAssignableFrom(entityClass)) {
                List<String> list = getConfig().getStringList("Colorable");
                list.add(entity.toString());
                getConfig().set("Colorable", list);
            }
            if (Explosive.class.isAssignableFrom(entityClass)) {
                List<String> list = getConfig().getStringList("Explosive");
                list.add(entity.toString());
                getConfig().set("Explosive", list);
            }
            if (Slime.class.isAssignableFrom(entityClass) || Phantom.class.isAssignableFrom(entityClass)) {
                List<String> list = getConfig().getStringList("Size");
                list.add(entity.toString());
                getConfig().set("Size", list);
            }
            if (ThrowableProjectile.class.isAssignableFrom(entityClass)) {
                List<String> list = getConfig().getStringList("ThrowableProjectile");
                list.add(entity.toString());
                getConfig().set("ThrowableProjectile", list);
            }
            if (Hoglin.class.isAssignableFrom(entityClass) || PiglinAbstract.class.isAssignableFrom(entityClass)) {
                List<String> list = getConfig().getStringList("Zombifiable");
                list.add(entity.toString());
                getConfig().set("Zombifiable", list);
            }
        }
        saveConfig();


        Bukkit.getServer().shutdown();
    }

    void createEnumTypes() {
        save("entity", org.bukkit.entity.EntityType.values());
        save("blockFace", org.bukkit.block.BlockFace.values());
		saveKeyed("trimPattern", Registry.TRIM_PATTERN.stream());
        saveKeyed("trimMaterial", Registry.TRIM_MATERIAL.stream());
		saveKeyed("enchantment", org.bukkit.enchantments.Enchantment.values());
        saveKeyed("potion", org.bukkit.potion.PotionEffectType.values());
		save("potionItemType", org.bukkit.potion.PotionType.values());
        save("dyeColor", org.bukkit.DyeColor.values());
        save("axolotlVariant", org.bukkit.entity.Axolotl.Variant.values());
        save("horseColor", org.bukkit.entity.Horse.Color.values());
        save("horseStyle", org.bukkit.entity.Horse.Style.values());
        save("llamaColor", org.bukkit.entity.Llama.Color.values());
        save("rabbitType", org.bukkit.entity.Rabbit.Type.values());
        save("arrowPickupStatus", org.bukkit.entity.AbstractArrow.PickupStatus.values());
        save("damageCause", org.bukkit.event.entity.EntityDamageEvent.DamageCause.values());
		save("potionEffectCause", org.bukkit.event.entity.EntityPotionEffectEvent.Cause.values());
		save("potionEffectAction", org.bukkit.event.entity.EntityPotionEffectEvent.Action.values());
		save("teleportCause", org.bukkit.event.player.PlayerTeleportEvent.TeleportCause.values());
        save("action", org.bukkit.event.block.Action.values());
        save("lootTable", org.bukkit.loot.LootTables.values()); 
        save("biome", org.bukkit.block.Biome.values());
		save("world", new String[]{"world", "world_nether", "world_the_end"});
        save("equipmentSlot", org.bukkit.inventory.EquipmentSlot.values());
        save("attribute", org.bukkit.attribute.Attribute.values());
        save("collisionMode", org.bukkit.FluidCollisionMode.values());
        save("sound", org.bukkit.Sound.values());
        save("particle", org.bukkit.Particle.values());
        save("material", org.bukkit.Material.values());
		
		saveConfig();
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
        String array = stream.map(function).map(String::toUpperCase).collect(JSONArrayCollector.instance);
		
        getConfig().set(name, array);
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
