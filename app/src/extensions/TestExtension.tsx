import { FileTypes, IContributeType, IExtension, IMoleculeContext } from '@dtinsight/molecule';
import { debounce } from 'lodash-es';
import { editor as monacoEditor, languages, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';

import { showInfoDialog } from '../utils/showInfoDialog';
import TestPane from '../components/testPane';
import Terminal from '../components/terminal';
import Problems, { PROBLEMS_PANEL_ID } from '../components/problems';
import { getFileContent, getFiles, getWorkspace, searchFileContents } from '../utils';
import grammars from './grammars';

export const TestExtension: IExtension = {
    id: 'TestExtension',
    name: 'TestExtension',
    contributes: {
        [IContributeType.Modules]: {
            menuBar: import('../components/menuBar'),
        },
        [IContributeType.Grammar]: grammars,
    },
    activate(molecule: IMoleculeContext, monaco) {
        // Register SQL language and configuration for comment toggling support
        languages.register({ id: 'sql', aliases: ['SQL', 'sql'], extensions: ['.sql'] });
        languages.setLanguageConfiguration('sql', {
            comments: {
                lineComment: '--',
                blockComment: ['/*', '*/'],
            },
            brackets: [
                ['(', ')'],
                ['[', ']'],
            ],
            autoClosingPairs: [
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: "'", close: "'" },
                { open: '"', close: '"' },
            ],
            surroundingPairs: [
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: "'", close: "'" },
                { open: '"', close: '"' },
            ],
        });

        molecule.activityBar.add({
            id: 'testPane',
            name: 'testPane',
            alignment: 'top',
            sortIndex: 2,
            icon: 'beaker',
        });
        molecule.sidebar.add({
            id: 'testPane',
            name: 'testPane',
            render: () => <TestPane context={molecule} />,
        });

        // Problems panel
        molecule.panel.add({
            id: PROBLEMS_PANEL_ID,
            name: molecule.locale.localize('panel.item.problems', 'Problems'),
            icon: 'warning',
            closable: false,
            sortIndex: 1,
            render: () => <Problems context={molecule} />,
        });

        // Add test markers when the first model is created
        const testMarkerDisposable = monacoEditor.onDidCreateModel((model) => {
            testMarkerDisposable.dispose();
            monacoEditor.setModelMarkers(model, 'sql-diagnostics', [
                { severity: MarkerSeverity.Error, message: "'SELCT' 근처에 구문 오류가 있습니다. 'SELECT'를 사용하세요.", startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6, source: 'sql' },
                { severity: MarkerSeverity.Error, message: "알 수 없는 열 'user_naem'. 'user_name'을(를) 의미합니까?", startLineNumber: 3, startColumn: 8, endLineNumber: 3, endColumn: 17, source: 'sql' },
                { severity: MarkerSeverity.Error, message: "테이블 'employes'이(가) 존재하지 않습니다. 'employees'을(를) 의미합니까?", startLineNumber: 5, startColumn: 15, endLineNumber: 5, endColumn: 23, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "'SELECT *' 사용은 권장되지 않습니다. 필요한 열을 명시적으로 지정하세요.", startLineNumber: 7, startColumn: 1, endLineNumber: 7, endColumn: 9, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "사용되지 않는 별칭 't'이(가) 감지되었습니다.", startLineNumber: 8, startColumn: 20, endLineNumber: 8, endColumn: 21, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "암시적 타입 변환이 발생합니다: VARCHAR → INT", startLineNumber: 10, startColumn: 7, endLineNumber: 10, endColumn: 20, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "WHERE 절에 인덱스가 없는 열이 사용되었습니다. 성능 저하가 발생할 수 있습니다.", startLineNumber: 12, startColumn: 7, endLineNumber: 12, endColumn: 25, source: 'sql' },
                { severity: MarkerSeverity.Info, message: "'created_at' 열에 인덱스를 추가하면 쿼리 성능이 향상됩니다.", startLineNumber: 14, startColumn: 1, endLineNumber: 14, endColumn: 30, source: 'sql' },
                { severity: MarkerSeverity.Info, message: "서브쿼리 대신 JOIN 사용을 고려하세요.", startLineNumber: 16, startColumn: 10, endLineNumber: 16, endColumn: 40, source: 'sql' },
                { severity: MarkerSeverity.Hint, message: "테이블 이름 'tbl_usr'이(가) 명명 규칙을 따르지 않습니다.", startLineNumber: 18, startColumn: 6, endLineNumber: 18, endColumn: 13, source: 'sql' },
            ]);
        });

        // Terminal panel
        molecule.panel.open({
            id: 'panel.item.terminal',
            name: '터미널',
            icon: 'terminal',
            closable: true,
            sortIndex: 3,
            render: () => <Terminal />,
        });

        molecule.activityBar.onContextMenu(() => {
        });

        molecule.contextMenu.onClick((item) => {
            if (item.id === 'testPane__activityBar__molecule') {
                alert('Molecule');
            }
        });

        molecule.folderTree.onRename((ele, treeNode) => {
            const value = ele.value;
            if (!value) {
                ele.focus();
                molecule.folderTree.setValidateInfo({
                    status: 'error',
                    message: molecule.locale.localize(
                        treeNode.fileType === 'File' ? 'folderTree.validate.fileName' : 'folderTree.validate.folderName',
                        treeNode.fileType === 'File' ? 'A file name must be provided.' : 'A folder name must be provided.'
                    ),
                });
                return false;
            }
        });

        molecule.search.onSelect((treeNode) => {
            if (treeNode.fileType === 'File') {
                openFile({ id: treeNode.id, name: treeNode.name });
            }
        });

        const searchByValue = (value: string) => {
            if (!value) {
                molecule.search.setResult([], 0);
                return;
            }
            molecule.sidebar.setLoading(true);
            searchFileContents(value)
                .then((data) => {
                    molecule.search.setResult(
                        data.map((item) => ({
                            id: `${item.filename}_${item.startline}`,
                            filename: item.filename,
                            data: item.data,
                            path: item.path,
                            lineNumber: item.startline,
                        })),
                        data.length
                    );
                    molecule.search.expandAll();
                })
                .finally(() => {
                    molecule.sidebar.setLoading(false);
                });
        };

        molecule.search.onEnter(searchByValue);
        molecule.search.onSearch(debounce(searchByValue, 1000));

        molecule.folderTree.onCreateRoot(() => {
            getWorkspace().then((tree) => {
                molecule.folderTree.add(tree);
                molecule.explorer.update({
                    id: molecule.builtin.getConstants().EXPLORER_ITEM_WORKSPACE,
                    name: tree.name,
                });
                molecule.sidebar.updateToolbar(molecule.builtin.getConstants().SIDEBAR_ITEM_EXPLORER, {
                    id: molecule.builtin.getConstants().EXPLORER_ITEM_WORKSPACE,
                    name: tree.name,
                });
            });
        });

        molecule.folderTree.onContextMenu((_, treeNode) => {
            if (treeNode.fileType === FileTypes.File) {
                molecule.contextMenu.add([
                    { id: 'testPane', name: molecule.locale.localize('folderTree.contextMenu.openTestPane', 'Open testPane Panel') },
                    { id: 'testPane_divider', type: 'divider' },
                ]);
            }
        });

        molecule.folderTree.onLoad((id) => {
            molecule.folderTree.addLoading(id);
            getFiles(id as string)
                .then(([folder, files]) => {
                    molecule.folderTree.update({
                        id,
                        children: [...folder, ...files],
                    });
                })
                .catch((err) => {
                    molecule.layout.setNotification(true);
                    molecule.notification.add({
                        id: `getFiles${id}`,
                        value: err.message,
                    });
                })
                .finally(() => {
                    molecule.folderTree.removeLoading(id);
                });
        });

        molecule.folderTree.onSelect((treeNode) => {
            const group = molecule.editor.getGroups().find((group) => {
                const tab = molecule.editor.getTab(treeNode.id, group.id);
                return !!tab;
            });
            if (group) {
                const tab = molecule.editor.getTab(treeNode.id, group.id)!;
                molecule.editor.setCurrent(tab.id, group.id);
            } else if (treeNode.fileType === 'File') {
                openFile(treeNode);
            }
        });

        molecule.folderTree.onUpdate((treeNode) => {
            const next = molecule.folderTree.get(treeNode.id);
            if (!next) return;
            molecule.editor.setLoading(true);
            const { groups } = molecule.editor.getState();
            groups.forEach((group) => {
                const tab = molecule.editor.getTab(treeNode.id, group.id);
                if (tab) {
                    molecule.editor.updateTab(
                        {
                            id: next.id,
                            name: treeNode.name,
                            icon: treeNode.icon || 'file',
                            value: tab.value,
                            breadcrumb: (treeNode.id as string)
                                .split('/')
                                .filter(Boolean)
                                .map((i) => ({ id: i, name: i })),
                        },
                        group.id
                    );
                }
            });
            molecule.editor.setLoading(false);
        });

        molecule.folderTree.onContextMenuClick((item, treeNode) => {
            const { EXPLORER_CONTEXTMENU_OPEN_TO_SIDE } = molecule.builtin.getConstants();
            switch (item.id) {
                case EXPLORER_CONTEXTMENU_OPEN_TO_SIDE: {
                    openFile(treeNode);
                    break;
                }

                default:
                    break;
            }
        });

        molecule.folderTree.onDrop((source, target) => {
            molecule.folderTree.drop(source.id, target.id);
        });

        molecule.menuBar.onSelect((menuId) => {
            const constants = molecule.builtin.getConstants();
            if (menuId === constants.MENUBAR_ITEM_ABOUT) {
                window.open('https://github.com/DTStack/molecule', '_blank');
            } else if (menuId === constants.MENUBAR_ITEM_RUN_TASK) {
                showInfoDialog({ message: '이 기능은 지원하지 않습니다.' });
            } else if (menuId === constants.MENUBAR_ITEM_OPEN) {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = () => {
                    const files = input.files;
                    if (!files) return;
                    Array.from(files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const content = reader.result as string;
                            const tabData = {
                                id: `local_${file.name}_${Date.now()}`,
                                name: file.name,
                                icon: 'file' as const,
                                value: content,
                                language: (() => {
                                    const name = file.name;
                                    if (name.endsWith('.md')) return 'markdown';
                                    if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yml';
                                    if (name.endsWith('.js')) return 'javascript';
                                    if (name.endsWith('.ts')) return 'typescript';
                                    if (name.endsWith('.tsx')) return 'typescriptreact';
                                    if (name.endsWith('.jsx')) return 'javascriptreact';
                                    if (name.endsWith('.json')) return 'json';
                                    if (name.endsWith('.css') || name.endsWith('.scss')) return 'css';
                                    if (name.endsWith('.html')) return 'html';
                                    if (name.endsWith('.sql')) return 'sql';
                                    return 'plain';
                                })(),
                                breadcrumb: [{ id: file.name, name: file.name }],
                            };
                            molecule.editor.open(tabData, molecule.editor.getState().groups?.at(0)?.id);
                        };
                        reader.readAsText(file);
                    });
                };
                input.click();
            }
        });

        molecule.menuBar.subscribe('APP_DEBUG_ICON', () => {
            molecule.action.execute('workbench.action.quickOpenFile');
        });

        molecule.editor.onClose((tabs) => {
            molecule.notification.open({
                id: `close_tab_${new Date().valueOf()}`,
                value: molecule.locale.localize('notification.item.closedTabs', `Closed ${tabs.length} tab(s)`, tabs.length.toString()),
            });
        });

        molecule.editor.onCurrentChange((_, next) => {
            if (next.tabId) {
                molecule.folderTree.setCurrent(next.tabId);
            }
        });

        function openFile(treeNode: any) {
            molecule.editor.setLoading(true);
            getFileContent(treeNode.id as string)
                .then((data) => {
                    const tabData = {
                        id: treeNode.id,
                        name: treeNode.name,
                        icon: treeNode.icon || 'file',
                        value: data,
                        language: (() => {
                            const name = treeNode.name;
                            if (typeof name !== 'string') return 'plain';
                            if (name.endsWith('.md')) return 'markdown';
                            if (name.endsWith('.yml')) return 'yml';
                            if (name.endsWith('.js')) return 'javascript';
                            if (name.endsWith('.ts')) return 'typescript';
                            if (name.endsWith('.tsx')) return 'typescriptreact';
                            if (name.endsWith('.json')) return 'json';
                            if (name.endsWith('.scss')) return 'css';
                            if (name.endsWith('.html')) return 'html';
                            return 'plain';
                        })(),
                        breadcrumb: (treeNode.id as string)
                            .split('/')
                            .filter(Boolean)
                            .map((i) => ({ id: i, name: i })),
                    };
                    molecule.editor.open(tabData, molecule.editor.getState().groups?.at(0)?.id);
                })
                .catch((err) => {
                    molecule.layout.setNotification(true);
                    molecule.notification.add({
                        id: `getFileContent_${treeNode.id}`,
                        value: err.message,
                    });
                })
                .finally(() => {
                    molecule.editor.setLoading(false);
                });
        }
    },
};
