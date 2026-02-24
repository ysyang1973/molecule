import React from 'react';
import { ActionBar, Flex, Prevent, Progress } from 'mo/client/components';
import useConnector from 'mo/client/hooks/useConnector';
import type { ISideBarController } from 'mo/controllers/sidebar';
import { searchById, sortByIndex } from 'mo/utils';

import variables from './index.scss';

export type ISidebarProps = ISideBarController;

const PaneRenderer = React.memo(function PaneRenderer({ render }: { render?: () => React.ReactNode }) {
    return <>{render?.()}</>;
});

export default function Sidebar({ onToolbarClick, onContextMenu }: ISidebarProps) {
    const sidebar = useConnector('sidebar');

    const currentPane = sidebar.data.find(searchById(sidebar.current));

    if (!currentPane) return <div className={variables.container} />;

    const toolbar = (currentPane.toolbar || []).concat().sort(sortByIndex);

    return (
        <Prevent
            className={variables.container}
            onContextMenu={(e) => onContextMenu?.({ x: e.pageX, y: e.pageY }, currentPane)}
        >
            <div className={variables.pane}>
                <Flex className={variables.header} justifyContent="space-between">
                    <div className={variables.title}>
                        <h2 title={typeof currentPane.name === 'string' ? currentPane.name : undefined}>
                            {currentPane.name}
                        </h2>
                    </div>
                    {!!toolbar.length && (
                        <Prevent className={variables.toolbar}>
                            <ActionBar
                                data={toolbar}
                                onClick={(item) => onToolbarClick?.(item, currentPane.id)}
                            />
                        </Prevent>
                    )}
                </Flex>
                <Prevent className={variables.content}>
                    <Progress active={sidebar.loading} />
                    {sidebar.data
                        .filter((p) => p.render)
                        .map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    display: p.id === sidebar.current ? undefined : 'none',
                                    height: '100%',
                                }}
                            >
                                <PaneRenderer render={p.render} />
                            </div>
                        ))}
                </Prevent>
            </div>
        </Prevent>
    );
}
