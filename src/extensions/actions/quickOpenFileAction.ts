import { BaseAction } from 'mo/glue/baseAction';
import { IQuickInputService, KeyCode, KeyMod, type IQuickPickItem, type QuickPickInput, type ServicesAccessor } from 'mo/monaco';
import { FolderTreeEvent } from 'mo/models/folderTree';
import { FileTypes, type IMoleculeContext, type IEditorTab, KeybindingWeight, type UniqueId } from 'mo/types';
import type { TreeNodeModel } from 'mo/utils/tree';

type PickSource = 'openTab' | 'folderTree';

interface IFilePickItem extends IQuickPickItem {
    source: PickSource;
    groupId?: UniqueId;
    treeNode?: TreeNodeModel<any>;
}

export default class QuickOpenFileAction extends BaseAction {
    static readonly ID = 'workbench.action.quickOpenFile';

    constructor(private ctx: IMoleculeContext) {
        super({
            id: QuickOpenFileAction.ID,
            label: ctx.locale.localize(QuickOpenFileAction.ID, 'Go to File'),
            title: ctx.locale.localize(QuickOpenFileAction.ID, 'Go to File'),
            alias: 'Go to File',
            precondition: undefined,
            f1: true,
            keybinding: {
                when: undefined,
                weight: KeybindingWeight.WorkbenchContrib,
                primary: KeyMod.CtrlCmd | KeyCode.KeyP,
            },
        });
    }

    run(accessor: ServicesAccessor): Promise<void> {
        const quickInputService = accessor.get(IQuickInputService);
        const allPicks = this.collectFiles();

        if (allPicks.length === 0) return Promise.resolve();

        return new Promise((resolve) => {
            const quickPick = quickInputService.createQuickPick<IFilePickItem>();
            quickPick.items = allPicks;
            quickPick.placeholder = this.ctx.locale.localize(
                'quickOpenFile.placeholder',
                'Search files by name'
            );
            quickPick.canSelectMany = false;

            let selectedItem: IFilePickItem | undefined;

            quickPick.onDidChangeValue((value: string) => {
                if (!value) {
                    quickPick.items = allPicks;
                    return;
                }
                const lower = value.toLowerCase();
                quickPick.items = allPicks.filter((pick) => {
                    if ('type' in pick && pick.type === 'separator') return false;
                    const item = pick as IFilePickItem;
                    const labelMatch = item.label.toLowerCase().includes(lower);
                    const descMatch = item.description?.toLowerCase().includes(lower);
                    return labelMatch || descMatch;
                });
            });

            quickPick.onDidAccept(() => {
                selectedItem = quickPick.activeItems[0] as IFilePickItem | undefined;
                quickPick.hide();
            });

            quickPick.onDidHide(() => {
                quickPick.dispose();
                if (selectedItem) {
                    this.openFile(selectedItem);
                }
                resolve();
            });

            quickPick.show();
        });
    }

    private collectFiles(): QuickPickInput<IFilePickItem>[] {
        const picks: QuickPickInput<IFilePickItem>[] = [];
        const openTabIds = new Set<UniqueId>();

        // Collect open tabs
        const groups = this.ctx.editor.getGroups();
        const openTabPicks: IFilePickItem[] = [];
        for (const group of groups) {
            for (const tab of group.data as IEditorTab<any>[]) {
                if (openTabIds.has(tab.id)) continue;
                openTabIds.add(tab.id);
                openTabPicks.push({
                    id: String(tab.id),
                    label: String(tab.name || tab.id),
                    description: String(tab.id),
                    type: 'item',
                    source: 'openTab',
                    groupId: group.id,
                });
            }
        }

        if (openTabPicks.length > 0) {
            picks.push({
                type: 'separator',
                label: this.ctx.locale.localize('quickOpenFile.openEditors', 'Open Editors'),
            });
            picks.push(...openTabPicks);
        }

        // Collect folder tree files
        const treeData = this.ctx.folderTree.getState().data;
        const treePicks: IFilePickItem[] = [];
        this.traverseTree(treeData, openTabIds, treePicks);

        if (treePicks.length > 0) {
            picks.push({
                type: 'separator',
                label: this.ctx.locale.localize('quickOpenFile.workspaceFiles', 'Workspace Files'),
            });
            picks.push(...treePicks);
        }

        return picks;
    }

    private traverseTree(
        nodes: TreeNodeModel<any>[],
        openTabIds: Set<UniqueId>,
        result: IFilePickItem[]
    ) {
        for (const node of nodes) {
            if (node.fileType === FileTypes.File && !openTabIds.has(node.id)) {
                const path = String(node.id);
                const lastSep = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
                const dir = lastSep > 0 ? path.substring(0, lastSep) : '';

                result.push({
                    id: String(node.id),
                    label: node.name,
                    description: dir,
                    type: 'item',
                    source: 'folderTree',
                    treeNode: node,
                });
            }
            if (node.children) {
                this.traverseTree(node.children, openTabIds, result);
            }
        }
    }

    private openFile(item: IFilePickItem) {
        if (item.source === 'openTab' && item.groupId !== undefined) {
            this.ctx.editor.setCurrent(item.id as string, item.groupId);
        } else if (item.source === 'folderTree' && item.treeNode) {
            // Emit the same event as clicking a file in the folder tree,
            // so the app-level onSelect handler opens the file.
            this.ctx.folderTree.emit(FolderTreeEvent.onSelect, item.treeNode);
        }
    }
}
