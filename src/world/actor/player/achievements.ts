import { Player } from '@server/world/actor/player/player';

export const achievementSeries = {
    lumbridge: {
        name: 'Lumbridge'
    },
    varrock: {
        name: 'Varrock'
    }
};

export enum AchievementSeries {
    LUMBRIDGE = 'lumbridge',
    VARROCK = 'varrock',
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    series: AchievementSeries;
}

export namespace Achievements {
    export const WELCOME: Achievement = {
        id: 'lumbridge-hans-welcome',
        name: 'Welcome!',
        description: 'Talk to Hans.',
        longDescription: `Speak with Hans in the Lumbridge Castle's courtyard.`,
        series: AchievementSeries.LUMBRIDGE
    }
}

export function giveAchievement(achievement: Achievement, player: Player): boolean {
    if(hasAchievement(achievement, player)) {
        // return false;
    }

    player.achievements.push(achievement.id);
    player.sendMessage(`<col=ffff00><shad>You've completed an Achievement in the ` +
        `${ achievementSeries[achievement.series].name } series!</shad></col>`);
    player.sendMessage(`<col=255>${ achievement.name }</col> - <i>${ achievement.description }</i>`);
    return true;
}

export function hasAchievement(achievement: Achievement, player: Player): boolean {
    if(!player.achievements || player.achievements.length === 0) {
        return false;
    }

    return player.achievements.indexOf(achievement.id) !== -1;
}
