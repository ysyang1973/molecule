import { EditorEvent } from 'mo/models/editor';
import type { editor } from 'mo/monaco';
import type { IEditorTab, IExtension, UniqueId } from 'mo/types';
import { type ConfirmDialogResult, showConfirmDialog } from 'mo/utils/confirmDialog';

const lockedGroups = new Set<UniqueId>();
let savedGroupSplitPos: number[] | null = null;

export const ExtendsEditor: IExtension = {
    id: 'ExtendsEditor',
    name: 'Extend The Default Editor',
    activate: function (molecule): void {
        molecule.editor.onFocus(updateCursorPosition);
        molecule.editor.onCursorSelection(updateCursorPosition);

        function getDialogLabels() {
            return {
                saveLabel: molecule.locale.localize('editor.closeConfirm.save', 'Save'),
                dontSaveLabel: molecule.locale.localize('editor.closeConfirm.dontSave', "Don't Save"),
                cancelLabel: molecule.locale.localize('editor.closeConfirm.cancel', 'Cancel'),
            };
        }

        async function confirmCloseTab(tab: IEditorTab<any> | undefined): Promise<ConfirmDialogResult> {
            if (!tab?.modified) return 'dontsave';
            const name = typeof tab.name === 'string' ? tab.name : String(tab.name ?? '');
            return showConfirmDialog({
                message: molecule.locale.localize(
                    'editor.closeConfirm.single',
                    `'${name}' has unsaved changes. Do you want to save the changes?`,
                    name
                ),
                ...getDialogLabels(),
            });
        }

        async function confirmCloseTabs(tabs: IEditorTab<any>[]): Promise<ConfirmDialogResult> {
            const modifiedTabs = tabs.filter((t) => t.modified);
            if (modifiedTabs.length === 0) return 'dontsave';
            if (modifiedTabs.length === 1) {
                return confirmCloseTab(modifiedTabs[0]);
            }
            return showConfirmDialog({
                message: molecule.locale.localize(
                    'editor.closeConfirm.multiple',
                    'There are unsaved changes in some tabs. Do you want to save the changes?'
                ),
                ...getDialogLabels(),
            });
        }

        function saveModifiedTabs(tabs: IEditorTab<any>[], groupId: UniqueId) {
            const modifiedIds = tabs.filter((t) => t.modified).map((t) => t.id);
            if (modifiedIds.length > 0) {
                molecule.editor.saveTabs(modifiedIds, groupId);
            }
        }

        molecule.editor.onCloseAll(async (groupId) => {
            if (groupId !== undefined && lockedGroups.has(groupId)) return;
            let tabs: IEditorTab<any>[];
            if (groupId !== undefined) {
                const group = molecule.editor.getGroup(groupId);
                tabs = group?.data ?? [];
            } else {
                tabs = molecule.editor.getGroups().flatMap((g) => g.data);
            }
            const result = await confirmCloseTabs(tabs);
            if (result === 'cancel') return;
            if (result === 'save') {
                if (groupId !== undefined) {
                    saveModifiedTabs(tabs, groupId);
                } else {
                    molecule.editor.getGroups().forEach((g) => saveModifiedTabs(g.data, g.id));
                }
            }
            molecule.editor.closeAll(groupId);
        });
        molecule.editor.onCloseOther(async (tabId, groupId) => {
            if (lockedGroups.has(groupId)) return;
            const tabs = molecule.editor.getTabs(groupId).filter((t) => t.id !== tabId);
            const result = await confirmCloseTabs(tabs);
            if (result === 'cancel') return;
            if (result === 'save') saveModifiedTabs(tabs, groupId);
            molecule.editor.closeOther(tabId, groupId);
        });
        molecule.editor.onCloseTab(async (tabId, groupId) => {
            if (lockedGroups.has(groupId)) return;
            const tab = molecule.editor.getTab(tabId, groupId);
            const result = await confirmCloseTab(tab);
            if (result === 'cancel') return;
            if (result === 'save' && tab) {
                molecule.editor.saveTabs([tab.id], groupId);
            }
            molecule.editor.closeTab(tabId, groupId);
        });
        molecule.editor.onCloseToLeft(async (tabId, groupId) => {
            const tabs = molecule.editor.getTabs(groupId);
            const idx = tabs.findIndex((t) => t.id === tabId);
            const left = tabs.slice(0, idx);
            const result = await confirmCloseTabs(left);
            if (result === 'cancel') return;
            if (result === 'save') saveModifiedTabs(left, groupId);
            molecule.editor.closeToLeft(tabId, groupId);
        });
        molecule.editor.onCloseToRight(async (tabId, groupId) => {
            const tabs = molecule.editor.getTabs(groupId);
            const idx = tabs.findIndex((t) => t.id === tabId);
            const right = tabs.slice(idx + 1);
            const result = await confirmCloseTabs(right);
            if (result === 'cancel') return;
            if (result === 'save') saveModifiedTabs(right, groupId);
            molecule.editor.closeToRight(tabId, groupId);
        });

        molecule.editor.onDragStart((tabId, groupId) => {
            molecule.editor.setCurrent(tabId, groupId);
        });

        let settimeout = 0;
        molecule.editor.onDragEnter((_, to) => {
            window.clearTimeout(settimeout);
            settimeout = window.setTimeout(() => {
                molecule.editor.setCurrent(to.tabId, to.groupId);
            }, 2000);
        });

        molecule.editor.onDragLeave(() => {
            window.clearTimeout(settimeout);
        });

        molecule.editor.onDrop((from, to) => {
            molecule.editor.moveTab(from, to);
            window.clearTimeout(settimeout);
        });

        molecule.editor.onChange(({ value, tabId, groupId }) => {
            const tab = molecule.editor.getTab(tabId, groupId);
            if (!tab) return;
            molecule.editor.updateTab({ ...tab, value, modified: true }, groupId);
        });

        let splitting = false;
        molecule.editor.onSplitEditorRight((activeTabId, groupId) => {
            if (splitting) return;
            splitting = true;
            queueMicrotask(() => { splitting = false; });
            const tab = molecule.editor.getTab(activeTabId, groupId);
            if (!tab) return;
            molecule.editor.addGroup(tab);
            const groups = molecule.editor.getGroups();
            const last = groups.at(-1);
            if (last) {
                molecule.editor.setCurrentGroup(last.id);
            }
        });

        molecule.editor.onSelectTab((tabId, groupId) => {
            molecule.editor.setCurrent(tabId, groupId);
            if (molecule.folderTree.get(tabId)) {
                molecule.folderTree.setCurrent(tabId);
            }
        });

        molecule.editor.onToolbarClick((item, groupId) => {
            const {
                EDITOR_TOOLBAR_SPLIT,
                EDITOR_CONTEXTMENU_CLOSE_ALL,
                EDITOR_TOOLBAR_CLOSE_SAVED,
                EDITOR_TOOLBAR_MAXIMIZE_GROUP,
                EDITOR_TOOLBAR_LOCK_GROUP,
                EDITOR_TOOLBAR_EDITOR_LAYOUT,
            } = molecule.builtin.getState().constants;
            switch (item.id) {
                case EDITOR_TOOLBAR_SPLIT: {
                    const group = molecule.editor.getGroup(groupId);
                    if (!group || !group.activeTab) return;
                    molecule.editor.emit(EditorEvent.onSplitEditorRight, group.activeTab, group.id);
                    break;
                }
                case EDITOR_CONTEXTMENU_CLOSE_ALL: {
                    molecule.editor.emit(EditorEvent.onCloseAll, groupId);
                    break;
                }
                case EDITOR_TOOLBAR_CLOSE_SAVED: {
                    molecule.editor.closeSaved(groupId);
                    break;
                }
                case EDITOR_TOOLBAR_MAXIMIZE_GROUP: {
                    // Toggle maximize: if there are multiple groups, hide all others by
                    // setting the split sizes so only this group is visible
                    const groups = molecule.editor.getGroups();
                    if (groups.length <= 1) return;
                    const idx = groups.findIndex((g) => g.id === groupId);
                    if (idx === -1) return;
                    const currentSizes = molecule.layout.getState().groupSplitPos;
                    const isMaximized =
                        currentSizes.length === groups.length &&
                        currentSizes[idx] !== undefined &&
                        currentSizes.filter((s, i) => i !== idx && s === 0).length === groups.length - 1;
                    if (isMaximized) {
                        // Restore to saved sizes, or distribute evenly
                        if (savedGroupSplitPos && savedGroupSplitPos.length === groups.length) {
                            molecule.layout.setGroupSplitSize(savedGroupSplitPos);
                        } else {
                            const evenSize = 1 / groups.length;
                            molecule.layout.setGroupSplitSize(groups.map(() => evenSize));
                        }
                        savedGroupSplitPos = null;
                    } else {
                        // Save current sizes before maximizing
                        if (currentSizes.length === groups.length) {
                            savedGroupSplitPos = [...currentSizes];
                        }
                        // Maximize: give all space to the focused group
                        const sizes = groups.map((_, i) => (i === idx ? 1 : 0));
                        molecule.layout.setGroupSplitSize(sizes);
                    }
                    break;
                }
                case EDITOR_TOOLBAR_LOCK_GROUP: {
                    // Toggle lock state for the group
                    if (lockedGroups.has(groupId)) {
                        lockedGroups.delete(groupId);
                    } else {
                        lockedGroups.add(groupId);
                    }
                    break;
                }
                case EDITOR_TOOLBAR_EDITOR_LAYOUT: {
                    molecule.settings.access();
                    break;
                }
                default:
                    break;
            }
        });

        molecule.editor.onContextMenu((pos, tabId, groupId) => {
            molecule.contextMenu.open(molecule.builtin.getModules().EDITOR_CONTEXTMENU, pos, {
                name: molecule.builtin.getConstants().CONTEXTMENU_ITEM_EDITOR,
                item: { tabId, groupId },
            });
        });

        molecule.editor.onContextMenuClick((item, tabId, groupId) => {
            const {
                EDITOR_CONTEXTMENU_CLOSE,
                EDITOR_CONTEXTMENU_CLOSE_ALL,
                EDITOR_CONTEXTMENU_CLOSE_OTHERS,
                EDITOR_CONTEXTMENU_CLOSE_TO_LEFT,
                EDITOR_CONTEXTMENU_CLOSE_TO_RIGHT,
            } = molecule.builtin.getConstants();
            switch (item.id) {
                case EDITOR_CONTEXTMENU_CLOSE: {
                    molecule.editor.emit(EditorEvent.onCloseTab, tabId, groupId);
                    break;
                }
                case EDITOR_CONTEXTMENU_CLOSE_OTHERS: {
                    molecule.editor.emit(EditorEvent.onCloseOther, tabId, groupId);
                    break;
                }
                case EDITOR_CONTEXTMENU_CLOSE_TO_LEFT: {
                    molecule.editor.emit(EditorEvent.onCloseToLeft, tabId, groupId);
                    break;
                }
                case EDITOR_CONTEXTMENU_CLOSE_TO_RIGHT: {
                    molecule.editor.emit(EditorEvent.onCloseToRight, tabId, groupId);
                    break;
                }
                case EDITOR_CONTEXTMENU_CLOSE_ALL: {
                    molecule.editor.emit(EditorEvent.onCloseAll, groupId);
                    break;
                }
                default:
                    break;
            }
        });

        /**
         * Updates the cursor position in the given code editor instance.
         *
         * @param {editor.IStandaloneCodeEditor} instance - The code editor instance.
         */
        function updateCursorPosition(instance: editor.IStandaloneCodeEditor) {
            const currentTab = molecule.editor.getCurrentTab();
            if (!currentTab?.model) return;
            if (currentTab.model === instance.getModel()) {
                const position = instance.getPosition();
                molecule.statusBar.update({
                    id: molecule.builtin.getState().constants.STATUSBAR_ITEM_LINE_INFO,
                    data: {
                        ln: position?.lineNumber,
                        col: position?.column,
                    },
                });
            }
        }
    },
};
