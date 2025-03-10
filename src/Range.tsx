import * as React from 'react';
import {
  getMargin,
  getPaddingAndBorder,
  translateThumbs,
  replaceAt,
  checkBoundaries,
  relativeValue,
  schd,
  normalizeValue,
  checkInitialOverlap,
  voidFn,
  isVertical,
  assertUnreachable,
  isTouchEvent,
  isStepDivisible
} from './utils';
import { IProps, Direction } from './types';

const INCREASE_KEYS = ['ArrowRight', 'ArrowUp', 'k', 'PageUp'];
const DECREASE_KEYS = ['ArrowLeft', 'ArrowDown', 'j', 'PageDown'];

class Range extends React.Component<IProps> {
  static defaultProps = {
    step: 1,
    direction: Direction.Right,
    rtl: false,
    disabled: false,
    allowOverlap: false,
    min: 0,
    max: 100
  };
  trackRef = React.createRef<HTMLElement>();
  thumbRefs: React.RefObject<HTMLElement>[] = [];
  markRefs: React.RefObject<HTMLElement>[] = [];
  numOfMarks: number;
  resizeObserver: any;
  schdOnMouseMove: (e: MouseEvent) => void;
  schdOnTouchMove: (e: TouchEvent) => void;
  schdOnEnd: (e: Event) => void;
  schdOnResize: () => void;

  state = {
    draggedThumbIndex: -1,
    thumbZIndexes: new Array(this.props.values.length).fill(0).map((t, i) => i),
    isChanged: false,
    markOffsets: []
  };

  constructor(props: IProps) {
    super(props);
    this.numOfMarks = (props.max - props.min) / this.props.step;
    this.schdOnMouseMove = schd(this.onMouseMove);
    this.schdOnTouchMove = schd(this.onTouchMove);
    this.schdOnEnd = schd(this.onEnd);
    this.schdOnResize = schd(this.onResize);
    this.thumbRefs = props.values.map(() => React.createRef<HTMLElement>());
    for (let i = 0; i < this.numOfMarks + 1; i++) {
      this.markRefs[i] = React.createRef<HTMLElement>();
    }
    if (!isStepDivisible(props.min, props.max, props.step)) {
      console.warn(
        'The difference of `max` and `min` must be divisible by `step`'
      );
    }
  }

  componentDidMount() {
    const { values, min, step } = this.props;
    this.resizeObserver = (window as any).ResizeObserver
      ? new (window as any).ResizeObserver(this.schdOnResize)
      : {
          observe: () => window.addEventListener('resize', this.schdOnResize),
          unobserve: () =>
            window.removeEventListener('resize', this.schdOnResize)
        };

    document.addEventListener('touchstart', this.onMouseOrTouchStart as any, {
      passive: false
    });
    document.addEventListener('mousedown', this.onMouseOrTouchStart as any, {
      passive: false
    });
    !this.props.allowOverlap && checkInitialOverlap(this.props.values);
    this.props.values.forEach((value) =>
      checkBoundaries(value, this.props.min, this.props.max)
    );
    this.resizeObserver.observe(this.trackRef.current!);
    translateThumbs(this.getThumbs(), this.getOffsets(), this.props.rtl);
    this.calculateMarkOffsets();

    values.forEach((value) => {
      if (!isStepDivisible(min, value, step)) {
        console.warn(
          'The `values` property is in conflict with the current `step`, `min` and `max` properties. Please provide values that are accessible using the min, max an step values'
        );
      }
    });
  }

  componentDidUpdate(prevProps: IProps) {
    translateThumbs(this.getThumbs(), this.getOffsets(), this.props.rtl);
  }

  componentWillUnmount() {
    const options: AddEventListenerOptions = {
      passive: false
    };
    document.removeEventListener(
      'mousedown',
      this.onMouseOrTouchStart as any,
      options
    );
    document.removeEventListener('touchstart', this.onMouseOrTouchStart as any);
    document.removeEventListener('touchend', this.schdOnEnd as any);
    this.resizeObserver.unobserve(this.trackRef.current!);
  }

  getOffsets = () => {
    const { direction, values, min, max } = this.props;
    const trackElement = this.trackRef.current!;
    const trackRect = trackElement.getBoundingClientRect();
    const trackPadding = getPaddingAndBorder(trackElement);
    return this.getThumbs().map((thumb, index) => {
      const thumbOffsets = { x: 0, y: 0 };
      const thumbRect = thumb.getBoundingClientRect();
      const thumbMargins = getMargin(thumb);
      switch (direction) {
        case Direction.Right:
          thumbOffsets.x = (thumbMargins.left + trackPadding.left) * -1;
          thumbOffsets.y =
            ((thumbRect.height - trackRect.height) / 2 + trackPadding.top) * -1;
          thumbOffsets.x +=
            trackRect.width * relativeValue(values[index], min, max) -
            thumbRect.width / 2;
          return thumbOffsets;
        case Direction.Left:
          thumbOffsets.x = (thumbMargins.right + trackPadding.right) * -1;
          thumbOffsets.y =
            ((thumbRect.height - trackRect.height) / 2 + trackPadding.top) * -1;
          thumbOffsets.x +=
            trackRect.width -
            trackRect.width * relativeValue(values[index], min, max) -
            thumbRect.width / 2;
          return thumbOffsets;
        case Direction.Up:
          thumbOffsets.x =
            ((thumbRect.width - trackRect.width) / 2 +
              thumbMargins.left +
              trackPadding.left) *
            -1;
          thumbOffsets.y = -trackPadding.left;
          thumbOffsets.y +=
            trackRect.height -
            trackRect.height * relativeValue(values[index], min, max) -
            thumbRect.height / 2;
          return thumbOffsets;
        case Direction.Down:
          thumbOffsets.x =
            ((thumbRect.width - trackRect.width) / 2 +
              thumbMargins.left +
              trackPadding.left) *
            -1;
          thumbOffsets.y = -trackPadding.left;
          thumbOffsets.y +=
            trackRect.height * relativeValue(values[index], min, max) -
            thumbRect.height / 2;
          return thumbOffsets;
        default:
          return assertUnreachable(direction);
      }
    });
  };

  getThumbs = () => {
    if (this.trackRef && this.trackRef.current) {
      return Array.from(this.trackRef.current.children).filter((el: any) =>
        el.hasAttribute('aria-valuenow')
      );
    }
    console.warn(
      'No thumbs found in the track container. Did you forget to pass & spread the `props` param in renderTrack?'
    );
    return [];
  };

  getTargetIndex = (e: Event) =>
    this.getThumbs().findIndex(
      (child) => child === e.target || child.contains(e.target as Node)
    );

  addTouchEvents = (e: TouchEvent) => {
    document.addEventListener('touchmove', this.schdOnTouchMove, {
      passive: false
    });
    document.addEventListener('touchend', this.schdOnEnd, {
      passive: false
    });
    document.addEventListener('touchcancel', this.schdOnEnd, {
      passive: false
    });
  };

  addMouseEvents = (e: MouseEvent) => {
    document.addEventListener('mousemove', this.schdOnMouseMove);
    document.addEventListener('mouseup', this.schdOnEnd);
  };

  onMouseDownTrack = (e: React.MouseEvent) => {
    // in case there is a single thumb, we want to support
    // moving the thumb to a place where the track is clicked
    if (e.button !== 0 || this.props.values.length > 1) return;
    // this.thumbRefs[0].current?.focus();
    e.persist();
    e.preventDefault();
    this.addMouseEvents(e.nativeEvent);
    this.setState(
      {
        draggedThumbIndex: 0
      },
      () => this.onMove(e.clientX, e.clientY)
    );
  };

  onResize = () => {
    translateThumbs(this.getThumbs(), this.getOffsets(), this.props.rtl);
    this.calculateMarkOffsets();
  };

  onTouchStartTrack = (e: React.TouchEvent) => {
    // in case there is a single thumb, we want to support
    // moving the thumb to a place where the track is clicked
    if (this.props.values.length > 1) return;
    e.persist();
    this.addTouchEvents(e.nativeEvent);
    this.setState(
      {
        draggedThumbIndex: 0
      },
      () => this.onMove(e.touches[0].clientX, e.touches[0].clientY)
    );
  };

  onMouseOrTouchStart = (e: MouseEvent & TouchEvent) => {
    if (this.props.disabled) return;
    const isTouch = isTouchEvent(e);
    if (!isTouch && e.button !== 0) return;
    const index = this.getTargetIndex(e);
    if (index === -1) return;
    if (isTouch) {
      this.addTouchEvents(e);
    } else {
      this.addMouseEvents(e);
    }
    this.setState({
      draggedThumbIndex: index,
      thumbZIndexes: this.state.thumbZIndexes.map((t, i) => {
        if (i === index) {
          return Math.max(...this.state.thumbZIndexes);
        }
        return t <= this.state.thumbZIndexes[index] ? t : t - 1;
      })
    });
  };

  onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    this.onMove(e.clientX, e.clientY);
  };

  onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    this.onMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  onKeyDown = (e: React.KeyboardEvent) => {
    const { values, onChange, step, rtl } = this.props;
    const { isChanged } = this.state;
    const index = this.getTargetIndex(e.nativeEvent);
    const inverter = rtl ? -1 : 1;
    if (index === -1) return;

    if (INCREASE_KEYS.includes(e.key)) {
      e.preventDefault();
      this.setState({
        draggedThumbIndex: index,
        isChanged: true
      });
      onChange(
        replaceAt(
          values,
          index,
          this.normalizeValue(
            values[index] + inverter * (e.key === 'PageUp' ? step * 10 : step),
            index
          )
        )
      );
    } else if (DECREASE_KEYS.includes(e.key)) {
      e.preventDefault();
      this.setState({
        draggedThumbIndex: index,
        isChanged: true
      });
      onChange(
        replaceAt(
          values,
          index,
          this.normalizeValue(
            values[index] -
              inverter * (e.key === 'PageDown' ? step * 10 : step),
            index
          )
        )
      );
    } else if (e.key === 'Tab') {
      this.setState({ draggedThumbIndex: -1 }, () => {
        // If key pressed when thumb was moving, fire onFinalChange
        if (isChanged) {
          this.fireOnFinalChange();
        }
      });
    } else {
      if (isChanged) {
        this.fireOnFinalChange();
      }
    }
  };

  onKeyUp = (e: React.KeyboardEvent) => {
    const { isChanged } = this.state;
    this.setState(
      {
        draggedThumbIndex: -1
      },
      () => {
        if (isChanged) {
          this.fireOnFinalChange();
        }
      }
    );
  };

  onMove = (clientX: number, clientY: number) => {
    const { draggedThumbIndex } = this.state;
    const { direction, min, max, onChange, values, step, rtl } = this.props;
    if (draggedThumbIndex === -1) return null;
    const trackElement = this.trackRef.current!;
    const trackRect = trackElement.getBoundingClientRect();
    const trackLength = isVertical(direction)
      ? trackRect.height
      : trackRect.width;
    let newValue = 0;
    switch (direction) {
      case Direction.Right:
        newValue =
          ((clientX - trackRect.left) / trackLength) * (max - min) + min;
        break;
      case Direction.Left:
        newValue =
          ((trackLength - (clientX - trackRect.left)) / trackLength) *
            (max - min) +
          min;
        break;
      case Direction.Down:
        newValue =
          ((clientY - trackRect.top) / trackLength) * (max - min) + min;
        break;
      case Direction.Up:
        newValue =
          ((trackLength - (clientY - trackRect.top)) / trackLength) *
            (max - min) +
          min;
        break;
      default:
        assertUnreachable(direction);
    }
    // invert for RTL
    if (rtl) {
      newValue = max + min - newValue;
    }
    if (Math.abs(values[draggedThumbIndex] - newValue) >= step / 2) {
      onChange(
        replaceAt(
          values,
          draggedThumbIndex,
          this.normalizeValue(newValue, draggedThumbIndex)
        )
      );
    }
  };

  normalizeValue = (value: number, index: number) => {
    const { min, max, step, allowOverlap, values } = this.props;
    return normalizeValue(value, index, min, max, step, allowOverlap, values);
  };

  onEnd = (e: Event) => {
    e.preventDefault();
    document.removeEventListener('mousemove', this.schdOnMouseMove);
    document.removeEventListener('touchmove', this.schdOnTouchMove);
    document.removeEventListener('mouseup', this.schdOnEnd);
    document.removeEventListener('touchend', this.schdOnEnd);
    document.removeEventListener('touchcancel', this.schdOnEnd);
    if (this.state.draggedThumbIndex === -1) return;
    this.setState({ draggedThumbIndex: -1 }, () => {
      this.fireOnFinalChange();
    });
  };

  fireOnFinalChange = () => {
    this.setState({ isChanged: false });
    const { onFinalChange, values } = this.props;
    if (onFinalChange) {
      onFinalChange(values);
    }
  };

  calculateMarkOffsets = () => {
    if (
      !this.props.renderMark ||
      !this.trackRef ||
      this.trackRef.current === null
    )
      return;
    const elStyles = window.getComputedStyle(this.trackRef.current);
    const trackWidth = parseInt(elStyles.width, 10);
    const trackHeight = parseInt(elStyles.height, 10);
    const paddingLeft = parseInt(elStyles.paddingLeft, 10);
    const paddingTop = parseInt(elStyles.paddingTop, 10);

    const res = [];
    for (let i = 0; i < this.numOfMarks + 1; i++) {
      let markHeight = 9999;
      let markWidth = 9999;
      if (this.markRefs[i].current) {
        const markRect = (this.markRefs[
          i
        ] as any).current.getBoundingClientRect();
        markHeight = markRect.height;
        markWidth = markRect.width;
      }
      if (
        this.props.direction === Direction.Left ||
        this.props.direction === Direction.Right
      ) {
        res.push([
          Math.round(
            (trackWidth / this.numOfMarks) * i + paddingLeft - markWidth / 2
          ),
          -Math.round((markHeight - trackHeight) / 2)
        ]);
      } else {
        res.push([
          Math.round(
            (trackHeight / this.numOfMarks) * i + paddingTop - markHeight / 2
          ),
          -Math.round((markWidth - trackWidth) / 2)
        ]);
      }
    }
    this.setState({ markOffsets: res });
  };

  render() {
    const {
      renderTrack,
      renderThumb,
      renderMark = () => null,
      values,
      min,
      max,
      allowOverlap,
      disabled
    } = this.props;
    const { draggedThumbIndex, thumbZIndexes, markOffsets } = this.state;
    return renderTrack({
      props: {
        style: {
          // creates stacking context that prevents z-index applied to thumbs
          // interfere with other elements
          transform: 'scale(1)',
          cursor:
            draggedThumbIndex > -1
              ? 'grabbing'
              : values.length === 1 && !disabled
              ? 'pointer'
              : 'inherit'
        },
        onMouseDown: disabled ? voidFn : this.onMouseDownTrack,
        onTouchStart: disabled ? voidFn : this.onTouchStartTrack,
        ref: this.trackRef
      },
      isDragged: this.state.draggedThumbIndex > -1,
      disabled,
      children: [
        ...markOffsets.map((offset, index) =>
          renderMark({
            props: {
              style:
                this.props.direction === Direction.Left ||
                this.props.direction === Direction.Right
                  ? {
                      position: 'absolute',
                      left: `${offset[0]}px`,
                      marginTop: `${offset[1]}px`
                    }
                  : {
                      position: 'absolute',
                      top: `${offset[0]}px`,
                      marginLeft: `${offset[1]}px`
                    },
              key: `mark${index}`,
              ref: this.markRefs[index]
            },
            index
          })
        ),
        ...values.map((value, index) => {
          const isDragged = this.state.draggedThumbIndex === index;
          return renderThumb({
            index,
            value,
            isDragged,
            props: {
              style: {
                position: 'absolute',
                zIndex: thumbZIndexes[index],
                cursor: disabled ? 'inherit' : isDragged ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              } as React.CSSProperties,
              key: index,
              tabIndex: disabled ? undefined : 0,
              'aria-valuemax': allowOverlap ? max : values[index + 1] || max,
              'aria-valuemin': allowOverlap ? min : values[index - 1] || min,
              'aria-valuenow': value,
              draggable: false,
              ref: this.thumbRefs[index],
              role: 'slider',
              onKeyDown: disabled ? voidFn : this.onKeyDown,
              onKeyUp: disabled ? voidFn : this.onKeyUp
            }
          });
        })
      ]
    });
  }
}

export default Range;
