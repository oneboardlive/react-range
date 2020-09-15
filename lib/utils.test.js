"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var types_1 = require("./types");
describe('normalizeValue', function () {
    test('basic', function () {
        expect(utils_1.normalizeValue(51, 0, 0, 100, 1, false, [50])).toBe(51);
        expect(utils_1.normalizeValue(51.2, 0, 0, 100, 1, false, [50])).toBe(51);
        expect(utils_1.normalizeValue(50.8, 0, 0, 100, 1, false, [50])).toBe(51);
        expect(utils_1.normalizeValue(12.8, 0, 5, 95, 5, false, [55])).toBe(15);
    });
    test('negative', function () {
        expect(utils_1.normalizeValue(-51, 0, -100, 0, 1, false, [-50])).toBe(-51);
        expect(utils_1.normalizeValue(-51.2, 0, -100, 0, 1, false, [-50])).toBe(-51);
        expect(utils_1.normalizeValue(-50.8, 0, -100, 0, 1, false, [-50])).toBe(-51);
    });
    test('negative and positive', function () {
        expect(utils_1.normalizeValue(14.8, 0, -100, 100, 10, false, [0])).toBe(10);
        expect(utils_1.normalizeValue(15, 0, -100, 100, 10, false, [0])).toBe(20);
        expect(utils_1.normalizeValue(15.8, 0, -100, 100, 10, false, [0])).toBe(20);
        expect(utils_1.normalizeValue(-14.8, 0, -100, 100, 10, false, [0])).toBe(-10);
        expect(utils_1.normalizeValue(-15, 0, -100, 100, 10, false, [0])).toBe(-10);
        expect(utils_1.normalizeValue(-15.8, 0, -100, 100, 10, false, [0])).toBe(-20);
    });
    test('decimal step', function () {
        expect(utils_1.normalizeValue(50.009, 0, 0, 100, 0.01, false, [50])).toBe(50.01);
        expect(utils_1.normalizeValue(50.004, 0, 0, 100, 0.01, false, [50])).toBe(50);
        expect(utils_1.normalizeValue(50.009, 0, 0, 100, 0.01, false, [50])).toBe(50.01);
    });
    test('min and max exceeded', function () {
        expect(utils_1.normalizeValue(120, 0, 0, 100, 1, false, [50])).toBe(100);
        expect(utils_1.normalizeValue(-10, 0, 0, 100, 1, false, [50])).toBe(0);
    });
    test('overlaps', function () {
        expect(utils_1.normalizeValue(80, 0, 0, 100, 1, false, [50, 70])).toBe(70);
        expect(utils_1.normalizeValue(40, 1, 0, 100, 1, false, [50, 70])).toBe(50);
        expect(utils_1.normalizeValue(80, 0, 0, 100, 1, true, [50, 70])).toBe(80);
        expect(utils_1.normalizeValue(40, 1, 0, 100, 1, true, [50, 70])).toBe(40);
    });
});
test('relativeValue', function () {
    expect(utils_1.relativeValue(50, 0, 100)).toBe(0.5);
    expect(utils_1.relativeValue(0, 0, 100)).toBe(0);
    expect(utils_1.relativeValue(100, 0, 100)).toBe(1);
    expect(utils_1.relativeValue(60, 10, 110)).toBe(0.5);
    expect(utils_1.relativeValue(50, 10, 110)).toBe(0.4);
    expect(utils_1.relativeValue(0, -10, 10)).toBe(0.5);
    expect(utils_1.relativeValue(-40, -100, 0)).toBe(0.6);
});
test('isVertical', function () {
    expect(utils_1.isVertical(types_1.Direction.Up)).toBeTruthy();
    expect(utils_1.isVertical(types_1.Direction.Down)).toBeTruthy();
    expect(utils_1.isVertical(types_1.Direction.Left)).toBeFalsy();
    expect(utils_1.isVertical(types_1.Direction.Right)).toBeFalsy();
});
test('isStepDivisible', function () {
    expect(utils_1.isStepDivisible(0, 1, 0.1)).toEqual(true);
    expect(utils_1.isStepDivisible(0, 100, 0.1)).toEqual(true);
    expect(utils_1.isStepDivisible(0, 10, 1)).toEqual(true);
    expect(utils_1.isStepDivisible(0, 10, 10)).toEqual(true);
    expect(utils_1.isStepDivisible(0, 10, 2.5)).toEqual(true);
    expect(utils_1.isStepDivisible(10, 20, 2.5)).toEqual(true);
    expect(utils_1.isStepDivisible(10, 20, 5)).toEqual(true);
    expect(utils_1.isStepDivisible(0, 1, 0.3)).toEqual(false);
    expect(utils_1.isStepDivisible(0, 35, 6)).toEqual(false);
    expect(utils_1.isStepDivisible(0, 10, 20)).toEqual(false);
    expect(utils_1.isStepDivisible(0, 10, 0)).toEqual(false);
});
test('checkBoundaries', function () {
    expect(function () { return utils_1.checkBoundaries(-10, 0, 100); }).toThrow(new RangeError('value (-10) is smaller than min (0)'));
    expect(function () { return utils_1.checkBoundaries(110, 0, 100); }).toThrow(new RangeError('value (110) is bigger than max (100)'));
    expect(function () { return utils_1.checkBoundaries(0, 200, 100); }).toThrow(new RangeError('min (200) is equal/bigger than max (100)'));
    expect(function () { return utils_1.checkBoundaries(50, 0, 100); }).not.toThrow();
    expect(function () { return utils_1.checkBoundaries(-50, -100, 0); }).not.toThrow();
});
test('checkInitialOverlap', function () {
    expect(function () { return utils_1.checkInitialOverlap([0, 10, 5]); }).toThrow(new RangeError('values={[0,10,5]} needs to be sorted when allowOverlap={false}'));
    expect(function () { return utils_1.checkInitialOverlap([-10, 0, -5]); }).toThrow(new RangeError('values={[-10,0,-5]} needs to be sorted when allowOverlap={false}'));
    expect(function () { return utils_1.checkInitialOverlap([0, 5, 10]); }).not.toThrow();
    expect(function () { return utils_1.checkInitialOverlap([-10, -5, 0]); }).not.toThrow();
});
test('replaceAt', function () {
    expect(utils_1.replaceAt([0, 1, 2], 0, 10)).toEqual([10, 1, 2]);
    expect(utils_1.replaceAt([0, 1, 2], 2, 10)).toEqual([0, 1, 10]);
});
test('getTrackBackground', function () {
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 0,
        max: 100
    })).toBe('linear-gradient(to right, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 20,
        max: 120
    })).toBe('linear-gradient(to right, #aaa 0%, #aaa 20%, #bbb 20%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [-40],
        colors: ['#aaa', '#bbb'],
        min: -100,
        max: 0
    })).toBe('linear-gradient(to right, #aaa 0%, #aaa 60%, #bbb 60%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [40, 70],
        colors: ['#aaa', '#bbb', '#ccc'],
        min: 0,
        max: 100
    })).toBe('linear-gradient(to right, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 70%, #ccc 70%, #ccc 100%)');
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 0,
        max: 100,
        direction: types_1.Direction.Left
    })).toBe('linear-gradient(to left, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 0,
        max: 100,
        direction: types_1.Direction.Up
    })).toBe('linear-gradient(to top, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 0,
        max: 100,
        direction: types_1.Direction.Down
    })).toBe('linear-gradient(to bottom, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 0,
        max: 100,
        direction: types_1.Direction.Right,
        rtl: true
    })).toBe('linear-gradient(to left, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 100%)');
    expect(utils_1.getTrackBackground({
        values: [40],
        colors: ['#aaa', '#bbb'],
        min: 0,
        max: 100,
        direction: types_1.Direction.Left,
        rtl: true
    })).toBe('linear-gradient(to right, #aaa 0%, #aaa 40%, #bbb 40%, #bbb 100%)');
});
test('getStepDecimals', function () {
    expect(utils_1.getStepDecimals(1)).toBe(0);
    expect(utils_1.getStepDecimals(1.0)).toBe(0);
    expect(utils_1.getStepDecimals(1.1)).toBe(1);
    expect(utils_1.getStepDecimals(1.5)).toBe(1);
    expect(utils_1.getStepDecimals(1.55)).toBe(2);
    expect(utils_1.getStepDecimals(1.2345)).toBe(4);
});
