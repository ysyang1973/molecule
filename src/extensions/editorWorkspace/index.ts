import React from 'react';
import { debounce } from 'lodash-es';
import { AUXILIARY_BAR_STORE_KEY, EDITOR_WORKSPACE_STORE_KEY, PANEL_STORE_KEY } from 'mo/const';
import { AuxiliaryModel, type IAuxiliaryData } from 'mo/models/auxiliaryBar';
import { EditorGroupModel } from 'mo/models/editor';
import { PanelModel, type IPanelItem } from 'mo/models/panel';
import type { IEditorTab, IExtension, UniqueId } from 'mo/types';
import { randomId } from 'mo/utils';
import { getValue, setValue } from 'mo/utils/storage';

// ===================== Editor Types =====================

interface ISerializableEditorTab {
    id: UniqueId;
    name: string;
    icon?: string;
    value?: string | [string, string];
    language?: string;
    breadcrumb?: Array<{ id: UniqueId; name: string; icon?: string }>;
    modified?: boolean;
    data?: unknown;
}

interface ISerializableEditorGroup {
    id: UniqueId;
    data: ISerializableEditorTab[];
    activeTab?: UniqueId;
}

interface ISerializableEditorWorkspace {
    groups: ISerializableEditorGroup[];
    current?: UniqueId;
}

function serializeTab(tab: IEditorTab<any>): ISerializableEditorTab {
    const serialized: ISerializableEditorTab = {
        id: tab.id,
        name: typeof tab.name === 'string' ? tab.name : String(tab.name ?? ''),
        value: tab.value,
        language: tab.language,
        modified: tab.modified,
    };

    if (typeof tab.icon === 'string') {
        serialized.icon = tab.icon;
    }

    if (tab.breadcrumb) {
        serialized.breadcrumb = tab.breadcrumb.map((b) => ({
            id: b.id,
            name: typeof b.name === 'string' ? b.name : String(b.name ?? ''),
            ...(typeof b.icon === 'string' ? { icon: b.icon } : {}),
        }));
    }

    if (tab.data !== undefined) {
        try {
            JSON.stringify(tab.data);
            serialized.data = tab.data;
        } catch {
            // data is not serializable, omit it
        }
    }

    return serialized;
}

// ===================== Auxiliary Types =====================

interface ISerializableAuxiliary {
    id: UniqueId;
    name?: string;
    icon?: string;
    hidden?: boolean;
}

interface ISerializableAuxiliaryBar {
    data: ISerializableAuxiliary[];
    current?: UniqueId;
    layoutVisible: boolean;
}

function serializeAuxiliary(item: IAuxiliaryData): ISerializableAuxiliary {
    return {
        id: item.id,
        name: typeof item.name === 'string' ? item.name : String(item.name ?? ''),
        ...(typeof item.icon === 'string' ? { icon: item.icon } : {}),
        ...(item.hidden ? { hidden: true } : {}),
    };
}

// ===================== Panel Types =====================

interface ISerializablePanel {
    id: UniqueId;
    name?: string;
    icon?: string;
    hidden?: boolean;
    closable?: boolean;
    sortIndex?: number;
    data?: unknown;
}

interface ISerializablePanelState {
    data: ISerializablePanel[];
    current?: UniqueId;
}

function serializePanel(item: IPanelItem<any>): ISerializablePanel {
    const serialized: ISerializablePanel = {
        id: item.id,
        name: typeof item.name === 'string' ? item.name : String(item.name ?? ''),
        ...(typeof item.icon === 'string' ? { icon: item.icon } : {}),
        ...(item.hidden ? { hidden: true } : {}),
        ...(item.closable !== undefined ? { closable: item.closable } : {}),
        ...(item.sortIndex !== undefined ? { sortIndex: item.sortIndex } : {}),
    };

    if (item.data !== undefined) {
        try {
            JSON.stringify(item.data);
            serialized.data = item.data;
        } catch {
            // data is not serializable, omit it
        }
    }

    return serialized;
}

export const ExtendsEditorWorkspace: IExtension = {
    id: 'ExtendsEditorWorkspace',
    name: 'Extend Editor Workspace Persistence',
    activate: function (molecule): void {
        let isRestoring = false;

        // ===================== EDITOR SAVE =====================
        const saveWorkspace = debounce(() => {
            if (isRestoring) return;
            try {
                const groups = molecule.editor.getGroups();
                const current = molecule.editor.getCurrent();
                const workspace: ISerializableEditorWorkspace = {
                    groups: groups.map((group) => ({
                        id: group.id,
                        data: group.data.map(serializeTab),
                        activeTab: group.activeTab,
                    })),
                    current,
                };
                setValue(EDITOR_WORKSPACE_STORE_KEY, JSON.stringify(workspace));
            } catch (e) {
                console.warn('[EditorWorkspace] Failed to save workspace:', e);
            }
        }, 1000);

        molecule.editor.onOpenTab(() => saveWorkspace());
        molecule.editor.onClose(() => saveWorkspace());
        molecule.editor.onCurrentChange(() => saveWorkspace());
        molecule.editor.onUpdateTab(() => saveWorkspace());
        molecule.editor.onDrop(() => saveWorkspace());

        // ===================== AUXILIARY SAVE =====================
        const saveAuxiliaryBar = debounce(() => {
            if (isRestoring) return;
            try {
                const auxState = molecule.auxiliaryBar.getState();
                const layoutState = molecule.layout.getState();
                const auxBar: ISerializableAuxiliaryBar = {
                    data: auxState.data.map(serializeAuxiliary),
                    current: auxState.current,
                    layoutVisible: !layoutState.auxiliaryBar.hidden,
                };
                setValue(AUXILIARY_BAR_STORE_KEY, JSON.stringify(auxBar));
            } catch (e) {
                console.warn('[EditorWorkspace] Failed to save auxiliary bar:', e);
            }
        }, 1000);

        molecule.auxiliaryBar.onTabClick(() => saveAuxiliaryBar());
        molecule.auxiliaryBar.onUpdateState(() => saveAuxiliaryBar());

        // ===================== PANEL SAVE =====================
        const savePanel = debounce(() => {
            if (isRestoring) return;
            try {
                const panelState = molecule.panel.getState();
                const panelData: ISerializablePanelState = {
                    data: panelState.data.map(serializePanel),
                    current: panelState.current,
                };
                setValue(PANEL_STORE_KEY, JSON.stringify(panelData));
            } catch (e) {
                console.warn('[EditorWorkspace] Failed to save panel:', e);
            }
        }, 1000);

        molecule.panel.onChange(() => savePanel());
        molecule.panel.onClose(() => savePanel());
        molecule.panel.onUpdateState(() => savePanel());

        // ===================== FLUSH ON UNLOAD =====================
        window.addEventListener('beforeunload', () => {
            saveWorkspace.flush();
            saveAuxiliaryBar.flush();
            savePanel.flush();
        });

        // ===================== EDITOR RESTORE =====================
        const storedEditor = getValue(EDITOR_WORKSPACE_STORE_KEY);
        if (storedEditor) {
            isRestoring = true;
            try {
                const workspace: ISerializableEditorWorkspace = JSON.parse(storedEditor);
                if (workspace.groups && workspace.groups.length > 0) {
                    molecule.editor.dispatch((draft) => {
                        const groupIdMap: UniqueId[] = [];

                        for (const group of workspace.groups) {
                            if (group.data.length === 0) {
                                groupIdMap.push('');
                                continue;
                            }

                            const seen = new Set<UniqueId>();
                            const uniqueTabs = group.data.filter((tab) => {
                                if (seen.has(tab.id)) return false;
                                seen.add(tab.id);
                                return true;
                            });

                            const groupId = `EDITOR_GROUP_${randomId()}`;
                            const activeTab =
                                group.activeTab && seen.has(group.activeTab)
                                    ? group.activeTab
                                    : uniqueTabs[0].id;

                            const newGroup = {
                                ...new EditorGroupModel(
                                    groupId,
                                    uniqueTabs as IEditorTab<any>[],
                                    activeTab
                                ),
                            };
                            draft.groups.push(newGroup);
                            groupIdMap.push(groupId);
                        }

                        const restoredIdx = workspace.current
                            ? workspace.groups.findIndex((g) => g.id === workspace.current)
                            : 0;
                        const targetIdx = restoredIdx !== -1 ? restoredIdx : 0;
                        const targetGroupId = groupIdMap[targetIdx];
                        if (targetGroupId) {
                            draft.current = targetGroupId;
                        }
                    });
                }
            } catch (e) {
                console.warn('[EditorWorkspace] Failed to restore workspace:', e);
                setValue(EDITOR_WORKSPACE_STORE_KEY, '');
            } finally {
                isRestoring = false;
            }
        }

        // ===================== AUXILIARY & PANEL RESTORE (deferred) =====================
        // Deferred via setTimeout to ensure all controllers (e.g. OutputController
        // adding "Output" panel), extensions, and their microtasks have fully completed.
        setTimeout(() => {
            // --- Auxiliary Restore ---
            const storedAux = getValue(AUXILIARY_BAR_STORE_KEY);
            if (storedAux) {
                try {
                    const auxBar: ISerializableAuxiliaryBar = JSON.parse(storedAux);
                    if (auxBar.data && auxBar.data.length > 0) {
                        const items: IAuxiliaryData[] = auxBar.data.map((item) => ({
                            id: item.id,
                            name: item.name,
                            icon: item.icon,
                            hidden: item.hidden,
                            render(self) {
                                return React.createElement('pre', { style: { margin: 0 } }, String(self?.name ?? ''));
                            },
                        }));

                        molecule.auxiliaryBar.dispatch((draft: AuxiliaryModel) => {
                            const existingById = new Map(draft.data.map((d) => [d.id, d]));
                            const merged: IAuxiliaryData[] = [];
                            const seen = new Set<UniqueId>();

                            for (const item of items) {
                                if (seen.has(item.id)) continue;
                                seen.add(item.id);
                                merged.push(existingById.get(item.id) ?? item);
                            }

                            for (const existing of draft.data) {
                                if (!seen.has(existing.id)) {
                                    merged.push(existing);
                                }
                            }

                            draft.data.length = 0;
                            draft.data.push(...merged);

                            if (auxBar.current) {
                                draft.current = auxBar.current;
                            }
                        });

                        if (auxBar.layoutVisible) {
                            molecule.layout.setAuxiliaryBar(true);
                        }
                    }
                } catch (e) {
                    console.warn('[EditorWorkspace] Failed to restore auxiliary bar:', e);
                    setValue(AUXILIARY_BAR_STORE_KEY, '');
                }
            }

            // --- Panel Restore ---
            const storedPanel = getValue(PANEL_STORE_KEY);
            if (storedPanel) {
                try {
                    const panelData: ISerializablePanelState = JSON.parse(storedPanel);
                    if (panelData.data && panelData.data.length > 0) {
                        const items: IPanelItem[] = panelData.data.map((item) => ({
                            id: item.id,
                            name: item.name,
                            icon: item.icon,
                            hidden: item.hidden,
                            closable: item.closable,
                            sortIndex: item.sortIndex,
                            data: item.data,
                            render(self) {
                                return React.createElement('pre', { style: { margin: 0 } }, String(self?.name ?? ''));
                            },
                        }));

                        molecule.panel.dispatch((draft: PanelModel) => {
                            // Build a map of existing items (with real render functions)
                            const existingById = new Map(draft.data.map((d) => [d.id, d]));
                            const merged: IPanelItem[] = [];
                            const seen = new Set<UniqueId>();

                            // Follow saved order, preferring existing items (they have real render)
                            for (const item of items) {
                                if (seen.has(item.id)) continue;
                                seen.add(item.id);
                                merged.push(existingById.get(item.id) ?? item);
                            }

                            // Append any existing items not in saved data
                            for (const existing of draft.data) {
                                if (!seen.has(existing.id)) {
                                    merged.push(existing);
                                }
                            }

                            draft.data.length = 0;
                            draft.data.push(...merged);

                            if (panelData.current) {
                                draft.current = panelData.current;
                            }
                        });
                    }
                } catch (e) {
                    console.warn('[EditorWorkspace] Failed to restore panel:', e);
                    setValue(PANEL_STORE_KEY, '');
                }
            }
        });
    },
};
