import { BaseAction } from 'mo/glue/baseAction';
import { KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { type IMoleculeContext, KeybindingWeight } from 'mo/types';

import { getNavigationHistory } from './navigationHistory';

export default class NavigateToLastEditAction extends BaseAction {
    static readonly ID = 'menuBar.item.goToLastEdit';

    constructor(molecule: IMoleculeContext) {
        super({
            id: NavigateToLastEditAction.ID,
            label: molecule.locale.localize(NavigateToLastEditAction.ID, 'Go to Last Edit Location'),
            title: molecule.locale.localize(NavigateToLastEditAction.ID, 'Go to Last Edit Location'),
            alias: 'Go to Last Edit Location',
            precondition: undefined,
            f1: true,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.Backspace),
            },
        });
    }

    run() {
        getNavigationHistory()?.goToLastEdit();
    }
}
