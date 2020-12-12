import { QuestCompletion, QuestJournalHandler } from '@server/config/quest-config';


export class Quest {

    public id: string;
    public questTabId: number;
    public name: string;
    public points: number;
    public journalHandler: QuestJournalHandler;
    public onComplete;

    public constructor(options: {
        id: string;
        questTabId: number;
        name: string;
        points: number;
        journalHandler: QuestJournalHandler;
        onComplete: QuestCompletion;
    }) {
        this.id = options.id;
        this.questTabId = options.questTabId;
        this.name = options.name;
        this.points = options.points;
        this.journalHandler = options.journalHandler;
        this.onComplete = options.onComplete;
    }

}
