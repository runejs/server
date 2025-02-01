import { MagicOnNPCAction } from '@engine/action/pipe/magic-on-npc.action';
import { ContentPlugin } from '@engine/plugins/plugin.types';
import { colors } from '@engine/util/colors';
import { colorText } from '@engine/util/strings';
import { TargetLock } from '@engine/world/actor/combat';
import { Npc } from '@engine/world/actor/npc';
import { Player } from '@engine/world/actor/player/player';
import { QueueType } from '@engine/world/actor/tick-queue';
import { World } from '@engine/world/world';
import { CombatSpell, SPELLS_BY_ID } from '@plugins/combat/magic/config/normal-spells.constants';
import { logger } from '@runejs/common';

const SPLASH_GFX = 85; // 339
const CAST_ANIMATION = 711;

function initMagic(details: MagicOnNPCAction): Promise<void> {
    const { player, buttonId, npc } = details;
    const spell = SPELLS_BY_ID[buttonId];

    // Face and stop moving first - regardless of success.
    // Not sure if this is correct but it really annoys me when I start walking :D
    player.face(npc, true, true, true);

    if (spell == null) {
        return Promise.reject(`Unhandled spell id: ${buttonId}`);
    }

    if (player.position.distanceBetween(npc.position) > 10) {
        return Promise.reject('TOO FAR BRUH');
    }

    if (player.skills.magic.level < spell.level) {
        player.sendMessage('You do not have a high enough magic level to cast this spell.');
        return Promise.reject('Skill Insufficient');
    }

    // TODO: Check runes
    // TODO: Check projectile has a path to the enemy (no walls in the way.)

    // 3000ms (5 ticks) is the attack time for all spells.
    const targetLock = npc.maybeGetTargetLock(3000);
    if (!targetLock) {
        return Promise.reject('Unable to acquire target lock.');
    }

    return castSpell(targetLock, player, npc, spell);
}

/** Fires the laser! ☄️ */
const castSpell = async (targetLock: TargetLock, player: Player, npc: Npc, spell: CombatSpell) => {
    // TODO: Determine if we should splash instead of doing damage.
    const damage = Math.round(Math.random() * spell.maxHit);

    player.playAnimation({ id: CAST_ANIMATION, delay: 20 });
    player.playGraphics({ id: spell.startGfx, delay: 20, height: 100 });

    player.outgoingPackets.sendProjectile(
        player.position,
        npc.position.y - player.position.y,
        npc.position.x - player.position.x,
        spell.projectileGfx,
        43,
        31,
        80,
        npc.worldIndex + 1, // Not sure why the worldIndex needs a +1 here.
        65,
    );

    return new Promise<void>(resolve => {
        setTimeout(() => {
            player.skills.magic.addExp(spell.baseExperience + damage * 2);
            player.skills.hitpoints.addExp(damage * 1.33);
            npc.playGraphics({ id: spell.endGfx, delay: 0, height: 100 });
            npc.hit(targetLock, player, damage);
            return resolve();
        }, World.TICK_LENGTH * 4);
    });
};

export default (<ContentPlugin>{
    pluginId: 'rs:magic_normal-spells',
    hooks: {
        type: 'magic_on_npc',
        widgetId: 192,
        buttonIds: Object.keys(SPELLS_BY_ID).map(i => Number.parseInt(i)),
        handler: details => initMagic(details).catch(error => logger.error(error)),
        walkTo: false,
    },
});
