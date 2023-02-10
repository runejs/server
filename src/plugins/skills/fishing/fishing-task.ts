import { Skill } from '@engine/world/actor/skills';
import {  Player, Npc } from '@engine/world/actor';
import { soundIds } from '@engine/world/config/sound-ids';
import { findItem, findNpc, findObject } from '@engine/config/config-handler';
import { activeWorld } from '@engine/world';
import { ActorActorInteractionTask } from '@engine/task/impl';
import { LandscapeObject } from '@runejs/filestore';
import { logger } from '@runejs/common';
import { IHarvestable } from '@engine/world/config';
import { canInitiateHarvest } from '@engine/world/skill-util/harvest-skill';
import { randomBetween } from '@engine/util';


class FishingTask extends ActorActorInteractionTask<Player, Npc>{

    private elapsedTicks = 0;

    constructor(
        player: Player,
        fishingSpot: Npc,
    ) {
        super(
            player,
            fishingSpot,
            1,
            1
        );


        if (!fishingSpot) {
            this.stop();
            return;
        }

    }
    public execute(): void {
        super.execute()

        if (!this.isActive || !this.otherActor) {
            return;
        }

        // store the tick count before incrementing so we don't need to keep track of it in all the separate branches
        const taskIteration = this.elapsedTicks++;

        // TODO wire this up into fishing spot config
        const fishingSpotInfo: Pick<IHarvestable, 'itemId' | 'level'> = {
            itemId: 335,

            // TODO change this too
            level: 1
        }

        const tool = canInitiateHarvest(this.actor, fishingSpotInfo, Skill.FISHING);

        if (!tool) {
            this.stop();
            return;
        }
        if(taskIteration === 0) {
            this.actor.sendMessage('You swing your axe at the tree.');
            this.actor.face(this.otherActor);
            this.actor.playAnimation(tool.animation);
            return;
        }
        const roll = randomBetween(1, 256)
        if(roll > 200){
            this.actor.giveItem(335)
        }

        this.actor.sendMessage('Doing a fish with a lovely long ' + findItem(tool.itemId).name)
        this.actor.playAnimation(tool.animation)
    }
    public onStop(): void {
        super.onStop();

        this.actor.sendMessage('=====Stopped fishing=======')
    }
}


export function runFishingTask(player: Player, npc: Npc): void {
    // const npcConfig = findNpc(npc.id);

    // if (!npcConfig) {
    //     logger.warn(`Player ${player.username} attempted to run a fishing task on an invalid object (id: ${npc.id})`);
    //     return;
    // }

    const sizeX = 1
    const sizeY = 1
    player.enqueueTask(FishingTask, [ npc, sizeX, sizeY ]);
}
