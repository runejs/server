import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { logger } from '@runejs/core';
import { filestore } from '@engine/game-server';
import { TextWidget } from '@runejs/filestore';
import { wrapText } from '@engine/util/strings';


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
}

export function bookSectionHeaderExists(bookContents: BookContents, bookSectionHeader: string): boolean {
    for (const bookSection of bookContents.bookSections) {
        if (bookSection.header === bookSectionHeader) {
            return true;
        }
    }
    return false;
}

function getPageDataFromPageNumber(bookContents: BookContents, page: number): BookPage {
    const textWidget = filestore.widgetStore.decodeWidget(215) as TextWidget;

    const output = [];
    if (page === 1 && bookContents.showTableOfContents) {
        output.push(``);
        bookContents.bookSections.forEach(section => output.push(section.header));
        return { header: `Chapters`, lines: output };
    }

    const outputPages: BookPage[] = [];
    bookContents.bookSections.forEach(section => {
        const wrappedText = wrapText(section.text, 202, textWidget.fontId);
        let pageLineAmount = 14;

        for (let line = 0; line < wrappedText.length; line += pageLineAmount) {
            if ((pageLineAmount + line) > (wrappedText.length - line)) {
                pageLineAmount = wrappedText.length - line;
            }
            if (line === 0) {
                outputPages.push({ header: section.header, lines: wrappedText.slice(line, line + pageLineAmount) });
            } else {
                outputPages.push({ lines: wrappedText.slice(line, line + pageLineAmount) });
            }
        }
    });

    if(outputPages[page - 2] === undefined) {
        return undefined;
    }
    return outputPages[page - 2];
}

export const pageExists = (book: BookContents, page: number): boolean => {
    return book.bookSections[page - 1] !== undefined;
}
function getBookPagesFromBookContents(bookContents: BookContents): { [key: number]: BookPage } {
    const bookPages: { [key: number]: BookPage } = {};

    let pageNumber = 1;
    let bookPage = getPageDataFromPageNumber(bookContents, pageNumber);
    while (bookPage !== undefined) {
        bookPages[pageNumber] = bookPage;
        pageNumber++;
        bookPage = getPageDataFromPageNumber(bookContents, pageNumber);
    }
    return bookPages;
}


function getSectionLocationsFromBookContents(bookContents: BookContents): { [key: string]: number } {
    const sectionLocations: { [key: string]: number } = {};
    // const bookPages: { [key: number]: BookPage } = {};
    let pageNumber = 1;
    let leftPageData = getPageDataFromPageNumber(bookContents, (2 * pageNumber) - 1);
    let rightPageData = getPageDataFromPageNumber(bookContents, (2 * pageNumber));

    while (leftPageData.lines !== undefined && rightPageData.lines !== undefined) {

        const leftBookPage = (2 * pageNumber) - 1;
        const rightBookPage = (2 * pageNumber) - 1;
        leftPageData = getPageDataFromPageNumber(bookContents, leftBookPage);
        rightPageData = getPageDataFromPageNumber(bookContents, rightBookPage);

        if(leftPageData === undefined) {
            return;
        }
        if(rightPageData === undefined) {
            return;
        }
        if (leftPageData.header) {
            sectionLocations[leftPageData.header] = leftBookPage;
        }
        if (rightPageData.header) {
            sectionLocations[rightPageData.header] = rightBookPage;
        }
        pageNumber += 1;


    }
    return sectionLocations;
}

export function loadStrongholdOfSecurityBookData(path: string): BookData | null {
    try {
        const book = safeLoad(readFileSync(path, 'utf8'),
            { schema: JSON_SCHEMA }) as BookContents;

        if (!book) {
            throw new Error('Unable to read book data!');
        }

        const sectionLocations = getSectionLocationsFromBookContents(book);
        const bookPages = getBookPagesFromBookContents(book);
        return { bookPages: bookPages, bookContents: book, sectionLocations: sectionLocations };
    } catch (error) {
        logger.error('Error parsing book data: ' + error);
    }
}
