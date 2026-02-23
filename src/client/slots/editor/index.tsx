import { useMemo } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragOverEvent, type DragEndEvent } from '@dnd-kit/core';
import { Progress, Split, Welcome } from 'mo/client/components';
import { useConnector, useEditorPos, useSettings } from 'mo/client/hooks';
import type { IEditorController } from 'mo/controllers/editor';
import type { TabGroup } from 'mo/types';

import Group from '../group';
import variables from './index.scss';

export type IEditorProps = IEditorController;

export default function Editor({
    onMount,
    onModelMount,
    onDiffEditorMount,
    onDiffEditorModelMount,
    onSelectTab,
    onPaneSizeChange,
    onContextMenu,
    onToolbarClick,
    onCloseTab,
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
}: IEditorProps) {
    const editor = useConnector('editor');
    const layout = useConnector('layout');
    const settings = useSettings();

    const { groups = [], current, entry = <Welcome />, options: editorOptions, toolbar, loading } = editor;

    const options = useMemo(
        () => ({
            ...settings.editor,
            ...editorOptions,
        }),
        [editorOptions, settings.editor]
    );

    const [ref, sizes, useRectResize] = useEditorPos(layout.groupSplitPos, groups.length, layout.editorDirection);

    useRectResize((data) => onPaneSizeChange?.(data));

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as TabGroup;
        onDragStart?.(data.tabId, data.groupId);
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (!event.over) return;
        const from = event.active.data.current as TabGroup;
        const to = event.over.data.current as TabGroup;
        onDragOver?.(from, to);
        onDragEnter?.(from, to);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const from = event.active.data.current as TabGroup;
        onDragEnd?.(from.tabId, from.groupId);
        if (event.over) {
            const to = event.over.data.current as TabGroup;
            onDrop?.(from, to);
        }
        onDragLeave?.(from, { tabId: from.tabId, groupId: from.groupId });
    };

    const renderGroups = () => {
        return (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <Split ref={ref} sizes={sizes} split={layout.editorDirection} onChange={onPaneSizeChange}>
                    {groups.map((g) => (
                        <Split.Pane key={g.id} minSize={220}>
                            <Group
                                group={g}
                                toolbar={toolbar}
                                options={options}
                                onMount={onMount}
                                onModelMount={onModelMount}
                                onDiffEditorMount={onDiffEditorMount}
                                onDiffEditorModelMount={onDiffEditorModelMount}
                                onSelectTab={onSelectTab}
                                onContextMenu={onContextMenu}
                                onToolbarClick={onToolbarClick}
                                onCloseTab={onCloseTab}
                            />
                        </Split.Pane>
                    ))}
                </Split>
            </DndContext>
        );
    };

    return (
        <div className={variables.container}>
            <Progress active={loading} />
            {current ? renderGroups() : entry}
        </div>
    );
}
