import type { IMoleculeContext } from '@dtinsight/molecule';

import './queryResults.css';

export const QUERY_RESULTS_PANEL_ID = 'panel.item.queryResults';

const MOCK_COLUMNS = ['id', 'name', 'email', 'created_at'];

const MOCK_ROWS: Record<string, string | number>[] = [
    { id: 1, name: 'John Smith', email: 'john@example.com', created_at: '2024-01-15 09:30:00' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com', created_at: '2024-02-20 14:15:00' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', created_at: '2024-03-10 11:45:00' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', created_at: '2024-04-05 16:20:00' },
    { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', created_at: '2024-05-12 08:00:00' },
];

export default function QueryResults({ context: molecule }: { context: IMoleculeContext }) {
    const localize = molecule.locale.localize.bind(molecule.locale);
    return (
        <div className="query-results">
            <div className="query-results__toolbar">
                <span className="query-results__info">
                    <span>{localize('sqlgate.queryResults.rowsReturned', '${i} rows returned', String(MOCK_ROWS.length))}</span>
                    <span>{localize('sqlgate.queryResults.executionTime', 'Execution time: ${i}s', '0.023')}</span>
                </span>
            </div>
            <div className="query-results__table-wrapper">
                <table className="query-results__table">
                    <thead>
                        <tr>
                            <th className="query-results__row-num">#</th>
                            {MOCK_COLUMNS.map((col) => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_ROWS.map((row, idx) => (
                            <tr key={idx}>
                                <td className="query-results__row-num">{idx + 1}</td>
                                {MOCK_COLUMNS.map((col) => (
                                    <td key={col}>{row[col]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
