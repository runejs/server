import { equipAction } from '@server/world/action/equip-action';
import { ItemDetails, WeaponStyle, weaponWidgetIds } from '@server/config/item-config';
import { widgets, widgetScripts } from '@server/world/config/widget';
import { Player, playerInitAction } from '@server/world/actor/player/player';
import { findItem } from '@server/config';
import { buttonAction } from '@server/world/action/button-action';


function updateCombatStyle(player: Player, weaponStyle: WeaponStyle, styleIndex: number): void {
    player.savedMetadata.combatStyle = [ weaponStyle, styleIndex ];
    player.settings.attackStyle = styleIndex;
    player.outgoingPackets.updateClientConfig(widgetScripts.attackStyle, styleIndex);
}

function showUnarmed(player: Player): void {
    player.modifyWidget(widgets.defaultCombatStyle, { childId: 0, text: 'Unarmed' });
    player.setSidebarWidget(0, widgets.defaultCombatStyle);
    let style = 0;
    if(player.savedMetadata.combatStyle) {
        style = player.savedMetadata.combatStyle[1] || null;
        if(style && style > 2) {
            style = 2;
        }
    }
    updateCombatStyle(player, 'unarmed', style);
}

function setWeaponWidget(player: Player, weaponStyle: WeaponStyle, itemDetails: ItemDetails): void {
    player.modifyWidget(weaponWidgetIds[weaponStyle], { childId: 0, text: itemDetails.name || 'Unknown' });
    player.setSidebarWidget(0, weaponWidgetIds[weaponStyle]);
    if(player.savedMetadata.combatStyle) {
        updateCombatStyle(player, weaponStyle, player.savedMetadata.combatStyle[1] || 0);
    }
}

const equip: equipAction = details => {
    const { player, itemDetails, equipmentSlot } = details;

    if(equipmentSlot === 'main_hand') {
        const weaponStyle = itemDetails?.equipmentData?.weaponInfo?.style || null;

        if(!weaponStyle) {
            showUnarmed(player);
            return;
        }

        setWeaponWidget(player, weaponStyle, itemDetails);
    }
};

const initAction: playerInitAction = details => {
    const { player } = details;

    const equippedItem = player.getEquippedItem('main_hand');
    if(equippedItem) {
        const itemDetails = findItem(equippedItem.itemId);
        const weaponStyle = itemDetails?.equipmentData?.weaponInfo?.style || null;

        if(weaponStyle) {
            setWeaponWidget(player, weaponStyle, itemDetails);
        } else {
            showUnarmed(player);
        }
    } else {
        showUnarmed(player);
    }
};

const combatStyleSelection: buttonAction = details => {
    const { player, buttonId } = details;

    const indices = {
        unarmed: {
            2: 0,
            3: 1,
            4: 2
        },
        axe: {
            2: 0,
            5: 1,
            4: 2,
            3: 3
        },
        dagger: {
            2: 0,
            3: 1,
            4: 2,
            5: 3
        }
    };

    const equippedItem = player.getEquippedItem('main_hand');
    if(!equippedItem) {
        player.savedMetadata.combatStyle = [ 'unarmed', indices['unarmed'][buttonId] ];
    } else {
        const weaponStyle = findItem(equippedItem.itemId)?.equipmentData?.weaponInfo?.style || null;
        if(weaponStyle && indices[weaponStyle][buttonId]) {
            player.savedMetadata.combatStyle = [ weaponStyle, indices[weaponStyle][buttonId] ];
        }
    }
};

export default [{
    type: 'equip_action',
    equipType: 'EQUIP',
    action: equip
}, {
    type: 'equip_action',
    equipType: 'UNEQUIP',
    action: details => {
        if(details.equipmentSlot === 'main_hand') {
            showUnarmed(details.player);
        }
    }
}, {
    type: 'player_init',
    action: initAction
}, {
    type: 'button',
    widgetIds: Object.values(weaponWidgetIds),
    action: combatStyleSelection
}];
