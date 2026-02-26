import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { IMenuItemProps, MenuHandler, UniqueId } from 'mo/types';
import { searchById } from 'mo/utils';

import Menu from '../menu';
import type { Placement } from './placements';
import './index.scss';

export type ActionType = 'click' | 'hover' | 'contextMenu';

/**
 * If a dropdown item has a clone property, it will trigger corresponding click event
 */
export type DropdownData = IMenuItemProps & { clone?: UniqueId };

export interface IDropdownProps {
    children?: ReactNode;
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    getPopupContainer?: () => HTMLElement;
    overlayClassName?: string;
    trigger?: ActionType;
    data?: DropdownData[];
    disabled?: boolean;
    alignPoint?: boolean;
    stopPropagation?: boolean;
    onClick?: MenuHandler;
    placement?: Placement;
}

function clampToViewport(overlay: HTMLDivElement) {
    const oRect = overlay.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let clamped = false;
    if (oRect.right > vw) {
        overlay.style.left = `${vw - oRect.width + scrollX}px`;
        clamped = true;
    }
    if (oRect.left < 0) {
        overlay.style.left = `${scrollX}px`;
        clamped = true;
    }
    if (oRect.bottom > vh) {
        overlay.style.top = `${vh - oRect.height + scrollY}px`;
        clamped = true;
    }
    if (oRect.top < 0) {
        overlay.style.top = `${scrollY}px`;
        clamped = true;
    }
    if (clamped) {
        overlay.style.transform = '';
    }
}

function positionOverlay(
    overlay: HTMLDivElement,
    triggerEl: HTMLElement,
    placement: Placement,
    alignPoint: boolean,
    mousePos: { x: number; y: number }
) {
    // Reset transform
    overlay.style.transform = '';

    if (alignPoint) {
        overlay.style.left = `${mousePos.x}px`;
        overlay.style.top = `${mousePos.y}px`;
        clampToViewport(overlay);
        return;
    }

    const rect = triggerEl.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    switch (placement) {
        case 'bottomLeft':
        default:
            overlay.style.left = `${rect.left + scrollX}px`;
            overlay.style.top = `${rect.bottom + scrollY + 4}px`;
            break;
        case 'bottom':
            overlay.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
            overlay.style.top = `${rect.bottom + scrollY + 4}px`;
            overlay.style.transform = 'translateX(-50%)';
            break;
        case 'bottomRight':
            overlay.style.left = `${rect.right + scrollX}px`;
            overlay.style.top = `${rect.bottom + scrollY + 4}px`;
            overlay.style.transform = 'translateX(-100%)';
            break;
        case 'topLeft':
            overlay.style.left = `${rect.left + scrollX}px`;
            overlay.style.top = `${rect.top + scrollY - 4}px`;
            overlay.style.transform = 'translateY(-100%)';
            break;
        case 'top':
            overlay.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
            overlay.style.top = `${rect.top + scrollY - 4}px`;
            overlay.style.transform = 'translate(-50%, -100%)';
            break;
        case 'topRight':
            overlay.style.left = `${rect.right + scrollX}px`;
            overlay.style.top = `${rect.top + scrollY - 4}px`;
            overlay.style.transform = 'translate(-100%, -100%)';
            break;
        case 'rightTop':
            overlay.style.left = `${rect.right + scrollX}px`;
            overlay.style.top = `${rect.top + scrollY - 4}px`;
            break;
    }

    clampToViewport(overlay);
}

export default function Dropdown({
    children,
    data,
    alignPoint,
    overlayClassName,
    disabled,
    visible,
    stopPropagation,
    placement = 'bottomLeft',
    trigger = 'click',
    getPopupContainer,
    onVisibleChange,
    onClick,
}: IDropdownProps) {
    const [stateVisible, setVisible] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    const isVisible = visible ?? stateVisible;

    const updateVisible = useCallback(
        (next: boolean) => {
            if (disabled) return;
            onVisibleChange?.(next);
            if (typeof visible !== 'boolean') {
                setVisible(next);
            }
        },
        [disabled, onVisibleChange, visible]
    );

    // Trigger events
    // Use capture phase for click trigger so that child stopPropagation() doesn't block us
    const triggerEvents: Record<string, (e: React.MouseEvent) => void> = {};

    if (trigger === 'click') {
        triggerEvents.onClickCapture = (e: React.MouseEvent) => {
            if (stopPropagation) e.stopPropagation();
            if (alignPoint) mousePos.current = { x: e.clientX, y: e.clientY };
            updateVisible(!isVisible);
        };
    } else if (trigger === 'contextMenu') {
        triggerEvents.onContextMenu = (e: React.MouseEvent) => {
            if (stopPropagation) e.stopPropagation();
            e.preventDefault();
            if (alignPoint) mousePos.current = { x: e.clientX, y: e.clientY };
            updateVisible(!isVisible);
        };
    }

    // Close on outside click
    useEffect(() => {
        if (!isVisible) return;
        const handleOutside = (e: MouseEvent) => {
            if (
                triggerRef.current?.contains(e.target as Node) ||
                overlayRef.current?.contains(e.target as Node)
            ) {
                return;
            }
            // Delay close to allow click events in SubMenu portals to fire first
            setTimeout(() => updateVisible(false), 0);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [isVisible, updateVisible]);

    // Position overlay after render
    useLayoutEffect(() => {
        if (!isVisible || !overlayRef.current || !triggerRef.current) return;
        positionOverlay(overlayRef.current, triggerRef.current, placement, !!alignPoint, mousePos.current);
    }, [isVisible, placement, alignPoint]);

    const handleClick = (item: DropdownData) => {
        if (typeof visible !== 'boolean') {
            setVisible(false);
        }
        const dropdownItem = item.clone ? data?.find(searchById(item.clone)) : item;
        if (!dropdownItem) return;
        onClick?.(dropdownItem);
    };

    if (!data?.length) return children;

    const container = getPopupContainer?.() ?? document.body;

    return (
        <>
            <span ref={triggerRef} {...triggerEvents}>
                {children}
            </span>
            {isVisible &&
                createPortal(
                    <div ref={overlayRef} className={`mo-dropdown ${overlayClassName || ''}`}>
                        <Menu data={data} onClick={handleClick} />
                    </div>,
                    container
                )}
        </>
    );
}
