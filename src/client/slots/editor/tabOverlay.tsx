import { Icon } from 'mo/client/components';
import type { IEditorTab } from 'mo/types';

import variables from './index.scss';

export default function TabOverlay({ data }: { data: IEditorTab<any> }) {
    return (
        <div className={variables.overlay}>
            <Icon type={data.icon} />
            <span>{data.name}</span>
        </div>
    );
}
