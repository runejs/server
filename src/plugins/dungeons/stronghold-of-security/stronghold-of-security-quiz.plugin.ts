import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { LandscapeObject } from '@runejs/filestore';
import { logger } from '@runejs/core';

export interface StrongholdOfSecurityQuiz {
    prefix: string;
    questions: StrongholdOfSecurityQuestion[];
}

export interface StrongholdOfSecurityQuestion {
    questionText: string;
    options: StrongholdQuizOption[];
}

export interface StrongholdQuizOption {
    optionText: string;
    passable: boolean;
    doorResponse: string;
}

export function loadStrongholdOfSecurityQuizData(path: string): StrongholdOfSecurityQuiz | null {
    try {
        const quiz = safeLoad(readFileSync(path, 'utf8'),
            { schema: JSON_SCHEMA }) as StrongholdOfSecurityQuiz;

        if(!quiz) {
            throw new Error('Unable to read stronghold of security quiz data.');
        }

        logger.info(`Loaded stronghold of security quiz data! Total questions: ` + quiz.questions.length)
        return quiz;
    } catch(error) {
        logger.error('Error parsing stronghold of security quiz data: ' + error);
    }
}
export default {
    pluginId: 'rs:stronghold_of_security_quiz',
};
