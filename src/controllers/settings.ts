import { SETTINGS_STORE_KEY } from 'mo/const';
import { BaseController } from 'mo/glue';
import { SettingsService } from 'mo/services/setting';
import { flatObject } from 'mo/utils';
import { getValue } from 'mo/utils/storage';
import { inject, injectable } from 'tsyringe';

export interface ISettingsController extends BaseController {}

@injectable()
export class SettingsController extends BaseController implements ISettingsController {
    constructor(@inject('settings') private settings: SettingsService) {
        super();
        this.initView();
    }

    private initView() {
        import('../const/options').then((options) => {
            const defaults = flatObject({ editor: options.default });
            const stored = getValue(SETTINGS_STORE_KEY);
            if (stored) {
                try {
                    const saved = JSON.parse(stored);
                    Object.assign(defaults, saved);
                } catch {}
            }
            this.settings.update(defaults);
        });
    }
}
