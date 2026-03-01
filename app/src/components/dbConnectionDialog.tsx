import { createRoot } from 'react-dom/client';
import { useState } from 'react';

import './dbConnectionDialog.css';

export type LocalizeFn = (key: string, defaultValue: string, ...args: string[]) => string;

export interface ConnectionFormData {
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
}

interface DialogOptions {
    initialValues?: Partial<ConnectionFormData>;
    onConnect: (data: ConnectionFormData) => void;
    localize?: LocalizeFn;
}

const DEFAULTS: ConnectionFormData = {
    host: 'localhost',
    port: '3306',
    username: 'root',
    password: '',
    database: 'mydb',
};

const fallbackLocalize: LocalizeFn = (_key, defaultValue) => defaultValue;

function ConnectionDialogContent({ initialValues, onConnect, onClose, localize = fallbackLocalize }: DialogOptions & { onClose: () => void }) {
    const [form, setForm] = useState<ConnectionFormData>({ ...DEFAULTS, ...initialValues });

    const handleChange = (field: keyof ConnectionFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = () => {
        onConnect(form);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className="db-conn-dialog__overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="db-conn-dialog" onKeyDown={handleKeyDown}>
                <div className="db-conn-dialog__title">
                    <span className="codicon codicon-database" />
                    <span>{localize('sqlgate.dbConnection.title', 'DB Connection Settings')}</span>
                </div>
                <div className="db-conn-dialog__body">
                    <div className="db-conn-dialog__row">
                        <div className="db-conn-dialog__field">
                            <label>{localize('sqlgate.dbConnection.host', 'Host')}</label>
                            <input className="db-conn-dialog__input" value={form.host} onChange={handleChange('host')} autoFocus />
                        </div>
                        <div className="db-conn-dialog__field" style={{ maxWidth: 100 }}>
                            <label>{localize('sqlgate.dbConnection.port', 'Port')}</label>
                            <input className="db-conn-dialog__input" value={form.port} onChange={handleChange('port')} />
                        </div>
                    </div>
                    <div className="db-conn-dialog__field">
                        <label>{localize('sqlgate.dbConnection.username', 'Username')}</label>
                        <input className="db-conn-dialog__input" value={form.username} onChange={handleChange('username')} />
                    </div>
                    <div className="db-conn-dialog__field">
                        <label>{localize('sqlgate.dbConnection.password', 'Password')}</label>
                        <input
                            className="db-conn-dialog__input"
                            type="password"
                            value={form.password}
                            onChange={handleChange('password')}
                            placeholder={localize('sqlgate.dbConnection.passwordPlaceholder', 'Enter password')}
                        />
                    </div>
                    <div className="db-conn-dialog__field">
                        <label>{localize('sqlgate.dbConnection.database', 'Database')}</label>
                        <input className="db-conn-dialog__input" value={form.database} onChange={handleChange('database')} />
                    </div>
                </div>
                <div className="db-conn-dialog__footer">
                    <button className="db-conn-dialog__btn db-conn-dialog__btn--secondary" onClick={onClose}>{localize('sqlgate.dbConnection.cancel', 'Cancel')}</button>
                    <button className="db-conn-dialog__btn db-conn-dialog__btn--primary" onClick={handleSubmit}>{localize('sqlgate.dbConnection.connect', 'Connect')}</button>
                </div>
            </div>
        </div>
    );
}

export function showConnectionDialog(options: DialogOptions): void {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    function cleanup() {
        root.unmount();
        container.remove();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            cleanup();
        }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    root.render(
        <ConnectionDialogContent
            {...options}
            onClose={() => {
                document.removeEventListener('keydown', handleKeyDown, true);
                cleanup();
            }}
        />
    );
}
