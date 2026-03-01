import { IContributeType, IExtension, IMoleculeContext } from '@dtinsight/molecule';
import { editor as monacoEditor, languages, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import { conf as mysqlConf, language as mysqlLanguage } from 'monaco-sql-languages/esm/languages/mysql/mysql';

import { showInfoDialog } from '../utils/showInfoDialog';
import DbExplorer from '../components/dbExplorer';
import QueryResults, { QUERY_RESULTS_PANEL_ID } from '../components/queryResults';
import Terminal from '../components/terminal';
import Problems, { PROBLEMS_PANEL_ID } from '../components/problems';
import grammars from './grammars';

export const TestExtension: IExtension = {
    id: 'SQLGateExtension',
    name: 'SQLGate for MySQL',
    contributes: {
        [IContributeType.Modules]: {
            menuBar: import('../components/menuBar'),
        },
        [IContributeType.Grammar]: grammars,
    },
    activate(molecule: IMoleculeContext) {
        const localize = molecule.locale.localize.bind(molecule.locale);

        // ===== Register MySQL Language =====
        languages.register({ id: 'mysql', extensions: ['.mysql', '.sql'], aliases: ['MySQL', 'mysql', 'SQL'] });
        languages.setMonarchTokensProvider('mysql', mysqlLanguage as any);
        languages.setLanguageConfiguration('mysql', mysqlConf as any);

        // ===== DB Explorer Sidebar =====
        molecule.activityBar.add({
            id: 'dbExplorer',
            name: localize('sqlgate.dbExplorer.name', 'DB Explorer'),
            alignment: 'top',
            sortIndex: 1,
            icon: 'database',
        });
        molecule.sidebar.add({
            id: 'dbExplorer',
            name: localize('sqlgate.dbExplorer.name', 'DB Explorer'),
            render: () => <DbExplorer context={molecule} />,
        });
        molecule.activityBar.setCurrent('dbExplorer');
        molecule.sidebar.setCurrent('dbExplorer');

        // ===== Query Results Panel =====
        molecule.panel.open({
            id: QUERY_RESULTS_PANEL_ID,
            name: localize('sqlgate.queryResults.name', 'Query Results'),
            icon: 'table',
            closable: false,
            sortIndex: 1,
            render: () => <QueryResults context={molecule} />,
        });

        // ===== Problems Panel =====
        molecule.panel.add({
            id: PROBLEMS_PANEL_ID,
            name: molecule.locale.localize('panel.item.problems', 'Problems'),
            icon: 'warning',
            closable: false,
            sortIndex: 2,
            render: () => <Problems context={molecule} />,
        });

        // Add SQL diagnostic markers when the first model is created
        const markerDisposable = monacoEditor.onDidCreateModel((model) => {
            markerDisposable.dispose();
            monacoEditor.setModelMarkers(model, 'sql-diagnostics', [
                { severity: MarkerSeverity.Error, message: "Syntax error near 'SELCT'. Did you mean 'SELECT'?", startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6, source: 'sql' },
                { severity: MarkerSeverity.Error, message: "Unknown column 'user_naem'. Did you mean 'user_name'?", startLineNumber: 3, startColumn: 8, endLineNumber: 3, endColumn: 17, source: 'sql' },
                { severity: MarkerSeverity.Error, message: "Table 'employes' does not exist. Did you mean 'employees'?", startLineNumber: 5, startColumn: 15, endLineNumber: 5, endColumn: 23, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "Using 'SELECT *' is not recommended. Specify the required columns explicitly.", startLineNumber: 7, startColumn: 1, endLineNumber: 7, endColumn: 9, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "Unused alias 't' detected.", startLineNumber: 8, startColumn: 20, endLineNumber: 8, endColumn: 21, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "Implicit type conversion: VARCHAR to INT.", startLineNumber: 10, startColumn: 7, endLineNumber: 10, endColumn: 20, source: 'sql' },
                { severity: MarkerSeverity.Warning, message: "Column without index used in WHERE clause. Performance degradation may occur.", startLineNumber: 12, startColumn: 7, endLineNumber: 12, endColumn: 25, source: 'sql' },
                { severity: MarkerSeverity.Info, message: "Adding an index on column 'created_at' would improve query performance.", startLineNumber: 14, startColumn: 1, endLineNumber: 14, endColumn: 30, source: 'sql' },
                { severity: MarkerSeverity.Info, message: "Consider using JOIN instead of subquery.", startLineNumber: 16, startColumn: 10, endLineNumber: 16, endColumn: 40, source: 'sql' },
                { severity: MarkerSeverity.Hint, message: "Table name 'tbl_usr' does not follow naming conventions.", startLineNumber: 18, startColumn: 6, endLineNumber: 18, endColumn: 13, source: 'sql' },
            ]);
        });

        // ===== Terminal Panel =====
        molecule.panel.open({
            id: 'panel.item.terminal',
            name: localize('sqlgate.terminal.name', 'Terminal'),
            icon: 'terminal',
            closable: true,
            sortIndex: 3,
            render: () => <Terminal />,
        });

        // ===== Execute Toolbar Button =====
        molecule.editor.addToolbars([
            {
                id: 'sqlgate.execute',
                icon: 'play',
                title: localize('sqlgate.execute.title', 'Execute Query (F5)'),
                group: 'inline',
                sortIndex: 1,
            },
        ]);

        molecule.editor.onToolbarClick((item) => {
            if (item.id === 'sqlgate.execute') {
                molecule.editor.updateToolbar({
                    id: 'sqlgate.execute',
                    icon: 'loading~spin',
                    disabled: true,
                });
                setTimeout(() => {
                    molecule.editor.updateToolbar({
                        id: 'sqlgate.execute',
                        icon: 'play',
                        disabled: false,
                    });
                    molecule.panel.setCurrent(QUERY_RESULTS_PANEL_ID);
                    molecule.panel.update({
                        id: QUERY_RESULTS_PANEL_ID,
                        name: localize('sqlgate.queryResults.nameWithRows', 'Query Results (${i} rows)', '5'),
                    });
                }, 800);
            }
        });

        // ===== Status Bar =====
        molecule.statusBar.add({
            id: 'sqlgate.connection',
            name: localize('sqlgate.statusBar.notConnected', 'MySQL: Not Connected'),
            alignment: 'left',
            sortIndex: 1,
            render: () => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', cursor: 'default' }}>
                    <span className="codicon codicon-database" style={{ fontSize: '14px' }} />
                    <span>{localize('sqlgate.statusBar.notConnected', 'MySQL: Not Connected')}</span>
                </span>
            ),
        });

        molecule.statusBar.add({
            id: 'sqlgate.language',
            name: 'SQL',
            alignment: 'right',
            sortIndex: 1,
        });

        // ===== Menu Bar Handlers =====
        molecule.menuBar.onSelect((menuId) => {
            const constants = molecule.builtin.getConstants();
            if (menuId === constants.MENUBAR_ITEM_ABOUT) {
                window.open('https://github.com/DTStack/molecule', '_blank');
            } else if (menuId === constants.MENUBAR_ITEM_RUN_TASK) {
                showInfoDialog({ message: localize('sqlgate.featureNotSupported', 'This feature is not supported.') });
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
                                    if (name.endsWith('.sql')) return 'sql';
                                    if (name.endsWith('.md')) return 'markdown';
                                    if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yml';
                                    if (name.endsWith('.js')) return 'javascript';
                                    if (name.endsWith('.ts')) return 'typescript';
                                    if (name.endsWith('.tsx')) return 'typescriptreact';
                                    if (name.endsWith('.jsx')) return 'javascriptreact';
                                    if (name.endsWith('.json')) return 'json';
                                    if (name.endsWith('.css') || name.endsWith('.scss')) return 'css';
                                    if (name.endsWith('.html')) return 'html';
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
    },
};
