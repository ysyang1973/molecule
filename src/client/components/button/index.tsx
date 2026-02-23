import { classNames } from 'mo/client/classNames';

import variables from './index.scss';

type BtnSizeType = 'normal' | 'large';
export interface IButtonProps extends React.ComponentProps<'button'> {
    disabled?: boolean;
    size?: BtnSizeType;
    block?: Boolean;
    onClick?(event: React.MouseEvent): void;
}

export default function Button({ className, children, size = 'normal', block, ref, ...custom }: React.PropsWithChildren<IButtonProps>) {
    return (
        <button
            ref={ref}
            className={classNames(
                className,
                variables.container,
                block && variables.block,
                size === 'large' ? variables.large : variables.normal,
                custom.disabled && variables.disabled
            )}
            {...custom}
        >
            {children}
        </button>
    );
}
