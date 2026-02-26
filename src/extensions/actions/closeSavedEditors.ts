import { BaseAction } from 'mo/glue/baseAction';
import { KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { IMoleculeContext, KeybindingWeight } from 'mo/types';

export default class CloseSavedEditorsAction extends BaseAction {
    static readonly ID = 'editor.toolbar.closeSaved';
    constructor(private molecule: IMoleculeContext) {
        super({
            id: CloseSavedEditorsAction.ID,
            label: molecule.locale.localize('editor.toolbar.closeSaved', 'Close Saved Editors'),
            title: molecule.locale.localize('editor.toolbar.closeSaved', 'Close Saved Editors'),
            precondition: undefined,
            f1: false,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyCode.KeyU),
            },
        });
    }
    run() {
        const groupId = this.molecule.editor.getCurrent();
        if (groupId !== undefined) {
            this.molecule.editor.closeSaved(groupId);
        }
    }
}
