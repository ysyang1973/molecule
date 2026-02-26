import { useEffect, useMemo, useRef } from 'react';
import useMeasure from 'react-use/esm/useMeasure';

export default function useEditorPos(pos: number[], len: number, split: 'vertical' | 'horizontal' = 'vertical') {
    const [ref, rect] = useMeasure<HTMLDivElement>();
    const literal = split === 'vertical' ? 'width' : 'height';
    const fn = useRef<(sizes: number[]) => void>(() => {});

    const sizes = useMemo(() => {
        if (pos.length && pos.length === len) {
            const total = pos.reduce((a, b) => a + b, 0);
            // Scale proportionally when the total doesn't match the container size
            if (rect[literal] > 0 && total > 0 && Math.abs(total - rect[literal]) > 1) {
                const scale = rect[literal] / total;
                return pos.map((s) => s * scale);
            }
            return pos;
        }
        return new Array(len).fill(rect[literal] / len);
    }, [pos, len, rect[literal]]);

    useEffect(() => {
        if (sizes.length && sizes.length === len) {
            const total = sizes.reduce((acc, cur) => acc + cur);
            if (Math.abs(total - rect[literal]) > 1) {
                const diff = rect[literal] - total;
                const per = diff / len;
                fn.current(sizes.map((size) => size + per));
            }
        }
    }, [rect[literal]]);

    const useResize = (cb: (sizes: number[]) => void) => {
        fn.current = cb;
    };

    return [ref, sizes, useResize] as const;
}
