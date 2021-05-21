import { ItemInteractionAction, itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { strongholdOfSecurityBookData, widgets } from '@engine/config';
import { TaskExecutor } from '@engine/world/action';
import { widgetInteractionActionHandler } from '@engine/world/action/widget-interaction.action';
import { Player } from '@engine/world/actor/player/player';
import { BookData, bookSectionHeaderExists, BookSections, pageExists } from '@engine/config/sectioned-book-config';
import { Widget, WidgetClosedEvent } from '@engine/world/actor/player/interface-state';

/**
 * Open the book interface and read the specified book.
 *
 * @param details Information about the action.
 */
export const activate: itemInteractionActionHandler = (details) => {
    details.player.playAnimation(1350);
    openBook(details.player, strongholdOfSecurityBookData, 1);
    details.player.metadata['readingBook'] = details.player.interfaceState.closed.subscribe((whatClosed: WidgetClosedEvent) => {
        if (whatClosed && whatClosed.widget && whatClosed.widget.widgetId === widgets.book) {
            details.player.stopGraphics();
            details.player.stopAnimation();
        }
    });
};

/**
 * Given book information, and a specified header from that book, return the page number that it's on.
 * @param bookData The book with the section header you want to find.
 * @param bookSectionHeader The name of the section to find the page of.
 */
function getPageNumberForBookSection(bookData: BookData, bookSectionHeader: string): number {
    let pageNumber = 1;
    let leftPageNumber = (2 * pageNumber) - 1;
    let rightPageNumber = 2 * pageNumber;

    let leftPageData = bookData.bookPages[leftPageNumber];
    let rightPageData = bookData.bookPages[rightPageNumber];
    while (leftPageData.lines !== undefined && rightPageData.lines !== undefined) {
        if (leftPageData.header === bookSectionHeader) {
            return pageNumber;
        } else if (rightPageData.header === bookSectionHeader) {
            return pageNumber;
        }
        pageNumber += 1;
        leftPageNumber = (2 * pageNumber) - 1;
        rightPageNumber = (2 * pageNumber);
        leftPageData = bookData.bookPages[leftPageNumber];
        rightPageData = bookData.bookPages[rightPageNumber];
    }
    return 1;
}

/**
 * Toggles the visibility of clickable text widgets on the left page, given a range of line numbers.
 *
 * This is used for the table of contents, allowing only selectable sections to be clickable.
 *
 * @param player The player who's book widget will be modified.
 * @param widget The widget being modified.
 * @param hidden Whether to hide or unhide the particular clickable widget line
 * @param fromLine The line number to begin with.
 * @param toLine The line number to end on.
 */
function toggleVisibilityOfLeftPageClickableWidgets(player: Player, widget: Widget, hidden: boolean, fromLine?: number, toLine?: number) {
    if (toLine === undefined) {
        toLine = 15;
    }

    if (fromLine === undefined) {
        fromLine = 0;
    }
    for (let i = fromLine; i <= toLine; i++) {
        player.modifyWidget(widget.widgetId, {
            childId: 100 + (2 * i),
            hidden: hidden,
            text: ``
        });
    }
}

/**
 * Clears the book interface to prepare it for new data.
 * @param player The player who's book interface will be cleared.
 * @param widget The book widget being modified.
 */
function clearBookInterface(player: Player, widget: Widget) {
    let clickable = true;
    for (let interfaceTextType = 0; interfaceTextType < 2; interfaceTextType++) {
        for (const pageSide of Object.values(PageSide)) {
            for (let lineNumber = 0; lineNumber <= widgets.bookChildren.totalPageLineAmount; lineNumber++) {
                const childId = getLineChildId(pageSide as PageSide, clickable, lineNumber);
                player.modifyWidget(widget.widgetId, {
                    childId: childId,
                    hidden: true,
                    text: ``
                });
            }
        }
        clickable = !clickable;
    }

    //Hide the right page turn button
    player.modifyWidget(widget.widgetId, {
        childId: widgets.bookChildren.rightPage.pageTurnButton,
        hidden: true
    });

    //Hide the left page turn button
    player.modifyWidget(widget.widgetId, {
        childId: widgets.bookChildren.rightPage.pageTurnButton,
        hidden: true
    });
}

/**
 * Creates the book widget from the specified Book object, and populates it according to what page you're on.
 * @param player The player who will view the book.
 * @param bookData The book the player will view.
 * @param page The page-set that will be viewed. (This number accounts for two pages at a time. Page 1 and 2 would be 1.
 * Pages 3 and 4 would be 2, etc.)
 */
export function openBook(player: Player, bookData: BookData, page: number): void {
    const widget = player.interfaceState.openWidget(widgets.book, {
        slot: 'screen',
        fakeWidget: 3100003,
        metadata: {
            page: page
        }
    });

    clearBookInterface(player, widget);

    toggleVisibilityOfLeftPageClickableWidgets(player, widget, true);

    const leftPageNumber = (2 * page) - 1;
    const leftPage = bookData.bookPages[leftPageNumber];
    if (!leftPage) {
        return;
    }

    addBookTextToWidget(player, widget, bookData, leftPageNumber, PageSide.LEFT_SIDE);

    const rightPageNumber = (2 * page);
    const rightPage = bookData.bookPages[rightPageNumber];
    if (rightPage) {
        addBookTextToWidget(player, widget, bookData, rightPageNumber, PageSide.RIGHT_SIDE);
    }

    addPageNumberToBookWidget(player, widget);
}

/**
 * Modifies the specified book widget to add page numbers according to the widget's metadata.
 * @param player The player who's widget is being modified.
 * @param widget The widget to modify with new page numbers.
 */
function addPageNumberToBookWidget(player: Player, widget: Widget) {
    player.modifyWidget(widget.widgetId, {
        childId: widgets.bookChildren.rightPage.pageNumber,
        text: `Page ${widget.metadata.page * 2}`
    });
    player.modifyWidget(widget.widgetId, {
        childId: widgets.bookChildren.leftPage.pageNumber,
        text: `Page ${widget.metadata.page * 2 - 1}`
    });
}


/**
 * Given a BookData object, and information about where the book data should be applied to, add the appropriate book text
 * to the specified book widget.
 * @param player The player who's widget is being modified.
 * @param widget The widget to modify with text from the book.
 * @param book The book to get the text from.
 * @param pageNumber The page to apply the text onto.
 * @param side Whether or not the page is on the left or right side.
 */
function addBookTextToWidget(player: Player, widget: Widget, book: BookData, pageNumber: number, side: PageSide) {
    const page = book.bookPages[pageNumber];
    const clickable = (book.bookContents.showTableOfContents && pageNumber === 1);
    const totalPageLines = widgets.bookChildren.totalPageLineAmount;

    const hideLeftPageTurn: boolean = (pageNumber === 1 || pageNumber === 2);
    player.modifyWidget(widget.widgetId, {
        childId: 95,
        hidden: hideLeftPageTurn
    });

    player.modifyWidget(widget.widgetId, {
        childId: 97,
        hidden: (pageNumber === Object.keys(book.bookPages).length)
    });
    let childId;
    let lineText;

    for (let lineNumber = 0; lineNumber <= totalPageLines; lineNumber++) {
        childId = getLineChildId(side, clickable, lineNumber);

        if (page.header && lineNumber === 0) {
            childId = getLineChildId(side, false, lineNumber);
            lineText = `<col=000080>` + page.header;
        } else if (page.header && lineNumber !== 0) {
            lineText = page.lines[lineNumber - 1];
        } else if (!page.header) {
            lineText = page.lines[lineNumber];
        }
        player.modifyWidget(widget.widgetId, {
            childId: childId,
            text: lineText
        });
    }

    if (side === PageSide.LEFT_SIDE) {
        if (pageNumber === 1 && book.bookContents.showTableOfContents) {
            const bookSections = book.bookContents.bookSections.length + 1;
            toggleVisibilityOfLeftPageClickableWidgets(player, widget, false, 2, bookSections);
        }
    }
}

/**
 * Given which side the page is on, and whether or not the line should be clickable, return widget information about the
 * page.
 * @param pageSide Whether the page is on the left or right side of the book.
 * @param clickable Whether or not the line should be clickable.
 */
function getWidgetInformationForPage(pageSide: PageSide, clickable: boolean) {
    let lineType;

    switch (pageSide) {
        case PageSide.RIGHT_SIDE:
            lineType = (clickable ? widgets.bookChildren.rightPage.clickableLines : widgets.bookChildren.rightPage.nonClickableLines)
            break;

        case PageSide.LEFT_SIDE:
            lineType = (clickable ? widgets.bookChildren.leftPage.clickableLines : widgets.bookChildren.leftPage.nonClickableLines)
            break;
    }
    return { firstLineId: lineType.firstLineId, incrementAmount: lineType.incrementAmount };
}

/**
 * Given which side the page is on, whether or not the line should be clickable, and the line number, return the
 * appropriate child ID for the book interface.
 *
 * @param pageSide Whether the page is on the left or right side of the book.
 * @param clickable Whether or not the line should be clickable.
 * @param lineNumber Which particular line you want to get the child ID of.
 */
function getLineChildId(pageSide: PageSide, clickable: boolean, lineNumber: number): number {
    const pageWidgetData: { firstLineId: number, incrementAmount: number } = getWidgetInformationForPage(pageSide, clickable);

    return pageWidgetData.firstLineId + (lineNumber * pageWidgetData.incrementAmount);
}

/**
 * An enum that represents either the left, or the right page in a book.
 */
enum PageSide {
    LEFT_SIDE = 'LEFT',
    RIGHT_SIDE = 'RIGHT'
}

/**
 * Handles interactions with the book interface itself, such as using the left and right buttons
 * @param details
 */
export const strongholdBookInteract: widgetInteractionActionHandler = (details) => {
    const playerWidget = details.player.interfaceState.findWidget(27);

    if (!playerWidget || !playerWidget.metadata.page || playerWidget.fakeWidget !== 3100003) {
        return;
    }
    const bookData: BookData = strongholdOfSecurityBookData;


    let pageNumber = playerWidget.metadata.page;
    switch (details.childId) {
        case 160:
            openBook(details.player, bookData, 1);
            return;
        case 94:
            pageNumber--;
            if (pageExists(bookData.bookContents, pageNumber)) {
                details.player.playAnimation(3141);
                openBook(details.player, bookData, pageNumber);
            } else {
                openBook(details.player, bookData, pageNumber + 1);
            }
            return;
        case 96:
            pageNumber++;
            if (pageExists(bookData.bookContents, pageNumber)) {
                details.player.playAnimation(3140);
                openBook(details.player, bookData, pageNumber);
            } else {
                openBook(details.player, bookData, pageNumber - 1);
            }
            return;
    }


    let selectedIndex = undefined;
    if (details.childId >= 101 && details.childId <= 129) {
        selectedIndex = (details.childId - 99) / 2 - 1;
    }
    if (details.childId >= 131 && details.childId <= 159) {
        selectedIndex = ((details.childId - 129) / 2 - 1) + 15;
    }
    if (selectedIndex !== undefined) {
        const bookSection: BookSections = bookData.bookContents.bookSections[selectedIndex - 2];

        if (bookSectionHeaderExists(bookData.bookContents, bookSection.header)) {
            const sectionName = bookSection.header;
            const selectedPage = getPageNumberForBookSection(bookData, sectionName);
            openBook(details.player, bookData, selectedPage);
        } else {
            openBook(details.player, bookData, pageNumber);
        }
    }
}


const canActivate = (task: TaskExecutor<ItemInteractionAction>, taskIteration: number): boolean => {
    return true;
}

const onComplete = (task: TaskExecutor<ItemInteractionAction>): void => {
    task.actor.stopAnimation();
    task.actor.stopGraphics();
}

export default {
    pluginId: 'rs:stronghold_of_security_book',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            options: 'read',
            handler: activate,
            cancelOtherActions: true
        },
        {
            type: 'widget_interaction',
            widgetId: 3100003,
            handler: strongholdBookInteract
        }
    ]
};
