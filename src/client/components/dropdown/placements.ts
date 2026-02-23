const placements = {
    topLeft: 'topLeft',
    top: 'top',
    topRight: 'topRight',
    bottomLeft: 'bottomLeft',
    bottom: 'bottom',
    bottomRight: 'bottomRight',
    rightTop: 'rightTop',
} as const;

export type Placement = keyof typeof placements;

export default placements;
