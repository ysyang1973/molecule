import { BaseAction } from 'mo/glue/baseAction';
import { EditorEvent } from 'mo/models/editor';
import { KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { IMoleculeContext, KeybindingWeight } from 'mo/types';

export default class CloseAllEditorsAction extends BaseAction {
    static readonly ID = 'editor.toolbar.closeAll';
    constructor(private molecule: IMoleculeContext) {
        super({
            id: CloseAllEditorsAction.ID,
            label: molecule.locale.localize('editor.contextMenu.closeAll', 'Close All Editors'),
            title: molecule.locale.localize('editor.contextMenu.closeAll', 'Close All Editors'),
            precondition: undefined,
            f1: false,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyCode.KeyW),
            },
        });
    }
    run() {
        const groupId = this.molecule.editor.getCurrent();
        if (groupId !== undefined) {
            this.molecule.editor.emit(EditorEvent.onCloseAll, groupId);
        }
    }
}
