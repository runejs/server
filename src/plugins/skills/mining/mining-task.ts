import { findItem } from '@engine/config/config-handler';
import { equipmentIndices } from '@engine/config/item-config';
import { ActorLandscapeObjectInteractionTask } from '@engine/task/impl/actor-landscape-object-interaction-task';
import { colors } from '@engine/util/colors';
import { randomBetween } from '@engine/util/num';
import { colorText } from '@engine/util/strings';
import type { Player } from '@engine/world/actor/player/player';
import { Skill } from '@engine/world/actor/skills';
import type { HarvestTool } from '@engine/world/config/harvest-tool';
import type { IHarvestable } from '@engine/world/config/harvestable-object';
import { selectWeightedItem } from '@engine/world/config/harvestable-object';
import { soundIds } from '@engine/world/config/sound-ids';
import { checkForGemBoost } from '@engine/world/skill-util/glory-boost';
import { rollGemType } from '@engine/world/skill-util/harvest-roll';
import type { LandscapeObject } from '@runejs/filestore';
import { canMine } from './chance';

/**
 * A task that handles mining. It is a subclass of ActorLandscapeObjectInteractionTask, which means that it will
 * walk to the object, and then execute the task when it is in range.
 *
 * The mining task will repeat until the player's inventory is full, or the rock is depleted, or the task is otherwise
 * stopped.
 *
 * @author jameskmonger
 */
export class MiningTask extends ActorLandscapeObjectInteractionTask<Player> {
    /**
     * The number of ticks that have elapsed since this task was started.
     *
     * We use this to determine when to mine the next ore, or play the next animation.
     */
    private elapsedTicks = 0;

    /**
     * The name of the item that we are mining.
     */
    private targetItemName: string;

    constructor(
        player: Player,
        landscapeObject: LandscapeObject,
        private readonly ore: IHarvestable,
        private readonly tool: HarvestTool,
    ) {
        super(player, landscapeObject);

        const itemConfigId = typeof ore.items === 'string' ? ore.items : selectWeightedItem(ore.items);
        const item = findItem(itemConfigId);

        if (!item) {
            throw new Error(`Could not find item with ID ${itemConfigId}`);
        }

        this.targetItemName = item.name.toLowerCase().replace(' ore', '');
    }

    private isGemRock(): boolean {
        return this.landscapeObject?.objectId === 2111;
    }

    private hasChargedGlory(): boolean {
        const neckSlotIndex = equipmentIndices['neck']; // This is 2
        const neckItem = this.actor.equipment.items[neckSlotIndex];
        if (!neckItem) {
            return false;
        }
        const itemConfig = findItem(neckItem.itemId);
        if (!itemConfig) {
            return false;
        }
        return itemConfig.key.startsWith('rs:amulet_of_glory:charged_');
    }

    public onObjectReached(): void {
        const taskIteration = this.elapsedTicks++;

        // This will be null if the player is not in range of the object.
        if (!this.landscapeObject) {
            return;
        }

        if (!this.hasLevel()) {
            this.actor.sendMessage(`You need a Mining level of ${this.ore.level} to mine this rock.`, true);
            return;
        }

        if (!this.hasMaterials()) {
            this.actor.sendMessage('You do not have a pickaxe for which you have the level to use.');
            return;
        }

        // Check if the players inventory is full, and notify them if its full.
        if (!this.actor.inventory.hasSpace()) {
            this.actor.sendMessage(`Your inventory is too full to hold any more ${this.targetItemName}.`, true);
            this.actor.playSound(soundIds.inventoryFull);
            return;
        }

        // mining in original plugin took 3 ticks to mine a rock, so we'll do the same for now
        if (taskIteration % 3 !== 0) {
            return;
        }

        this.actor.playSound(soundIds.pickaxeSwing, 7, 0);
        this.actor.playAnimation(this.tool.animation);

        // Get tool level, and set it to 2 if the tool is an iron hatchet or iron pickaxe
        // TODO why is this set to 2? Was ported from the old code
        let toolLevel = this.tool.level - 1;
        if (this.tool.itemId === 1349 || this.tool.itemId === 1267) {
            toolLevel = 2;
        }

        // roll for success
        const succeeds = canMine({ ...this.ore, baseChance: this.getGemMiningChance() }, toolLevel, this.actor.skills.mining.level);
        if (!succeeds) {
            return;
        }

        const findsRareGem = randomBetween(1, checkForGemBoost(this.actor)) === 1;
        if (findsRareGem) {
            this.actor.sendMessage(colorText('You found a rare gem.', colors.red));
            this.actor.giveItem(rollGemType());
        } else {
            this.actor.sendMessage(`You manage to mine some ${this.targetItemName}.`);
            const itemToGive = typeof this.ore.items === 'string' ? this.ore.items : selectWeightedItem(this.ore.items);
            this.actor.giveItem(itemToGive);
            // TODO (Jameskmonger) handle Gem rocks and Pure essence rocks
            // if (itemToAdd === 1436 && details.player.skills.hasLevel(Skill.MINING, 30)) {
            //     itemToAdd = 7936;
            // }
            // if (details.object.objectId === 2111 && details.player.skills.hasLevel(Skill.MINING, 30)) {
            //     itemToAdd = rollGemRockResult().itemId;
            // }
        }

        this.actor.skills.addExp(Skill.MINING, this.ore.experience);

        // check if the rock is depleted
        if (randomBetween(0, 100) <= this.ore.break) {
            this.actor.playSound(soundIds.oreDepeleted);
            this.actor.playAnimation(null);

            const replacementObject = this.ore.objects.get(this.landscapeObject.objectId);

            if (replacementObject) {
                const respawnTime = randomBetween(this.ore.respawnLow, this.ore.respawnHigh);
                this.actor.instance.replaceGameObject(replacementObject, this.landscapeObject, respawnTime);
            }

            this.stop();
            return;
        }
    }

    /**
     * Checks if the player has the pickaxe they started with.
     *
     * @returns true if the player has the pickaxe, false otherwise
     */
    private hasMaterials() {
        return this.actor.inventory.has(this.tool.itemId);
    }

    private getGemMiningChance(): number {
        if (!this.isGemRock()) {
            return this.ore.baseChance;
        }

        // Base chance scaling from 28 to 70 based on level
        let chance = this.ore.baseChance + ((this.actor.skills.mining.level - this.ore.level) * (70 - 28)) / (99 - 40);

        // Glory multiplies chance by 3 (from 28-70 to 84-210)
        if (this.hasChargedGlory()) {
            chance *= 3;
        }

        return chance;
    }

    /**
     * Check that the player still has the level to mine the ore.
     *
     * @returns true if the player has the level, false otherwise
     */
    private hasLevel() {
        return this.actor.skills.hasLevel(Skill.MINING, this.ore.level);
    }
}
