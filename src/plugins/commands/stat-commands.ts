import { commandAction } from '@server/world/action/player-command-action';


const setLevelAction: commandAction = ({ player, args }) => {
    const skillId = args?.skillId || null;
    const level: number = args?.level as number || null;

    if(!skillId || !level) {
        player.sendMessage(`Invalid syntax: Use ::setlevel skill_id skill_level`);
        return;
    }

    const skill = player.skills[skillId];
    if(!skill) {
        player.sendMessage(`Skill ${skillId} not found.`);
        return;
    }

    const exp = player.skills.getExpForLevel(level);
    skill.exp = exp;
    skill.level = level;
    player.outgoingPackets.updateSkill(player.skills.getSkillId(skillId as any), level, exp);
};

export default [{
    type: 'player_command',
    commands: [ 'setlevel', 'setlvl' ],
    args: [
        {
            name: 'skillId',
            type: 'string'
        },
        {
            name: 'level',
            type: 'number'
        }
    ],
    action: setLevelAction
}];
