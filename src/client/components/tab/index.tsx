import { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { classNames } from 'mo/client/classNames';
import type { ContextMenuHandler, IEditorTab, TabGroup, UniqueId } from 'mo/types';

import Close from '../close';
import Flex from '../flex';
import Icon from '../icon';
import Prevent from '../prevent';
import variables from './index.scss';

export interface ITabProps {
    data: IEditorTab<any>;
    groupId: UniqueId;
    className?: string;
    active?: boolean;
    onContextMenu?: ContextMenuHandler<[tabId: UniqueId, groupId: UniqueId]>;
    onClick?: (tabId: UniqueId, groupId: UniqueId) => void;
    onClose?: (tabId: UniqueId, groupId: UniqueId) => void;
    onRename?: (tabId: UniqueId, groupId: UniqueId, name: string) => void;
}

export default function Tab({
    data,
    groupId,
    className,
    active,
    onContextMenu,
    onClick,
    onClose,
    onRename,
}: ITabProps) {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(String(data.name ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: `tab-drag-${groupId}-${data.id}`,
        data: { tabId: data.id, groupId } satisfies TabGroup,
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `tab-drop-${groupId}-${data.id}`,
        data: { tabId: data.id, groupId } satisfies TabGroup,
    });

    const setRef = (node: HTMLDivElement | null) => {
        setDragRef(node);
        setDropRef(node);
    };

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(String(data.name ?? ''));
        setEditing(true);
    };

    const commitRename = () => {
        setEditing(false);
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== String(data.name ?? '')) {
            onRename?.(data.id, groupId, trimmed);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitRename();
        } else if (e.key === 'Escape') {
            setEditing(false);
        }
    };

    return (
        <Prevent
            ref={setRef}
            className={classNames(
                variables.tab,
                active && variables.active,
                (isDragging || isOver) && variables.dragging,
                className
            )}
            onContextMenu={(e) => onContextMenu?.({ x: e.pageX, y: e.pageY }, data.id, groupId)}
            onClick={() => onClick?.(data.id, groupId)}
            {...attributes}
            {...listeners}
            tabIndex={0}
        >
            <Flex style={{ height: '100%', gap: 4 }}>
                <Icon type={data.icon} />
                {editing ? (
                    <input
                        ref={inputRef}
                        className={variables.renameInput}
                        value={editValue}
                        size={Math.max(1, editValue.length)}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={variables.name} onDoubleClick={handleDoubleClick}>{data.name}</span>
                )}
                <section className={classNames(variables.extra, data.modified && variables.extraActive)}>
                    <Close
                        modified={data.modified}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose?.(data.id, groupId);
                        }}
                    />
                </section>
            </Flex>
        </Prevent>
    );
}
