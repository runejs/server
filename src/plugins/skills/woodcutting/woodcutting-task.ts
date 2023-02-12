import { Skill } from '@engine/world/actor/skills';
import { canInitiateHarvest } from '@engine/world/skill-util/harvest-skill';
import { getTreeFromHealthy, IHarvestable } from '@engine/world/config/harvestable-object';
import { randomBetween } from '@engine/util/num';
import { colorText } from '@engine/util/strings';
import { colors } from '@engine/util/colors';
import { rollBirdsNestType } from '@engine/world/skill-util/harvest-roll';
import { soundIds } from '@engine/world/config/sound-ids';
import { findItem, findObject } from '@engine/config/config-handler';
import { activeWorld } from '@engine/world';
import { canCut } from './chance';
import { ActorLandscapeObjectInteractionTask } from '@engine/task/impl';
import {  Player } from '@engine/world/actor';
import { LandscapeObject } from '@runejs/filestore';
import { logger } from '@runejs/common';

class WoodcuttingTask extends ActorLandscapeObjectInteractionTask<Player> {
    /**
     * The tree being cut down.
     */
    private treeInfo: IHarvestable;

    /**
     * The number of ticks that `execute` has been called inside this task.
     */
    private elapsedTicks = 0;

    /**
     * Create a new woodcutting task.
     *
     * @param player The player that is attempting to cut down the tree.
     * @param landscapeObject The object that represents the tree.
     * @param sizeX The size of the tree in x axis.
     * @param sizeY The size of the tree in y axis.
     */
    constructor(
        player: Player,
        landscapeObject: LandscapeObject,
        sizeX: number,
        sizeY: number
    ) {
        super(
            player,
            landscapeObject,
            sizeX,
            sizeY
        );

        if (!landscapeObject) {
            this.stop();
            return;
        }

        this.treeInfo = getTreeFromHealthy(landscapeObject.objectId);
        if (!this.treeInfo) {
            this.stop();
            return;
        }
    }

    /**
     * Execute the main woodcutting task loop. This method is called every game tick until the task is completed.
     *
     * As this task extends {@link ActorLandscapeObjectInteractionTask}, it's important that the
     * `super.execute` method is called at the start of this method.
     *
     * The base `execute` performs a number of checks that allow this task to function healthily.
     */
    public execute(): void {
        super.execute();

        if (!this.isActive || !this.landscapeObject) {
            return;
        }

        // store the tick count before incrementing so we don't need to keep track of it in all the separate branches
        const taskIteration = this.elapsedTicks++;

        const tool = canInitiateHarvest(this.actor, this.treeInfo, Skill.WOODCUTTING);

        if (!tool) {
            this.stop();
            return;
        }

        if(taskIteration === 0) {
            this.actor.sendMessage('You swing your axe at the tree.');
            this.actor.face(this.landscapeObjectPosition);
            this.actor.playAnimation(tool.animation);
            return;
        }

        // play a random axe sound at the correct time
        if(taskIteration % 3 !== 0) {
            if(taskIteration % 1 === 0) {
                const randomSoundIdx = Math.floor(Math.random() * soundIds.axeSwing.length);
                this.actor.playSound(soundIds.axeSwing[randomSoundIdx], 7, 0);
            }
            return;
        }

        // Get tool level, and set it to 2 if the tool is an iron hatchet or iron pickaxe
        // TODO why is this set to 2? Was ported from the old code
        let toolLevel = tool.level - 1;
        if(tool.itemId === 1349 || tool.itemId === 1267) {
            toolLevel = 2;
        }

        // roll for success
        const succeeds = canCut(this.treeInfo, toolLevel, this.actor.skills.woodcutting.level);
        if(!succeeds) {
            return;
        }

        const targetName: string = findItem(this.treeInfo.itemId).name.toLowerCase();

        // if player doesn't have space in inventory, stop the task
        if(!this.actor.inventory.hasSpace()) {
            this.actor.sendMessage(`Your inventory is too full to hold any more ${targetName}.`, true);
            this.actor.playSound(soundIds.inventoryFull);
            this.stop();
            return;
        }

        const itemToAdd = this.treeInfo.itemId;
        const roll = randomBetween(1, 256);
        // roll for bird nest chance
        if(roll === 1) {
            this.actor.sendMessage(colorText(`A bird's nest falls out of the tree.`, colors.red));
            activeWorld.globalInstance.spawnWorldItem(rollBirdsNestType(), this.actor.position,
                { owner: this.actor || null, expires: 300 });
        } else { // Standard log chopper
            this.actor.sendMessage(`You manage to chop some ${targetName}.`);
            this.actor.giveItem(itemToAdd);
        }

        this.actor.skills.woodcutting.addExp(this.treeInfo.experience);

        // check if the tree should be broken
        if(randomBetween(0, 100) <= this.treeInfo.break) {
            this.actor.playSound(soundIds.oreDepeleted);
            this.actor.instance.replaceGameObject(this.treeInfo.objects.get(this.landscapeObject.objectId),
                this.landscapeObject, randomBetween(this.treeInfo.respawnLow, this.treeInfo.respawnHigh));
            this.stop();
            return;
        }

        this.actor.playAnimation(tool.animation);

    }

    /**
     * This method is called when the task stops.
     */
    public onStop(): void {
        super.onStop();

        this.actor.stopAnimation();
    }
}

export function runWoodcuttingTask(player: Player, landscapeObject: LandscapeObject): void {
    const objectConfig = findObject(landscapeObject.objectId);

    if (!objectConfig) {
        logger.warn(`Player ${player.username} attempted to run a woodcutting task on an invalid object (id: ${landscapeObject.objectId})`);
        return;
    }

    const sizeX = objectConfig.rendering.sizeX;
    const sizeY = objectConfig.rendering.sizeY;

    player.enqueueTask(WoodcuttingTask, [ landscapeObject, sizeX, sizeY ]);
}
