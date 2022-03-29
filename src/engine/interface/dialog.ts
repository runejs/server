import { Npc, Player } from '@engine/world/actor';

type Emote = 'pompous' |
    'unknown_creature' |
    'very_sad' |
    'happy' |
    'shocked' |
    'wondering' |
    'goblin' |
    'tree' |
    'generic' |
    'skeptical' |
    'worried' |
    'drowzy' |
    'laugh' |
    'sad' |
    'angry' |
    'easter_bunny' |
    'blank_stare' |
    'single_word' |
    'evil_stare' |
    'laugh_evil';

class Dialogue {
    [key: number]: NpcDialog | PlayerDialog | OptionsDialog | TextDialog | DialogFunc | GotoDialog;
}

abstract class DialogBase {
    public readonly id?: string;
}

type DialogFunc = () => void;

class GotoDialog {
    public readonly goto: string;

    public constructor(goto: string) {
        this.goto = goto;
    }
}

abstract class TextDialog extends DialogBase {
    public readonly body: string;

    protected constructor(body: string) {
        super();
        this.body = body;
    }
}

abstract class EntityDialog extends DialogBase {
    public readonly emote: Emote;
    public readonly body: string;

    protected constructor(emote: Emote, body: string) {
        super();
        this.emote = emote;
        this.body = body;
    }
}

class NpcDialog extends EntityDialog {
    public readonly npc: Npc | string;

    public constructor(npc: Npc | string, emote: Emote, body: string) {
        super(emote, body);
        this.npc = npc;
    }
}

class PlayerDialog extends EntityDialog {
    public readonly player: Player;

    public constructor(player: Player, emote: Emote, body: string) {
        super(emote, body);
        this.player = player;
    }
}

class OptionsChoice extends DialogBase {
    public readonly option: string;
    public readonly result: Dialogue;

    public constructor(option: string, result: Dialogue) {
        super();
        this.option = option;
        this.result = result;
    }
}

class OptionsDialog extends DialogBase {
    [key: number]: OptionsChoice;

    public constructor(...options: OptionsChoice[]) {
        super();
        for(let i = 0; i < options.length; i++) {
            this[i] = options[i];
        }
    }
}


const player: Player = null;
let sadEnding = false;
const dialogueSample: Dialogue = [
    {
        npc: 'rs:hans',
        emote: 'generic',
        body: `Welcome to RuneJS!`
    },
    {
        id: 'hans_question',
        npc: 'rs:hans',
        emote: 'generic',
        body: `How do you feel about the project so far?<br>
            Please take a moment to let us know what you think!`
    },
    [
        {
            option: `I love it!`,
            result: [
                {
                    player,
                    emote: 'happy',
                    body: `I'm loving it so far, thank you for asking.`
                },
                {
                    npc: 'rs:hans',
                    emote: 'happy',
                    body: `Happy to hear it, you're welcome!`
                }
            ]
        },
        {
            option: `It's pretty cool.`,
            result: [
                {
                    player,
                    emote: 'generic',
                    body: `It's pretty cool actually.`
                },
                {
                    npc: 'rs:hans',
                    emote: 'happy',
                    body: `I'm glad you think so, thanks for the support!`
                }
            ]
        },
        {
            option: `Not my cup of tea.`,
            result: [
                {
                    player,
                    emote: 'skeptical',
                    body: `Not really my cup of tea, but keep at it.`
                },
                {
                    npc: 'rs:hans',
                    emote: 'generic',
                    body: `Let us know if you have any suggestions or improvements!`
                }
            ]
        },
        {
            option: `It's literally the worst.`,
            result: [
                {
                    player,
                    emote: 'angry',
                    body: `It's literally the worst thing I've ever seen and you disgust me on a personal level.`
                },
                {
                    npc: 'rs:hans',
                    emote: 'sad',
                    body: `I-is that so?... Well I'm... I'm sorry to hear that...`
                },
                () => sadEnding = true
            ]
        },
        {
            option: `Could you repeat that?`,
            result: [
                {
                    player,
                    emote: 'generic',
                    body: `I'm sorry, could you repeat that?`
                },
                {
                    goto: 'hans_question'
                }
            ]
        },
    ]
];
