import { useDraggable, useDroppable } from '@dnd-kit/core';
import type React from 'react';
import { ContextMenuHandler } from 'mo/types';
import { TreeNodeModel } from 'mo/utils/tree';

import Prevent from '../prevent';
import variables from './index.scss';

type ITreeNodeItemProps = TreeNodeModel<any>;

export interface ITreeNodeProps {
    data: ITreeNodeItemProps;
    indent: number;
    className?: string;
    draggable?: boolean;
    renderIcon: () => React.JSX.Element | null;
    renderTitle: () => React.ReactNode;
    renderIndent: () => React.JSX.Element;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
    onContextMenu?: ContextMenuHandler<[treeNode: ITreeNodeItemProps]>;
}

export default ({
    data,
    indent,
    className,
    draggable,
    renderIcon,
    renderTitle,
    renderIndent,
    onClick,
    onKeyDown,
    onContextMenu,
}: ITreeNodeProps) => {
    const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
        id: `drag-${data.id}`,
        data,
        disabled: !draggable,
    });

    const { setNodeRef: setDropRef } = useDroppable({
        id: `drop-${data.id}`,
        data,
    });

    const setRef = (node: HTMLDivElement | null) => {
        setDragRef(node);
        setDropRef(node);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onKeyDown?.(e);
    };

    // calculate key automatically via parent path and self id
    const nodeKey = `${indent ? indent + '_' : ''}${data.id}`;

    const title = renderTitle();

    return (
        <Prevent
            ref={setRef}
            data-indent={indent}
            data-key={data.id}
            data-id={`mo_treeNode_${nodeKey}`}
            className={className}
            title={typeof title === 'string' ? title : undefined}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => onContextMenu?.({ x: e.pageX, y: e.pageY }, data)}
            {...attributes}
            {...listeners}
            tabIndex={0}
        >
            {renderIndent()}
            {renderIcon()}
            <div className={variables.title}>{title}</div>
        </Prevent>
    );
};
