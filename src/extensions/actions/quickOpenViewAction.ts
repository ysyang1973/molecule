import { BaseAction } from 'mo/glue/baseAction';
import {
    CATEGORIES,
    IQuickInputService,
    type IQuickPickItem,
    type QuickPickInput,
    type ServicesAccessor,
} from 'mo/monaco';
import { type IMoleculeContext } from 'mo/types';

type ViewArea = 'sidebar' | 'panel' | 'auxiliaryBar';

interface IViewPickItem extends IQuickPickItem {
    area: ViewArea;
}

export default class QuickOpenViewAction extends BaseAction {
    static readonly ID = 'menuBar.item.openView';

    constructor(private ctx: IMoleculeContext) {
        super({
            id: QuickOpenViewAction.ID,
            label: ctx.locale.localize('menuBar.item.openView', 'Open View'),
            title: ctx.locale.localize('menuBar.item.openView', 'Open View'),
            category: CATEGORIES.View,
            alias: 'Open View',
            precondition: undefined,
            f1: true,
        });
    }

    run(accessor: ServicesAccessor): Promise<void> {
        const quickInputService = accessor.get(IQuickInputService);
        const picks = this.collectViews();

        if (picks.length === 0) return Promise.resolve();

        return new Promise((resolve) => {
            const quickPick = quickInputService.createQuickPick<IViewPickItem>();
            quickPick.items = picks;
            quickPick.placeholder = this.ctx.locale.localize(
                'openView.placeholder',
                'Select a view to open'
            );
            quickPick.canSelectMany = false;

            quickPick.onDidAccept(() => {
                const selected = quickPick.activeItems[0] as IViewPickItem | undefined;
                if (selected) {
                    this.activateView(selected.id as string, selected.area);
                }
                quickPick.hide();
                resolve();
            });

            quickPick.onDidHide(() => {
                resolve();
            });

            quickPick.show();
        });
    }

    private collectViews(): QuickPickInput<IViewPickItem>[] {
        const picks: QuickPickInput<IViewPickItem>[] = [];

        // Sidebar views (activityBar top items)
        const activityBarItems = this.ctx.activityBar
            .getState()
            .data.filter((item) => item.alignment === 'top' && !item.hidden);

        if (activityBarItems.length > 0) {
            picks.push({ type: 'separator', label: 'Side Bar' });
            for (const item of activityBarItems) {
                picks.push({
                    id: String(item.id),
                    label: String(item.name || item.id),
                    type: 'item',
                    area: 'sidebar',
                });
            }
        }

        // Panel views
        const panelItems = this.ctx.panel.getAll().filter((item) => !item.hidden);

        if (panelItems.length > 0) {
            picks.push({ type: 'separator', label: 'Panel' });
            for (const item of panelItems) {
                picks.push({
                    id: String(item.id),
                    label: String(item.name || item.id),
                    type: 'item',
                    area: 'panel',
                });
            }
        }

        // AuxiliaryBar views
        const auxItems = this.ctx.auxiliaryBar.getState().data.filter((item) => !item.hidden);

        if (auxItems.length > 0) {
            picks.push({ type: 'separator', label: 'Auxiliary Bar' });
            for (const item of auxItems) {
                picks.push({
                    id: String(item.id),
                    label: String(item.name || item.id),
                    type: 'item',
                    area: 'auxiliaryBar',
                });
            }
        }

        return picks;
    }

    private activateView(id: string, area: ViewArea) {
        switch (area) {
            case 'sidebar':
                this.ctx.activityBar.setCurrent(id);
                this.ctx.sidebar.setCurrent(id);
                this.ctx.layout.setSidebar(true);
                break;
            case 'panel':
                this.ctx.panel.setCurrent(id);
                this.ctx.layout.setPanel(true);
                break;
            case 'auxiliaryBar':
                this.ctx.auxiliaryBar.setCurrent(id);
                this.ctx.layout.setAuxiliaryBar(true);
                break;
        }
    }
}
