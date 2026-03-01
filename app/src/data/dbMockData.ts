import { FileTypes } from '@dtinsight/molecule';

export type DbObjectType =
    | 'database'
    | 'table'
    | 'view'
    | 'procedure'
    | 'function'
    | 'index'
    | 'trigger';

export interface ColumnDef {
    name: string;
    type: string;
    nullable: boolean;
    key: '' | 'PK' | 'FK' | 'UQ';
    default: string | null;
    extra: string;
}

export interface ParamDef {
    name: string;
    type: string;
    mode: 'IN' | 'OUT' | 'INOUT';
}

export interface DbObjectMeta {
    objectType: DbObjectType;
    columns?: ColumnDef[];
    definition?: string;
    parameters?: ParamDef[];
    body?: string;
    returnType?: string;
    indexColumns?: string[];
    indexType?: string;
    isUnique?: boolean;
    indexTable?: string;
    triggerEvent?: string;
    triggerTiming?: string;
    triggerTable?: string;
}

export const MOCK_DB_TREE = [
    {
        id: 'db_mydb',
        name: 'mydb',
        fileType: FileTypes.Folder,
        icon: 'database',
        data: { objectType: 'database' } as DbObjectMeta,
        children: [
            // ===== Tables =====
            {
                id: 'tables',
                name: 'Tables',
                fileType: FileTypes.Folder,
                icon: 'folder',
                children: [
                    {
                        id: 'table_users',
                        name: 'users',
                        fileType: FileTypes.File,
                        icon: 'symbol-class',
                        data: {
                            objectType: 'table',
                            columns: [
                                { name: 'id', type: 'INT', nullable: false, key: 'PK', default: null, extra: 'AUTO_INCREMENT' },
                                { name: 'name', type: 'VARCHAR(100)', nullable: false, key: '', default: null, extra: '' },
                                { name: 'email', type: 'VARCHAR(255)', nullable: false, key: 'UQ', default: null, extra: '' },
                                { name: 'created_at', type: 'DATETIME', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
                            ],
                        } as DbObjectMeta,
                    },
                    {
                        id: 'table_orders',
                        name: 'orders',
                        fileType: FileTypes.File,
                        icon: 'symbol-class',
                        data: {
                            objectType: 'table',
                            columns: [
                                { name: 'id', type: 'INT', nullable: false, key: 'PK', default: null, extra: 'AUTO_INCREMENT' },
                                { name: 'user_id', type: 'INT', nullable: false, key: 'FK', default: null, extra: '' },
                                { name: 'total', type: 'DECIMAL(10,2)', nullable: false, key: '', default: '0.00', extra: '' },
                                { name: 'status', type: 'VARCHAR(20)', nullable: false, key: '', default: "'pending'", extra: '' },
                                { name: 'order_date', type: 'DATETIME', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
                            ],
                        } as DbObjectMeta,
                    },
                    {
                        id: 'table_products',
                        name: 'products',
                        fileType: FileTypes.File,
                        icon: 'symbol-class',
                        data: {
                            objectType: 'table',
                            columns: [
                                { name: 'id', type: 'INT', nullable: false, key: 'PK', default: null, extra: 'AUTO_INCREMENT' },
                                { name: 'name', type: 'VARCHAR(200)', nullable: false, key: '', default: null, extra: '' },
                                { name: 'price', type: 'DECIMAL(10,2)', nullable: false, key: '', default: '0.00', extra: '' },
                                { name: 'stock', type: 'INT', nullable: false, key: '', default: '0', extra: '' },
                            ],
                        } as DbObjectMeta,
                    },
                ],
            },
            // ===== Views =====
            {
                id: 'views',
                name: 'Views',
                fileType: FileTypes.Folder,
                icon: 'folder',
                children: [
                    {
                        id: 'view_active_users',
                        name: 'active_users',
                        fileType: FileTypes.File,
                        icon: 'eye',
                        data: {
                            objectType: 'view',
                            definition: `SELECT u.id, u.name, u.email, u.created_at
FROM users u
WHERE u.id IN (
    SELECT DISTINCT o.user_id
    FROM orders o
    WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
);`,
                        } as DbObjectMeta,
                    },
                    {
                        id: 'view_order_summary',
                        name: 'order_summary',
                        fileType: FileTypes.File,
                        icon: 'eye',
                        data: {
                            objectType: 'view',
                            definition: `SELECT
    u.name AS customer_name,
    COUNT(o.id) AS order_count,
    SUM(o.total) AS total_spent,
    MAX(o.order_date) AS last_order
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;`,
                        } as DbObjectMeta,
                    },
                ],
            },
            // ===== Procedures =====
            {
                id: 'procedures',
                name: 'Procedures',
                fileType: FileTypes.Folder,
                icon: 'folder',
                children: [
                    {
                        id: 'proc_get_user_orders',
                        name: 'sp_get_user_orders',
                        fileType: FileTypes.File,
                        icon: 'symbol-method',
                        data: {
                            objectType: 'procedure',
                            parameters: [
                                { name: 'p_user_id', type: 'INT', mode: 'IN' },
                                { name: 'p_total', type: 'DECIMAL(10,2)', mode: 'OUT' },
                            ],
                            body: `BEGIN
    SELECT o.*, p.name AS product_name
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = p_user_id
    ORDER BY o.order_date DESC;

    SELECT SUM(total) INTO p_total
    FROM orders
    WHERE user_id = p_user_id;
END`,
                        } as DbObjectMeta,
                    },
                    {
                        id: 'proc_update_stock',
                        name: 'sp_update_stock',
                        fileType: FileTypes.File,
                        icon: 'symbol-method',
                        data: {
                            objectType: 'procedure',
                            parameters: [
                                { name: 'p_product_id', type: 'INT', mode: 'IN' },
                                { name: 'p_quantity', type: 'INT', mode: 'IN' },
                            ],
                            body: `BEGIN
    UPDATE products
    SET stock = stock - p_quantity
    WHERE id = p_product_id AND stock >= p_quantity;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock.';
    END IF;
END`,
                        } as DbObjectMeta,
                    },
                ],
            },
            // ===== Functions =====
            {
                id: 'functions',
                name: 'Functions',
                fileType: FileTypes.Folder,
                icon: 'folder',
                children: [
                    {
                        id: 'func_calculate_total',
                        name: 'fn_calculate_total',
                        fileType: FileTypes.File,
                        icon: 'symbol-event',
                        data: {
                            objectType: 'function',
                            parameters: [
                                { name: 'p_order_id', type: 'INT', mode: 'IN' },
                            ],
                            returnType: 'DECIMAL(10,2)',
                            body: `BEGIN
    DECLARE v_total DECIMAL(10,2);
    SELECT SUM(oi.quantity * p.price) INTO v_total
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id;
    RETURN COALESCE(v_total, 0);
END`,
                        } as DbObjectMeta,
                    },
                    {
                        id: 'func_format_date',
                        name: 'fn_format_date',
                        fileType: FileTypes.File,
                        icon: 'symbol-event',
                        data: {
                            objectType: 'function',
                            parameters: [
                                { name: 'p_date', type: 'DATETIME', mode: 'IN' },
                                { name: 'p_format', type: 'VARCHAR(20)', mode: 'IN' },
                            ],
                            returnType: 'VARCHAR(50)',
                            body: `BEGIN
    RETURN DATE_FORMAT(p_date, p_format);
END`,
                        } as DbObjectMeta,
                    },
                ],
            },
            // ===== Indexes =====
            {
                id: 'indexes',
                name: 'Indexes',
                fileType: FileTypes.Folder,
                icon: 'folder',
                children: [
                    {
                        id: 'idx_users_email',
                        name: 'idx_users_email',
                        fileType: FileTypes.File,
                        icon: 'list-tree',
                        data: {
                            objectType: 'index',
                            indexTable: 'users',
                            indexColumns: ['email'],
                            indexType: 'BTREE',
                            isUnique: true,
                        } as DbObjectMeta,
                    },
                    {
                        id: 'idx_orders_user_id',
                        name: 'idx_orders_user_id',
                        fileType: FileTypes.File,
                        icon: 'list-tree',
                        data: {
                            objectType: 'index',
                            indexTable: 'orders',
                            indexColumns: ['user_id'],
                            indexType: 'BTREE',
                            isUnique: false,
                        } as DbObjectMeta,
                    },
                    {
                        id: 'idx_orders_date',
                        name: 'idx_orders_date',
                        fileType: FileTypes.File,
                        icon: 'list-tree',
                        data: {
                            objectType: 'index',
                            indexTable: 'orders',
                            indexColumns: ['order_date'],
                            indexType: 'BTREE',
                            isUnique: false,
                        } as DbObjectMeta,
                    },
                ],
            },
            // ===== Triggers =====
            {
                id: 'triggers',
                name: 'Triggers',
                fileType: FileTypes.Folder,
                icon: 'folder',
                children: [
                    {
                        id: 'trg_orders_after_insert',
                        name: 'trg_orders_after_insert',
                        fileType: FileTypes.File,
                        icon: 'zap',
                        data: {
                            objectType: 'trigger',
                            triggerTiming: 'AFTER',
                            triggerEvent: 'INSERT',
                            triggerTable: 'orders',
                            body: `BEGIN
    UPDATE users
    SET last_order_date = NEW.order_date
    WHERE id = NEW.user_id;
END`,
                        } as DbObjectMeta,
                    },
                    {
                        id: 'trg_products_stock_check',
                        name: 'trg_products_stock_check',
                        fileType: FileTypes.File,
                        icon: 'zap',
                        data: {
                            objectType: 'trigger',
                            triggerTiming: 'BEFORE',
                            triggerEvent: 'UPDATE',
                            triggerTable: 'products',
                            body: `BEGIN
    IF NEW.stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock cannot be less than 0.';
    END IF;
END`,
                        } as DbObjectMeta,
                    },
                ],
            },
        ],
    },
];
