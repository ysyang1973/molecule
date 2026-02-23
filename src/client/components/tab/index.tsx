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
}

export default function Tab({
    data,
    groupId,
    className,
    active,
    onContextMenu,
    onClick,
    onClose,
}: ITabProps) {
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
                <span className={variables.name}>{data.name}</span>
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
