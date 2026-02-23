import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { classNames } from 'mo/client/classNames';
import type { IMenuItemProps, MenuHandler } from 'mo/types';
import { sortByIndex } from 'mo/utils';

import Icon from '../icon';
import variables from './index.scss';

export interface IMenuProps {
    data?: IMenuItemProps[];
    onClick?: MenuHandler;
}

function MenuItemEl({ item, onClick }: { item: IMenuItemProps; onClick?: MenuHandler }) {
    if (item.type === 'divider') {
        return <div className={variables.divider} />;
    }

    return (
        <div
            className={classNames(variables.item, item.disabled && variables.disabled)}
            onClick={(e) => {
                if (item.disabled) return;
                e.stopPropagation();
                onClick?.(item);
            }}
        >
            <span className={variables.icon}>
                <Icon type={item.icon} />
            </span>
            <span className={variables.label}>
                {item.render?.(item) || item.name || item.title}
            </span>
            {item.keybinding && (
                <span className={variables.keybinding}>
                    {item.keybinding.split('').map((char, idx) => (
                        <span key={idx} className={variables.keybindingItem}>
                            {char}
                        </span>
                    ))}
                </span>
            )}
        </div>
    );
}

function SubMenuEl({ item, onClick }: { item: IMenuItemProps; onClick?: MenuHandler }) {
    const [open, setOpen] = useState(false);
    const subMenuRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<number>();

    useLayoutEffect(() => {
        if (!open || !subMenuRef.current || !popupRef.current) return;
        const rect = subMenuRef.current.getBoundingClientRect();
        const popup = popupRef.current;
        popup.style.left = `${rect.right}px`;
        popup.style.top = `${rect.top}px`;

        const popupRect = popup.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        if (popupRect.right > vw) {
            popup.style.left = `${rect.left - popupRect.width}px`;
        }
        if (popupRect.bottom > vh) {
            popup.style.top = `${vh - popupRect.height}px`;
        }
    }, [open]);

    if (!item.children?.length) {
        return <MenuItemEl item={item} onClick={onClick} />;
    }

    const handleOpen = () => {
        if (item.disabled) return;
        clearTimeout(closeTimer.current);
        setOpen(true);
    };

    const handleClose = () => {
        closeTimer.current = window.setTimeout(() => setOpen(false), 0);
    };

    return (
        <div
            ref={subMenuRef}
            className={classNames(variables.subMenu, open && variables.subMenuActive)}
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
        >
            <div className={classNames(variables.item, item.disabled && variables.disabled)}>
                <span className={variables.icon} />
                <span className={variables.label}>
                    {item.render?.(item) || item.name || item.title}
                </span>
                <span className={variables.indicator}>
                    <Icon type="chevron-right" />
                </span>
            </div>
            {open &&
                createPortal(
                    <div
                        ref={popupRef}
                        className={variables.subMenuPopup}
                        onMouseEnter={handleOpen}
                        onMouseLeave={handleClose}
                    >
                        <div className={variables.container}>
                            <MenuList data={item.children} onClick={onClick} />
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

function MenuList({ data, onClick }: { data: IMenuItemProps[]; onClick?: MenuHandler }) {
    const sorted = useMemo(() => data.concat().sort(sortByIndex), [data]);

    return (
        <>
            {sorted.map((item) => {
                if (Array.isArray(item.children) && item.children.length) {
                    return <SubMenuEl key={item.id} item={item} onClick={onClick} />;
                }
                return <MenuItemEl key={item.id} item={item} onClick={onClick} />;
            })}
        </>
    );
}

export default function Menu({ data, onClick }: IMenuProps) {
    if (!Array.isArray(data)) return null;

    return (
        <div
            className={variables.container}
            onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
        >
            <MenuList data={data} onClick={onClick} />
        </div>
    );
}
