import type { DbObjectMeta } from '../data/dbMockData';
import type { LocalizeFn } from './dbConnectionDialog';

import './dbObjectDetail.css';

const TYPE_LABEL_KEYS: Record<string, { key: string; defaultValue: string }> = {
    table: { key: 'sqlgate.dbObject.table', defaultValue: 'Table' },
    view: { key: 'sqlgate.dbObject.view', defaultValue: 'View' },
    procedure: { key: 'sqlgate.dbObject.procedure', defaultValue: 'Procedure' },
    function: { key: 'sqlgate.dbObject.function', defaultValue: 'Function' },
    index: { key: 'sqlgate.dbObject.index', defaultValue: 'Index' },
    trigger: { key: 'sqlgate.dbObject.trigger', defaultValue: 'Trigger' },
};

const TYPE_ICONS: Record<string, string> = {
    table: 'symbol-class',
    view: 'eye',
    procedure: 'symbol-method',
    function: 'symbol-event',
    index: 'list-tree',
    trigger: 'zap',
};

function TableDetail({ meta, localize }: { meta: DbObjectMeta; localize: LocalizeFn }) {
    if (!meta.columns) return null;
    return (
        <div className="db-object-detail__section">
            <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.columns', 'Columns (${i})', String(meta.columns.length))}</div>
            <table className="db-object-detail__table">
                <thead>
                    <tr>
                        <th>{localize('sqlgate.dbDetail.name', 'Name')}</th>
                        <th>{localize('sqlgate.dbDetail.type', 'Type')}</th>
                        <th>NULL</th>
                        <th>{localize('sqlgate.dbDetail.key', 'Key')}</th>
                        <th>{localize('sqlgate.dbDetail.default', 'Default')}</th>
                        <th>{localize('sqlgate.dbDetail.extra', 'Extra')}</th>
                    </tr>
                </thead>
                <tbody>
                    {meta.columns.map((col) => (
                        <tr key={col.name}>
                            <td>{col.name}</td>
                            <td>{col.type}</td>
                            <td>{col.nullable ? 'YES' : 'NO'}</td>
                            <td>{col.key || '-'}</td>
                            <td>{col.default ?? 'NULL'}</td>
                            <td>{col.extra || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ViewDetail({ meta, localize }: { meta: DbObjectMeta; localize: LocalizeFn }) {
    return (
        <div className="db-object-detail__section">
            <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.viewDefinition', 'View Definition')}</div>
            <pre className="db-object-detail__sql">{meta.definition}</pre>
        </div>
    );
}

function ProcedureDetail({ meta, name, localize }: { meta: DbObjectMeta; name: string; localize: LocalizeFn }) {
    return (
        <>
            {meta.parameters && meta.parameters.length > 0 && (
                <div className="db-object-detail__section">
                    <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.parameters', 'Parameters (${i})', String(meta.parameters.length))}</div>
                    <table className="db-object-detail__table">
                        <thead>
                            <tr>
                                <th>{localize('sqlgate.dbDetail.name', 'Name')}</th>
                                <th>{localize('sqlgate.dbDetail.type', 'Type')}</th>
                                <th>{localize('sqlgate.dbDetail.mode', 'Mode')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meta.parameters.map((p) => (
                                <tr key={p.name}>
                                    <td>{p.name}</td>
                                    <td>{p.type}</td>
                                    <td><span className="db-object-detail__badge">{p.mode}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {meta.body && (
                <div className="db-object-detail__section">
                    <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.body', 'Body')}</div>
                    <pre className="db-object-detail__sql">{`CREATE PROCEDURE ${name}(...)\n${meta.body}`}</pre>
                </div>
            )}
        </>
    );
}

function FunctionDetail({ meta, name, localize }: { meta: DbObjectMeta; name: string; localize: LocalizeFn }) {
    return (
        <>
            <div className="db-object-detail__info-grid">
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.returnType', 'Return Type:')}</span>
                <span className="db-object-detail__info-value">{meta.returnType}</span>
            </div>
            {meta.parameters && meta.parameters.length > 0 && (
                <div className="db-object-detail__section">
                    <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.parameters', 'Parameters (${i})', String(meta.parameters.length))}</div>
                    <table className="db-object-detail__table">
                        <thead>
                            <tr>
                                <th>{localize('sqlgate.dbDetail.name', 'Name')}</th>
                                <th>{localize('sqlgate.dbDetail.type', 'Type')}</th>
                                <th>{localize('sqlgate.dbDetail.mode', 'Mode')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meta.parameters.map((p) => (
                                <tr key={p.name}>
                                    <td>{p.name}</td>
                                    <td>{p.type}</td>
                                    <td><span className="db-object-detail__badge">{p.mode}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {meta.body && (
                <div className="db-object-detail__section">
                    <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.body', 'Body')}</div>
                    <pre className="db-object-detail__sql">{`CREATE FUNCTION ${name}(...)\nRETURNS ${meta.returnType}\n${meta.body}`}</pre>
                </div>
            )}
        </>
    );
}

function IndexDetail({ meta, localize }: { meta: DbObjectMeta; localize: LocalizeFn }) {
    return (
        <div className="db-object-detail__section">
            <div className="db-object-detail__info-grid">
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.indexTable', 'Table:')}</span>
                <span className="db-object-detail__info-value">{meta.indexTable}</span>
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.indexType', 'Index Type:')}</span>
                <span className="db-object-detail__info-value">{meta.indexType}</span>
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.uniqueness', 'Uniqueness:')}</span>
                <span className="db-object-detail__info-value">{meta.isUnique ? 'UNIQUE' : 'NON-UNIQUE'}</span>
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.indexColumns', 'Columns:')}</span>
                <span className="db-object-detail__info-value">{meta.indexColumns?.join(', ')}</span>
            </div>
        </div>
    );
}

function TriggerDetail({ meta, name, localize }: { meta: DbObjectMeta; name: string; localize: LocalizeFn }) {
    return (
        <>
            <div className="db-object-detail__info-grid">
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.timing', 'Timing:')}</span>
                <span className="db-object-detail__info-value">{meta.triggerTiming}</span>
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.event', 'Event:')}</span>
                <span className="db-object-detail__info-value">{meta.triggerEvent}</span>
                <span className="db-object-detail__info-label">{localize('sqlgate.dbDetail.targetTable', 'Target Table:')}</span>
                <span className="db-object-detail__info-value">{meta.triggerTable}</span>
            </div>
            {meta.body && (
                <div className="db-object-detail__section">
                    <div className="db-object-detail__section-title">{localize('sqlgate.dbDetail.body', 'Body')}</div>
                    <pre className="db-object-detail__sql">{`CREATE TRIGGER ${name}\n${meta.triggerTiming} ${meta.triggerEvent} ON ${meta.triggerTable}\nFOR EACH ROW\n${meta.body}`}</pre>
                </div>
            )}
        </>
    );
}

export default function DbObjectDetail({ meta, name, localize }: { meta: DbObjectMeta | null; name: string; localize: LocalizeFn }) {
    if (!meta || !TYPE_LABEL_KEYS[meta.objectType]) {
        return null;
    }

    const icon = TYPE_ICONS[meta.objectType] || 'info';
    const { key, defaultValue } = TYPE_LABEL_KEYS[meta.objectType];
    const label = localize(key, defaultValue);

    return (
        <div className="db-object-detail">
            <div className="db-object-detail__toolbar">
                <span className={`codicon codicon-${icon} db-object-detail__toolbar-icon`} />
                <span className="db-object-detail__toolbar-name">{name}</span>
                <span className="db-object-detail__toolbar-type">({label})</span>
            </div>
            <div className="db-object-detail__content">
                {meta.objectType === 'table' && <TableDetail meta={meta} localize={localize} />}
                {meta.objectType === 'view' && <ViewDetail meta={meta} localize={localize} />}
                {meta.objectType === 'procedure' && <ProcedureDetail meta={meta} name={name} localize={localize} />}
                {meta.objectType === 'function' && <FunctionDetail meta={meta} name={name} localize={localize} />}
                {meta.objectType === 'index' && <IndexDetail meta={meta} localize={localize} />}
                {meta.objectType === 'trigger' && <TriggerDetail meta={meta} name={name} localize={localize} />}
            </div>
        </div>
    );
}
