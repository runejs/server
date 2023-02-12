import { LandscapeObject } from '@runejs/filestore';
import { findItem } from "@engine/config";
import { ActorLandscapeObjectInteractionTask, ActorTask } from "@engine/task/impl";
import { colors, colorText, randomBetween } from "@engine/util";
import { Player, Skill } from "@engine/world/actor";
import { HarvestTool, IHarvestable, soundIds } from "@engine/world/config";
import { checkForGemBoost } from "@engine/world/skill-util/glory-boost";
import { rollGemType } from "@engine/world/skill-util/harvest-roll";
import { canMine } from "./chance";

/**
 * A task that handles mining.
 */
export class MiningTask extends ActorLandscapeObjectInteractionTask<Player> {
    private elapsedTicks = 0;
    private targetItemName: string;

    constructor(player: Player, landscapeObject: LandscapeObject, private readonly ore: IHarvestable, private readonly tool: HarvestTool) {
        super(player, landscapeObject);

        this.targetItemName = findItem(this.ore.itemId).name.toLowerCase().replace(' ore', '')
    }

    public execute(): void {
        const taskIteration = this.elapsedTicks++;

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
        if(this.tool.itemId === 1349 || this.tool.itemId === 1267) {
            toolLevel = 2;
        }

        // roll for success
        const succeeds = canMine(this.ore, toolLevel, this.actor.skills.mining.level);
        if(!succeeds) {
            return;
        }

        const findsRareGem = randomBetween(1, checkForGemBoost(this.actor)) === 1;
        if (findsRareGem) {
            this.actor.sendMessage(colorText('You found a rare gem.', colors.red));
            this.actor.giveItem(rollGemType());
        } else {
            this.actor.sendMessage(`You manage to mine some ${this.targetItemName}.`);
            this.actor.giveItem(this.ore.itemId);

            // TODO (Jameskmonger) handle Gem rocks and Pure essence rocks
            // if (itemToAdd === 1436 && details.player.skills.hasLevel(Skill.MINING, 30)) {
            //     itemToAdd = 7936;
            // }
            // if (details.object.objectId === 2111 && details.player.skills.hasLevel(Skill.MINING, 30)) {
            //     itemToAdd = rollGemRockResult().itemId;
            // }
        }

        this.actor.skills.addExp(Skill.MINING, this.ore.experience);

        if (randomBetween(0, 100) <= this.ore.break) {
            this.actor.playSound(soundIds.oreDepeleted);
            this.actor.instance.replaceGameObject(this.ore.objects.get(this.landscapeObject.objectId),
                this.landscapeObject, randomBetween(this.ore.respawnLow, this.ore.respawnHigh));
            this.stop();
            this.actor.playAnimation(null);
            return;
        }
    }

    private hasMaterials() {
        return this.actor.inventory.has(this.tool.itemId);
    }

    private hasLevel() {
        return this.actor.skills.hasLevel(Skill.MINING, this.ore.level);
    }
}
