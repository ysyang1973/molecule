import { BaseAction } from 'mo/glue/baseAction';
import { KeyChord, KeyCode, KeyMod } from 'mo/monaco';
import { type IMoleculeContext, KeybindingWeight } from 'mo/types';

import { getNavigationHistory } from './navigationHistory';

export default class NavigateForwardAction extends BaseAction {
    static readonly ID = 'menuBar.item.goForward';

    constructor(molecule: IMoleculeContext) {
        super({
            id: NavigateForwardAction.ID,
            label: molecule.locale.localize(NavigateForwardAction.ID, 'Go Forward'),
            title: molecule.locale.localize(NavigateForwardAction.ID, 'Go Forward'),
            alias: 'Go Forward',
            precondition: undefined,
            f1: true,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyChord(KeyMod.Alt | KeyCode.RightArrow),
            },
        });
    }

    run() {
        getNavigationHistory()?.goForward();
    }
}
