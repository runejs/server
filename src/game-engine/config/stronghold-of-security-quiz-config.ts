import { loadConfigurationFiles } from '@runejs/core/fs';
import { itemMap } from '@engine/config/index';
import { ItemDetails } from '@engine/config/item-config';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { logger } from '@runejs/core';

/**
 * Stronghold of Security quiz configuration
 */
export interface StrongholdOfSecurityQuiz {
    prefix: string;
    questions: StrongholdOfSecurityQuizQuestion[];
}

/**
 * Stronghold of Security question
 */
export interface StrongholdOfSecurityQuizQuestion {
    questionText: string;
    options: StrongholdQuizOption[];
}

/**
 * Stronghold of Security quiz option
 */
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
        return quiz;
    } catch(error) {
        logger.error('Error parsing stronghold of security quiz data: ' + error);
    }
}
