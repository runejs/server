import { loopingEvent } from '@engine/plugins';
import { WorldItem } from '@engine/world';
import { Player } from '@engine/world/actor';
import { animationIds, soundIds } from '@engine/world/config';
import { canLight } from './chance';
import { lightFire } from './light-fire';
import { Burnable } from './types';

export function runFiremakingTask(player: Player, worldItemLog: WorldItem, skillInfo: Burnable) {
    let canLightFire = false;
    let elapsedTicks = 0;
    const loop = loopingEvent({ player });
    loop.event.subscribe(() => {
        if (worldItemLog.removed) {
            loop.cancel();
            return;
        }

        if (canLightFire) {
            loop.cancel();
            player.metadata.busy = true;
            setTimeout(() => lightFire(player, player.position, worldItemLog, skillInfo.experienceGained), 1200);
            return;
        }

        // @TODO check for existing location objects again (in-case one spawned here during this loop)
        // @TODO check for tinderbox in-case it was removed

        if (elapsedTicks === 0 || elapsedTicks % 12 === 0) {
            player.playAnimation(animationIds.lightingFire);
        }

        canLightFire = elapsedTicks > 10 && canLight(skillInfo.requiredLevel, player.skills.firemaking.level);

        if (!canLightFire && (elapsedTicks === 0 || elapsedTicks % 4 === 0)) {
            player.playSound(soundIds.lightingFire, 10, 0);
        } else if (canLightFire) {
            player.playSound(soundIds.fireLit, 7);
        }

        elapsedTicks++;
    });
}
