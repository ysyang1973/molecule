import { BaseAction } from 'mo/glue/baseAction';
import { EditorEvent } from 'mo/models/editor';
import { KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { IMoleculeContext, KeybindingWeight } from 'mo/types';

export default class MaximizeEditorGroupAction extends BaseAction {
    static readonly ID = 'editor.toolbar.maximizeGroup';
    constructor(private molecule: IMoleculeContext) {
        super({
            id: MaximizeEditorGroupAction.ID,
            label: molecule.locale.localize('editor.toolbar.maximizeGroup', 'Maximize Editor Group'),
            title: molecule.locale.localize('editor.toolbar.maximizeGroup', 'Maximize Editor Group'),
            precondition: undefined,
            f1: false,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyCode.KeyM),
            },
        });
    }
    run() {
        const groupId = this.molecule.editor.getCurrent();
        if (groupId === undefined) return;
        // Trigger toolbar click with the maximize group item
        this.molecule.editor.emit(EditorEvent.onToolbarClick, { id: MaximizeEditorGroupAction.ID }, groupId);
    }
}
