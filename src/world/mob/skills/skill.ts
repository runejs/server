export interface Skill {
    readonly name: string;
    readonly advancementInterfaceId?: number;
}

export const skills: Skill[] = [
    { name: 'Attack' },
    { name: 'Defence' },
    { name: 'Strength' },
    { name: 'Hitpoints' },
    { name: 'Ranged' },
    { name: 'Prayer' },
    { name: 'Magic' },
    { name: 'Cooking' },
    { name: 'Woodcutting', advancementInterfaceId: 4272 },
    { name: 'Fletching' },
    { name: 'Fishing' },
    { name: 'Firemaking' },
    { name: 'Crafting' },
    { name: 'Smithing' },
    { name: 'Mining' },
    { name: 'Herblore' },
    { name: 'Agility' },
    { name: 'Thieving' },
    { name: 'Slayer' },
    { name: 'Farming' },
    { name: 'Runecrafting' }
];
