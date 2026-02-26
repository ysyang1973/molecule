import { BaseAction } from 'mo/glue/baseAction';
import { CATEGORIES, KeyCode, KeyMod } from 'mo/monaco';
import { IMoleculeContext, KeybindingWeight } from 'mo/types';
import { randomId } from 'mo/utils';

export default class NewFileAction extends BaseAction {
    static readonly ID = 'menuBar.item.createFile';
    private static fileCounter = 0;

    constructor(private molecule: IMoleculeContext) {
        super({
            id: NewFileAction.ID,
            label: molecule.locale.localize('menuBar.item.createFile', 'New File'),
            title: molecule.locale.localize('menuBar.item.createFile', 'New File'),
            category: CATEGORIES.Developer,
            alias: 'New File',
            precondition: undefined,
            f1: true,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyN,
            },
        });
    }

    private getNextFileName(): string {
        const existingNames = new Set<string>();
        for (const group of this.molecule.editor.getGroups()) {
            for (const tab of group.data) {
                if (typeof tab.name === 'string') {
                    existingNames.add(tab.name);
                }
            }
        }

        let counter = ++NewFileAction.fileCounter;
        while (existingNames.has(`Untitled-${counter}`)) {
            counter = ++NewFileAction.fileCounter;
        }
        return `Untitled-${counter}`;
    }

    run() {
        const tabId = `new_editor_${randomId()}`;
        this.molecule.editor.open({
            id: tabId,
            name: this.getNextFileName(),
            icon: 'file',
            value: '',
            language: 'sql',
        });
    }
}
