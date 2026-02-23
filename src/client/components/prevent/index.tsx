import { HTMLAttributes, PropsWithChildren } from 'react';

export default function Prevent({
    children,
    onContextMenu,
    ref,
    ...rest
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }>) {
    return (
        <div
            onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();
                (e.target as HTMLDivElement).focus();
                onContextMenu?.(e);
            }}
            ref={ref}
            {...rest}
        >
            {children}
        </div>
    );
}
