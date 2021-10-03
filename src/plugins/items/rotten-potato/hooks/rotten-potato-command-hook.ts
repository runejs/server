import { commandActionHandler } from '@engine/action/pipe/player-command.action';


const spawnPotato: commandActionHandler = (details) => {
    details.player.giveItem('rs:rotten_potato')
};

export default spawnPotato;
