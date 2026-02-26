import type { IMoleculeContext, UniqueId } from 'mo/types';

interface INavigationEntry {
    tabId: UniqueId;
    groupId: UniqueId;
    lineNumber: number;
    column: number;
}

const MAX_HISTORY = 50;
const SIGNIFICANT_LINE_DIFF = 5;

let instance: NavigationHistory | undefined;

export function initNavigationHistory(molecule: IMoleculeContext) {
    instance = new NavigationHistory(molecule);
}

export function getNavigationHistory(): NavigationHistory | undefined {
    return instance;
}

class NavigationHistory {
    private backStack: INavigationEntry[] = [];
    private forwardStack: INavigationEntry[] = [];
    private lastEditEntry: INavigationEntry | undefined;
    private current: INavigationEntry | undefined;
    private navigating = false;

    constructor(private molecule: IMoleculeContext) {
        this.molecule.editor.onCursorSelection((instance, ev) => {
            if (this.navigating) return;
            const group = this.molecule.editor.getCurrentGroup();
            if (!group?.activeTab) return;

            const pos = instance.getPosition();
            if (!pos) return;

            const entry: INavigationEntry = {
                tabId: group.activeTab,
                groupId: group.id,
                lineNumber: pos.lineNumber,
                column: pos.column,
            };

            if (this.current && this.isSignificantMove(this.current, entry)) {
                this.backStack.push(this.current);
                if (this.backStack.length > MAX_HISTORY) {
                    this.backStack.shift();
                }
                this.forwardStack = [];
            }

            this.current = entry;
        });

        this.molecule.editor.onChange(() => {
            const group = this.molecule.editor.getCurrentGroup();
            if (!group?.activeTab) return;

            const pos = group.editorInstance?.getPosition();
            if (!pos) return;

            this.lastEditEntry = {
                tabId: group.activeTab,
                groupId: group.id,
                lineNumber: pos.lineNumber,
                column: pos.column,
            };
        });
    }

    private isSignificantMove(a: INavigationEntry, b: INavigationEntry): boolean {
        if (a.tabId !== b.tabId) return true;
        return Math.abs(a.lineNumber - b.lineNumber) >= SIGNIFICANT_LINE_DIFF;
    }

    private goToEntry(entry: INavigationEntry) {
        this.navigating = true;
        try {
            this.molecule.editor.setCurrent(entry.tabId, entry.groupId);
            const group = this.molecule.editor.getGroup(entry.groupId);
            const editor = group?.editorInstance;
            if (editor) {
                editor.setPosition({ lineNumber: entry.lineNumber, column: entry.column });
                editor.revealLineInCenter(entry.lineNumber);
                editor.focus();
            }
        } finally {
            this.navigating = false;
        }
    }

    goBack() {
        const entry = this.backStack.pop();
        if (!entry) return;

        if (this.current) {
            this.forwardStack.push(this.current);
        }
        this.current = entry;
        this.goToEntry(entry);
    }

    goForward() {
        const entry = this.forwardStack.pop();
        if (!entry) return;

        if (this.current) {
            this.backStack.push(this.current);
        }
        this.current = entry;
        this.goToEntry(entry);
    }

    goToLastEdit() {
        if (!this.lastEditEntry) return;

        if (this.current) {
            this.backStack.push(this.current);
            if (this.backStack.length > MAX_HISTORY) {
                this.backStack.shift();
            }
            this.forwardStack = [];
        }
        this.current = { ...this.lastEditEntry };
        this.goToEntry(this.lastEditEntry);
    }
}
