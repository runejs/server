import { ActionType } from '@engine/action/action-pipeline';
import { ObjectInteractionAction } from '@engine/action/pipe/object-interaction.action';
import { Quest } from '@engine/world/actor/player/quest';

// Base hook type that all hook types must extend
export interface BaseHook {
    type: ActionType;
    handler: (...args: any[]) => any;
}

// Object interaction hook type
export interface ObjectInteractionHook extends BaseHook {
    type: 'object_interaction';
    objectIds: number[];
    options?: string[];
    walkTo?: boolean;
    handler: (details: ObjectInteractionAction) => any;
}

// Button interaction hook type
export interface ButtonHook extends BaseHook {
    type: 'button';
    widgetId: number;
    buttonIds: number[];
}

// Widget interaction hook type
export interface WidgetInteractionHook extends BaseHook {
    type: 'widget_interaction';
    widgetIds: number | number[];
    childIds?: number | number[];
    optionId?: number;
}

// NPC interaction hook type
export interface NpcInteractionHook extends BaseHook {
    type: 'npc_interaction';
    npcs?: string | string[];
    options?: string | string[];
    walkTo: boolean;
}

// Item interaction hook type
export interface ItemInteractionHook extends BaseHook {
    type: 'item_interaction';
    itemIds?: number | number[];
    widgets?: { widgetId: number; containerId: number } | { widgetId: number; containerId: number }[];
    options?: string | string[];
}

// Item-on-object hook type
export interface ItemOnObjectHook extends BaseHook {
    type: 'item_on_object';
    objectIds: number | number[];
    itemIds: number | number[];
    walkTo: boolean;
}

// Item-on-NPC hook type
export interface ItemOnNpcHook extends BaseHook {
    type: 'item_on_npc';
    npcs: string | string[];
    itemIds: number | number[];
    walkTo: boolean;
}

// Item-on-player hook type
export interface ItemOnPlayerHook extends BaseHook {
    type: 'item_on_player';
    itemIds: number | number[];
    walkTo: boolean;
}

// Item-on-item hook type
export interface ItemOnItemHook extends BaseHook {
    type: 'item_on_item';
    items: { item1: number; item2?: number }[];
}

// Player/NPC init hook type
export interface InitHook extends BaseHook {
    type: 'player_init' | 'npc_init';
}

// Player command hook type
export interface PlayerCommandHook extends BaseHook {
    type: 'player_command';
    commands: string | string[];
    args?: {
        name: string;
        type: 'number' | 'string' | 'either';
        defaultValue?: number | string;
    }[];
}

// Player interaction hook type
export interface PlayerInteractionHook extends BaseHook {
    type: 'player_interaction';
    options: string | string[];
    walkTo: boolean;
}

// Region change hook type
export interface RegionChangeHook extends BaseHook {
    type: 'region_change';
    regionType?: string;
    regionTypes?: string[];
    teleporting?: boolean;
}

// Equipment change hook type
export interface EquipmentChangeHook extends BaseHook {
    type: 'equipment_change';
    itemIds?: number | number[];
    eventType?: 'equip' | 'unequip';
}

// Item swap hook type
export interface ItemSwapHook extends BaseHook {
    type: 'item_swap';
    widgetId?: number;
    widgetIds?: number[];
}

// Move item hook type
export interface MoveItemHook extends BaseHook {
    type: 'move_item';
    widgetId?: number;
    widgetIds?: number[];
}

// Item on world item hook type
export interface ItemOnWorldItemHook extends BaseHook {
    type: 'item_on_world_item';
    items: { item?: number; worldItem?: number }[];
}

// Spawned item interaction hook type
export interface SpawnedItemInteractionHook extends BaseHook {
    type: 'spawned_item_interaction';
    itemIds?: number | number[];
    options: string | string[];
    walkTo: boolean;
}

// Magic on item hook type
export interface MagicOnItemHook extends BaseHook {
    type: 'magic_on_item';
    itemIds?: number | number[];
    spellIds?: number | number[];
}

// Magic on player hook type
export interface MagicOnPlayerHook extends BaseHook {
    type: 'magic_on_player';
    spellIds?: number | number[];
}

// Magic on NPC hook type
export interface MagicOnNpcHook extends BaseHook {
    type: 'magic_on_npc';
    npcs?: string | string[];
    spellIds?: number | number[];
}

// Prayer hook type
export interface PrayerHook extends BaseHook {
    type: 'prayer';
    prayers?: number | number[];
}

// Union of all possible hook types
export type PluginHook =
    | ObjectInteractionHook
    | ButtonHook
    | WidgetInteractionHook
    | NpcInteractionHook
    | ItemInteractionHook
    | ItemOnObjectHook
    | ItemOnNpcHook
    | ItemOnPlayerHook
    | ItemOnItemHook
    | ItemOnWorldItemHook
    | ItemSwapHook
    | MoveItemHook
    | SpawnedItemInteractionHook
    | MagicOnItemHook
    | MagicOnPlayerHook
    | MagicOnNpcHook
    | InitHook
    | PlayerCommandHook
    | PlayerInteractionHook
    | RegionChangeHook
    | EquipmentChangeHook
    | PrayerHook;

// Main plugin type
export interface ContentPlugin {
    // Unique identifier for the plugin
    pluginId: string;

    // Array of hooks this plugin provides
    hooks?: PluginHook[];

    // Optional quests defined by this plugin
    quests?: Quest[];

    // Optional plugin configuration
    config?: {
        // Whether the plugin can be hot-reloaded
        reloadable?: boolean;

        // Plugin dependencies
        dependencies?: string[];

        // Plugin load priority (higher numbers load first)
        priority?: number;
    };
}
