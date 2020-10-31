import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { Skill } from '@server/world/actor/skills';

const action: commandAction = (details) => {
    const { player } = details;

    player.skills.addExp(Skill.RUNECRAFTING, 1000);
};

export default {
    type: 'player_command',
    commands: 'exptest',
    action
};
