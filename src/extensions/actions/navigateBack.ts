import { BaseAction } from 'mo/glue/baseAction';
import { KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { type IMoleculeContext, KeybindingWeight } from 'mo/types';

import { getNavigationHistory } from './navigationHistory';

export default class NavigateBackAction extends BaseAction {
    static readonly ID = 'menuBar.item.goBack';

    constructor(molecule: IMoleculeContext) {
        super({
            id: NavigateBackAction.ID,
            label: molecule.locale.localize(NavigateBackAction.ID, 'Go Back'),
            title: molecule.locale.localize(NavigateBackAction.ID, 'Go Back'),
            alias: 'Go Back',
            precondition: undefined,
            f1: true,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.Alt | KeyCode.LeftArrow),
            },
        });
    }

    run() {
        getNavigationHistory()?.goBack();
    }
}
