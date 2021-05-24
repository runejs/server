import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { logger } from '@runejs/core';
import { filestore } from '@engine/game-server';
import { TextWidget } from '@runejs/filestore';
import { wrapText } from '@engine/util/strings';
import { loadConfigurationFiles } from '@runejs/core/fs';
import * as fs from 'fs';


export interface BookData {
    sectionLocations: { [key: string]: number };
    bookPages: { [key: number]: BookPage };
    bookContents: BookContents;
}

/**
 * The contents of a Book, represented by an array of BookSections, an associated item ID, and book title.
 */
export interface BookContents {
    bookId: number;
    bookTitle: string;
    showTableOfContents: boolean;
    bookSections: BookSections[];
}

/**
 * A book section that contains a title, and text.
 */
export interface BookSections {
    header: string;
    text: string;
}

/**
 * A BookPage represents a single page of a book.
 */
export interface BookPage {
    header?: string;
    lines: string[];
    pageNumber: number;
}

/**
 * Returns a boolean for whether or not the specified section header exists in the book.
 * @param bookContents The book to find the header in.
 * @param bookSectionHeader The header to search for.
 */
export function bookSectionHeaderExists(bookContents: BookContents, bookSectionHeader: string): boolean {
    return bookContents.bookSections.some(section => section.header === bookSectionHeader);
}

function getBookDataForBookContents(bookContents: BookContents): BookData {
    const textWidget = filestore.widgetStore.decodeWidget(215) as TextWidget;

    const output = [];
    let pageNumber = 1;

    const bookPages: { [key: number]: BookPage } = {};
    if (bookContents.showTableOfContents) {
        output.push(``);
        bookContents.bookSections.forEach(section => output.push(section.header));
        bookPages[pageNumber] = { header: `Chapters`, lines: output, pageNumber: pageNumber };
        pageNumber++;
    }

    const sectionLocations: { [key: string]: number } = {};

    bookContents.bookSections.forEach(section => {
        const wrappedText = wrapText(section.text, 202, textWidget.fontId);
        const pageLineAmount = 14;

        let pageContainsHeader = true;
        while (wrappedText.length) {
            const pageLines = wrappedText.splice(0, pageLineAmount);
            bookPages[pageNumber] = {
                header: (pageContainsHeader ? section.header : undefined),
                lines: pageLines,
                pageNumber: pageNumber
            };
            if (pageContainsHeader) {
                sectionLocations[section.header] = pageNumber;
            }
            pageContainsHeader = false;
            pageNumber++;
        }
    });

    logger.info(`Book: ` + bookContents.bookTitle + ` has ` + Object.keys(sectionLocations).length + ` sections.`)
    return { sectionLocations: sectionLocations, bookPages: bookPages, bookContents: bookContents };
}

/**
 * An enum that represents either the left, or the right page in a book.
 */
export enum PageSide {
    LEFT_SIDE = 'LEFT',
    RIGHT_SIDE = 'RIGHT'
}

export const pageExists = (book: BookData, page: number): boolean => {
    return (book.bookPages[page] !== undefined);
}

export function loadBookData(path: string): BookData[] | null {
    const books: BookData[] = [];

    fs.readdir(path, function(error, filenames) {
        filenames.forEach(function(filename) {
            const bookContents = safeLoad(readFileSync(path + filename, 'utf8'),
                { schema: JSON_SCHEMA }) as BookContents;
            const bookData = getBookDataForBookContents(bookContents);
            books.push(bookData);
        });
    });
    return books;
}


