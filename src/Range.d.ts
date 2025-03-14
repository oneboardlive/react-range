import * as React from 'react';
import { IProps, Direction } from './types';
declare class Range extends React.Component<IProps> {
    static defaultProps: {
        step: number;
        direction: Direction;
        rtl: boolean;
        disabled: boolean;
        allowOverlap: boolean;
        min: number;
        max: number;
    };
    trackRef: any;
    thumbRefs: React.RefObject<HTMLElement>[];
    markRefs: React.RefObject<HTMLElement>[];
    numOfMarks: number;
    resizeObserver: any;
    schdOnMouseMove: (e: MouseEvent) => void;
    schdOnTouchMove: (e: TouchEvent) => void;
    schdOnEnd: (e: Event) => void;
    schdOnResize: () => void;
    state: {
        draggedThumbIndex: number;
        thumbZIndexes: number[];
        isChanged: boolean;
        markOffsets: never[];
    };
    constructor(props: IProps);
    componentDidMount(): void;
    componentDidUpdate(prevProps: IProps): void;
    componentWillUnmount(): void;
    getOffsets: () => {
        x: number;
        y: number;
    }[];
    getThumbs: () => unknown[];
    getTargetIndex: (e: Event) => number;
    addTouchEvents: (e: TouchEvent) => void;
    addMouseEvents: (e: MouseEvent) => void;
    onMouseDownTrack: (e: any) => void;
    onResize: () => void;
    onTouchStartTrack: (e: any) => void;
    onMouseOrTouchStart: (e: MouseEvent & TouchEvent) => void;
    onMouseMove: (e: MouseEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onKeyDown: (e: any) => void;
    onKeyUp: (e: any) => void;
    onMove: (clientX: number, clientY: number) => null | undefined;
    normalizeValue: (value: number, index: number) => number;
    onEnd: (e: Event) => void;
    fireOnFinalChange: () => void;
    calculateMarkOffsets: () => void;
    render(): any;
}
export default Range;
