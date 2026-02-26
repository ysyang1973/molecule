import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { classNames } from 'mo/client/classNames';
import { ActionBar, Header, Icon, PanelItem, Prevent } from 'mo/client/components';
import { useConnector } from 'mo/client/hooks';
import type { IPanelController } from 'mo/controllers/panel';
import type { IPanelItem } from 'mo/models/panel';
import { searchById, sortByIndex } from 'mo/utils';

import variables from './index.scss';

export type IPanelProps = IPanelController;

function PanelDropEnd() {
    const { setNodeRef, isOver } = useDroppable({
        id: 'panel-drop-__end__',
        data: { panelId: null },
    });
    return <div ref={setNodeRef} className={classNames(variables.tailZone, isOver && variables.dropTargetEnd)} />;
}

export default function Panel({ onChange, onClose, onToolbarClick, onContextMenu, onDrop }: IPanelProps) {
    const panel = useConnector('panel');

    const currentPane = panel.current ? panel.data.filter((p) => !p.hidden).find(searchById(panel.current)) : undefined;

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const [activePanel, setActivePanel] = useState<IPanelItem | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { panelId } = event.active.data.current as { panelId: IPanelItem['id'] };
        const item = panel.data.find(searchById(panelId));
        setActivePanel(item ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (event.over) {
            const from = event.active.data.current as { panelId: IPanelItem['id'] };
            const to = event.over.data.current as { panelId: IPanelItem['id'] | null };
            onDrop?.(from.panelId, to.panelId);
        }
        setActivePanel(null);
    };

    return (
        <div className={variables.container}>
            <Prevent onContextMenu={(e) => onContextMenu?.({ x: e.pageX, y: e.pageY })}>
                <Header
                    className={variables.header}
                    trackStyle={{ height: 3 }}
                    extra={
                        <Prevent>
                            <ActionBar data={currentPane?.toolbar || []} onClick={onToolbarClick} />
                            <ActionBar data={panel.toolbar} onClick={onToolbarClick} />
                        </Prevent>
                    }
                >
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        {panel.data
                            .filter((p) => !p.hidden)
                            .sort(sortByIndex)
                            .map((p) => (
                                <PanelItem
                                    key={p.id}
                                    data={p}
                                    className={classNames(
                                        variables.item,
                                        panel.current === p.id && variables.active,
                                        p.disabled && variables.disabled
                                    )}
                                    draggingClassName={variables.dragging}
                                    dropTargetClassName={variables.dropTarget}
                                    onClick={() => onChange?.(p.id)}
                                    onClose={onClose}
                                    onContextMenu={onContextMenu}
                                />
                            ))}
                        <PanelDropEnd />
                        <DragOverlay dropAnimation={null}>
                            {activePanel ? (
                                <div className={variables.overlay}>
                                    <Icon type={activePanel.icon} />
                                    <span>{activePanel.name}</span>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </Header>
            </Prevent>
            <div className={variables.content} tabIndex={0}>
                {currentPane?.render?.(currentPane)}
            </div>
        </div>
    );
}
