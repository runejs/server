import { commandActionHandler } from '@engine/world/action/player-command.action';


const spawnPotato: commandActionHandler = (details) => {
    details.player.giveItem('rs:rotten_potato')


};

export default spawnPotato;
