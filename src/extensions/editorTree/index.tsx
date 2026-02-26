import { IExtension } from 'mo/types';
import { concatMenu } from 'mo/utils';
import { showConfirmDialog } from 'mo/utils/confirmDialog';

export const ExtendsEditorTree: IExtension = {
    id: 'ExtendsEditorTree',
    name: 'Extend The Default Editor Tree',
    activate: function (molecule): void {
        molecule.editorTree.onSelect((tabId, groupId) => {
            molecule.editor.setCurrent(tabId, groupId);
        });

        molecule.editorTree.onClose(async (tabId, groupId) => {
            const tab = molecule.editor.getTab(tabId, groupId);
            if (tab?.modified) {
                const name = typeof tab.name === 'string' ? tab.name : String(tab.name ?? '');
                const result = await showConfirmDialog({
                    message: molecule.locale.localize(
                        'editor.closeConfirm.single',
                        `'${name}' has unsaved changes. Do you want to save the changes?`,
                        name
                    ),
                    saveLabel: molecule.locale.localize('editor.closeConfirm.save', 'Save'),
                    dontSaveLabel: molecule.locale.localize('editor.closeConfirm.dontSave', "Don't Save"),
                    cancelLabel: molecule.locale.localize('editor.closeConfirm.cancel', 'Cancel'),
                });
                if (result === 'cancel') return;
                if (result === 'save') {
                    molecule.editor.saveTabs([tab.id], groupId);
                }
            }
            molecule.editor.closeTab(tabId, groupId);
        });

        molecule.editorTree.onGroupClick((groupId) => {
            const firstTab = molecule.editor.getGroup(groupId)?.data.at(0);
            if (firstTab) {
                molecule.editor.setCurrent(firstTab.id, groupId);
            }
        });

        molecule.editorTree.onToolbarClick((item, groupId) => {
            const { EDITORTREE_TOOLBAR_CLOSE_GROUP, EDITORTREE_TOOLBAR_SAVE_GROUP } =
                molecule.builtin.getState().constants;

            switch (item.id) {
                case EDITORTREE_TOOLBAR_CLOSE_GROUP: {
                    molecule.editor.closeAll(groupId);
                    break;
                }
                case EDITORTREE_TOOLBAR_SAVE_GROUP: {
                    const unsaved =
                        molecule.editor.getGroup(groupId)?.data?.filter((i) => i.modified) ||
                        [];
                    molecule.editor.saveTabs(
                        unsaved.map((tab) => tab.id),
                        groupId
                    );
                    break;
                }

                default:
                    break;
            }
        });

        molecule.editorTree.onContextMenu((pos, group, tab) => {
            const { EDITOR_TREE_CONTEXTMENU = [], EDITOR_CONTEXTMENU } =
                molecule.builtin.getModules();
            const toolbar = molecule.editorTree.getState().toolbar || [];
            const contextMenu = !tab
                ? concatMenu(toolbar, EDITOR_TREE_CONTEXTMENU)
                : concatMenu(EDITOR_CONTEXTMENU);
            if (contextMenu.length) {
                molecule.contextMenu.open(
                    contextMenu,
                    pos,
                    // remark current contextMenu
                    {
                        name: molecule.builtin.getConstants().CONTEXTMENU_ITEM_EDITOR_TREE,
                        group,
                        tab,
                    }
                );
            }
        });
    },
};
