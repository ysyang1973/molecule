import { debounce } from 'lodash-es';
import { SETTINGS_STORE_KEY } from 'mo/const';
import type { IExtension } from 'mo/types';
import { setValue } from 'mo/utils/storage';

export const ExtendsSettings: IExtension = {
    id: 'ExtendsSettings',
    name: 'Extend The Default Settings',
    activate: function (molecule): void {
        const updateSettings = debounce((value) => {
            const settings: Record<string, any> = JSON.parse(value);
            molecule.settings.update(settings);
            const { locale, colorTheme, ...editorSettings } = settings;
            setValue(SETTINGS_STORE_KEY, JSON.stringify(editorSettings));
        }, 2000);

        molecule.settings.onChange((value) => {
            try {
                updateSettings(value);
            } catch (error) {}
        });
    },
};
