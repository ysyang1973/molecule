import { type CSSProperties } from 'react';
import { classNames } from 'mo/client/classNames';
import { useHover } from 'mo/client/hooks';

import Prevent from '../../prevent';
import variables from './index.scss';

export interface ISashProps {
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    split?: 'vertical' | 'horizontal';
    dragging?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}

export function Sash({ className, disabled, dragging, style, split = 'vertical', ref: forwardedRef }: ISashProps) {
    const [innerRef, active] = useHover<HTMLElement>();

    return (
        <Prevent
            ref={(container) => {
                innerRef(container);
                if (typeof forwardedRef === 'function') forwardedRef(container);
                else if (forwardedRef != null && typeof forwardedRef === 'object') (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = container;
            }}
            role="Resizer"
            style={style}
            className={classNames(
                variables.container,
                (dragging || active) && variables.hover,
                disabled && variables.disabled,
                variables[split],
                className
            )}
        />
    );
}
