import { useState, useRef, useCallback } from 'react';
import { components, FileTypes, type IMoleculeContext } from '@dtinsight/molecule';

import { MOCK_DB_TREE, type DbObjectMeta } from '../data/dbMockData';
import { showConnectionDialog, type ConnectionFormData } from './dbConnectionDialog';
import DbObjectDetail from './dbObjectDetail';

import './dbExplorer.css';

const DETAILABLE_TYPES = new Set(['table', 'view', 'procedure', 'function', 'index', 'trigger']);
const MIN_TREE_HEIGHT = 120;
const MIN_DETAIL_HEIGHT = 80;

export default function DbExplorer({ context: molecule }: { context: IMoleculeContext }) {
    const localize = molecule.locale.localize.bind(molecule.locale);

    const [form, setForm] = useState<ConnectionFormData>({
        host: 'localhost',
        port: '3306',
        username: 'root',
        password: '',
        database: 'mydb',
    });
    const [connected, setConnected] = useState(false);
    const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
    const [activeKey, setActiveKey] = useState<string | number | undefined>();
    const [selectedObject, setSelectedObject] = useState<{ meta: DbObjectMeta | null; name: string }>({ meta: null, name: '' });
    const [treeHeight, setTreeHeight] = useState<number | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const updateStatusBar = (data: ConnectionFormData | null) => {
        if (data) {
            molecule.statusBar.update({
                id: 'sqlgate.connection',
                name: `MySQL: ${data.host}:${data.port}/${data.database}`,
                render: () => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', cursor: 'default' }}>
                        <span className="codicon codicon-database" style={{ fontSize: '14px', color: '#89d185' }} />
                        <span>{data.host}:{data.port}/{data.database}</span>
                    </span>
                ),
            });
        } else {
            molecule.statusBar.update({
                id: 'sqlgate.connection',
                name: localize('sqlgate.statusBar.notConnected', 'MySQL: Not Connected'),
                render: () => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', cursor: 'default' }}>
                        <span className="codicon codicon-database" style={{ fontSize: '14px' }} />
                        <span>{localize('sqlgate.statusBar.notConnected', 'MySQL: Not Connected')}</span>
                    </span>
                ),
            });
        }
    };

    const handleConnect = (data: ConnectionFormData) => {
        setForm(data);
        setConnected(true);
        setExpandedKeys(['db_mydb']);
        setActiveKey(undefined);
        setSelectedObject({ meta: null, name: '' });
        setTreeHeight(null);
        updateStatusBar(data);
    };

    const handleDisconnect = () => {
        setConnected(false);
        setExpandedKeys([]);
        setActiveKey(undefined);
        setSelectedObject({ meta: null, name: '' });
        setTreeHeight(null);
        updateStatusBar(null);
    };

    const openConnectionDialog = () => {
        showConnectionDialog({
            initialValues: form,
            onConnect: handleConnect,
            localize,
        });
    };

    const handleTreeSelect = (node: any) => {
        if (node.fileType === FileTypes.Folder) {
            setExpandedKeys((prev) =>
                prev.includes(node.id) ? prev.filter((k: any) => k !== node.id) : [...prev, node.id]
            );
        }

        setActiveKey(node.id);

        const meta = node.data as DbObjectMeta | undefined;
        if (meta && DETAILABLE_TYPES.has(meta.objectType)) {
            setSelectedObject({ meta, name: node.name });
        }
    };

    const handleSashMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
        const startY = e.clientY;
        const container = containerRef.current;
        if (!container) return;

        const treeSection = container.querySelector('.db-explorer__tree-pane') as HTMLElement;
        if (!treeSection) return;
        const startHeight = treeSection.getBoundingClientRect().height;
        const containerHeight = container.getBoundingClientRect().height;
        // Subtract header + connection bar height
        const headerHeight = container.querySelector('.db-explorer__header')?.getBoundingClientRect().height ?? 0;
        const barHeight = container.querySelector('.db-explorer__connection-bar')?.getBoundingClientRect().height ?? 0;
        const availableHeight = containerHeight - headerHeight - barHeight - 5; // 5 = sash height

        const sash = container.querySelector('.db-explorer__sash') as HTMLElement;
        const detailSection = container.querySelector('.db-explorer__detail-pane') as HTMLElement;
        if (sash) sash.classList.add('db-explorer__sash--active');

        // Lock current height and disable flex so the pane doesn't jump
        treeSection.style.height = startHeight + 'px';
        treeSection.style.flex = 'none';
        // Prevent child elements from capturing mouse events during drag
        treeSection.style.pointerEvents = 'none';
        if (detailSection) detailSection.style.pointerEvents = 'none';

        let lastHeight = startHeight;

        const onMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientY - startY;
            lastHeight = Math.max(MIN_TREE_HEIGHT, Math.min(availableHeight - MIN_DETAIL_HEIGHT, startHeight + delta));
            treeSection.style.height = lastHeight + 'px';
        };

        const onMouseUp = () => {
            dragging.current = false;
            if (sash) sash.classList.remove('db-explorer__sash--active');
            // Restore pointer events
            treeSection.style.pointerEvents = '';
            if (detailSection) detailSection.style.pointerEvents = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Commit final height to React state
            setTreeHeight(lastHeight);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    const hasDetail = selectedObject.meta !== null;

    return (
        <div className="db-explorer" ref={containerRef}>
            {!connected ? (
                <div className="db-explorer__empty-state">
                    <span className="codicon codicon-database db-explorer__empty-icon" />
                    <p>{localize('sqlgate.dbExplorer.notConnected', 'Not connected to database.')}</p>
                    <components.Button onClick={openConnectionDialog}>{localize('sqlgate.dbExplorer.connectButton', 'Connect')}</components.Button>
                </div>
            ) : (
                <>
                    <div className="db-explorer__connection-bar">
                        <span className="db-explorer__status db-explorer__status--connected" />
                        <span className="db-explorer__connection-text">
                            {form.host}:{form.port}/{form.database}
                        </span>
                        <div className="db-explorer__bar-actions">
                            <button
                                className="db-explorer__icon-btn"
                                title={localize('sqlgate.dbExplorer.connectionSettings', 'Connection Settings')}
                                onClick={openConnectionDialog}
                            >
                                <span className="codicon codicon-gear" />
                            </button>
                            <button
                                className="db-explorer__icon-btn"
                                title={localize('sqlgate.dbExplorer.disconnect', 'Disconnect')}
                                onClick={handleDisconnect}
                            >
                                <span className="codicon codicon-debug-disconnect" />
                            </button>
                        </div>
                    </div>
                    <div
                        className="db-explorer__tree-pane"
                        style={hasDetail && treeHeight != null ? { flex: 'none', height: treeHeight } : hasDetail ? { flex: '1 1 60%' } : undefined}
                    >
                        <components.ScrollBar isShowShadow>
                            <div className="db-explorer__tree-section">
                                <components.Tree
                                    data={MOCK_DB_TREE as any}
                                    expandedKeys={expandedKeys}
                                    activeKey={activeKey}
                                    onSelect={handleTreeSelect}
                                />
                            </div>
                        </components.ScrollBar>
                    </div>
                    {hasDetail && (
                        <>
                            <div className="db-explorer__sash" onMouseDown={handleSashMouseDown} />
                            <div className="db-explorer__detail-pane">
                                <components.ScrollBar isShowShadow>
                                    <div className="db-explorer__detail-content">
                                        <DbObjectDetail meta={selectedObject.meta} name={selectedObject.name} localize={localize} />
                                    </div>
                                </components.ScrollBar>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
