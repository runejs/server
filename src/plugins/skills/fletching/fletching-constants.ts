import { ItemDetails } from '@engine/config/item-config';
import { itemSelectionDialogue } from '@engine/world/actor/dialogue';
import { itemIds } from '@engine/world/config/item-ids';
import { Fletchable } from '@plugins/skills/fletching/fletching-types';


export const knifeId: number = itemIds.knife;

export const fletchables : Map<string, Map<string, Fletchable>> = new Map<string, Map<string, Fletchable>>([
    ['bow(u)', new Map<string, Fletchable>([
        ['wood short', {
            level: 1,
            experience: 5,
            item: { itemId: itemIds.bowunstrung.woodshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['wood long', {
            level: 10,
            experience: 10,
            item: { itemId: itemIds.bowunstrung.woodlong, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['oak short', {
            level: 20,
            experience: 16.5,
            item: { itemId: itemIds.bowunstrung.oakshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['oak long', {
            level: 25,
            experience: 25,
            item: { itemId: itemIds.bowunstrung.oaklong, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['comp ogre', {
            level: 30,
            experience: 45,
            item: { itemId: itemIds.bowunstrung.compogre, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['willow short', {
            level: 35,
            experience: 33.3,
            item: { itemId: itemIds.bowunstrung.willowshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['willow long', {
            level: 40,
            experience: 41.5,
            item: { itemId: itemIds.bowunstrung.willowlong, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['maple short', {
            level: 50,
            experience: 50,
            item: { itemId: itemIds.bowunstrung.mapleshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['maple long', {
            level: 55,
            experience: 58.3,
            item: { itemId: itemIds.bowunstrung.maplelong, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['yew short', {
            level: 65,
            experience: 67.5,
            item: { itemId: itemIds.bowunstrung.yewshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['yew long', {
            level: 70,
            experience: 75,
            item: { itemId: itemIds.bowunstrung.yewlong, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['magic short', {
            level: 80,
            experience: 83.3,
            item: { itemId: itemIds.bowunstrung.magicshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
        ['magic long', {
            level: 85,
            experience: 91.5,
            item: { itemId: itemIds.bowunstrung.magiclong, amount: 1 },
            ingredient: [
                { itemId: itemIds.logs.normal, amount: 1 }
            ] 
        }],
    ])],
    ['bow', new Map<string, Fletchable>([
        ['wood short', {
            level: 1,
            experience: 5,
            item: { itemId: itemIds.bowstrung.woodshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.woodshort, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['wood long', {
            level: 10,
            experience: 10,
            item: { itemId: itemIds.bowstrung.woodlong, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.woodlong, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['oak short', {
            level: 20,
            experience: 16.5,
            item: { itemId: itemIds.bowunstrung.oakshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.oakshort, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['oak long', {
            level: 25,
            experience: 25,
            item: { itemId: itemIds.bowstrung.oaklong, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.oaklong, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['comp ogre', {
            level: 30,
            experience: 45,
            item: { itemId: itemIds.bowstrung.compogre, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.compogre, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['willow short', {
            level: 35,
            experience: 33.3,
            item: { itemId: itemIds.bowstrung.willowshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.willowshort, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['willow long', {
            level: 40,
            experience: 41.5,
            item: { itemId: itemIds.bowstrung.willowlong, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.willowlong, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['maple short', {
            level: 50,
            experience: 50,
            item: { itemId: itemIds.bowstrung.mapleshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.mapleshort, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['maple long', {
            level: 55,
            experience: 58.3,
            item: { itemId: itemIds.bowstrung.maplelong, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.maplelong, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['yew short', {
            level: 65,
            experience: 67.5,
            item: { itemId: itemIds.bowstrung.yewshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.yewshort, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['yew long', {
            level: 70,
            experience: 75,
            item: { itemId: itemIds.bowstrung.yewlong, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.yewlong, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['magic short', {
            level: 80,
            experience: 83.3,
            item: { itemId: itemIds.bowstrung.magicshort, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.magicshort, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
        ['magic long', {
            level: 85,
            experience: 91.5,
            item: { itemId: itemIds.bowstrung.magiclong, amount: 1 },
            ingredient: [
                { itemId: itemIds.bowunstrung.magiclong, amount: 1 },
                { itemId: itemIds.bowstring, amount: 1 }
            ] 
        }],
    ])]
])