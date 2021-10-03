import { commandActionHandler } from '@engine/action';


const spawnPotato: commandActionHandler = (details) => {
    details.player.giveItem('rs:rotten_potato')
};

export default spawnPotato;
