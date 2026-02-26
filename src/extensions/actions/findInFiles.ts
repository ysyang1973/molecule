import { BaseAction } from 'mo/glue/baseAction';
import { CATEGORIES, KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { IMoleculeContext, KeybindingWeight } from 'mo/types';

export default class FindInFilesAction extends BaseAction {
    static readonly ID = 'menuBar.item.findInFiles';

    constructor(private molecule: IMoleculeContext) {
        super({
            id: FindInFilesAction.ID,
            label: molecule.locale.localize('menuBar.item.findInFiles', 'Find in Files'),
            title: molecule.locale.localize('menuBar.item.findInFiles', 'Find in Files'),
            category: CATEGORIES.Developer,
            alias: 'Find in Files',
            precondition: undefined,
            f1: true,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF),
            },
        });
    }
    run() {
        const { SIDEBAR_ITEM_SEARCH } = this.molecule.builtin.getConstants();
        this.molecule.activityBar.setCurrent(SIDEBAR_ITEM_SEARCH);
        this.molecule.sidebar.setCurrent(SIDEBAR_ITEM_SEARCH);
    }
}
