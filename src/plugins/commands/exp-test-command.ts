import { commandActionHandler } from '@engine/world/action/player-command.action';
import { Skill } from '@engine/world/actor/skills';

const action: commandActionHandler = (details) => {
    const { player } = details;

    player.skills.addExp(Skill.RUNECRAFTING, 1000);
};

export default {
    type: 'player_command',
    commands: 'exptest',
    action
};
