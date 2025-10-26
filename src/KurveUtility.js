/**
 *
 * Program:     Kurve
 * Author:      Markus Mächler, marmaechler@gmail.com
 * License:     http://www.gnu.org/licenses/gpl.txt
 * Link:        http://achtungkurve.com
 *
 * Copyright © 2014, 2015 Markus Mächler
 *
 * Kurve is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kurve is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kurve.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

'use strict';

class UtilityElement {
    constructor(element) {
        this.element = element;
    }
}

export const Utility = function(element) {
    if (element instanceof String) {}
    return new UtilityElement(element);
};

Utility.Element = UtilityElement;

Utility.round = function(number, digitsAfterComa) {
    return Math.round(number * Math.pow(10, digitsAfterComa)) / Math.pow(10, digitsAfterComa); 
};

Utility.addClass = function(className, elementId) {
    var element = document.getElementById(elementId);
    if (element === null) return false;

    element.classList.add(className);
};

Utility.removeClass = function(className, elementId) {
    var element = document.getElementById(elementId);
    if (element === null) return false;

    element.classList.remove(className);
};

Utility.setClassName = function(className, elementId) {
    var element = document.getElementById(elementId);
    if (element === null) return false;

    element.className = className;        
};

Utility.hasClass = function(className, elementId) {
    var element = document.getElementById(elementId);
    if (element === null) return false;

    return element.classList.contains(className);
};

Utility.interpolateTwoPoints = function(fromPointX, fromPointY, toPointX, toPointY) {
    var interpolatedPoints = {};
    var dX = toPointX - fromPointX;
    var dY = toPointY - fromPointY;
    var maxD = Math.max(Math.abs(dX), Math.abs(dY), 1);
    var stepX = dX / maxD;
    var stepY = dY / maxD;

    for (var i=0; i < maxD; i++) {
        var posX = fromPointX + i * stepX;
        var posY = fromPointY + i * stepY;

        Utility.addPointToMap(interpolatedPoints, posX, posY);
    }

    return interpolatedPoints;
};

Utility.addPointToMap = function(array, pointX, pointY) {
    var pointX0 = Utility.round(pointX, 0);
    if ( array[pointX0] === undefined ) array[pointX0] = {};

    array[pointX0][Utility.round(pointY, 0)] = true;
};

Utility.stringToHex = function(string) {
    return parseInt(string.substring(1), 16)
};

Utility.merge = function() {
    var base = arguments[0];

    for (var i = 1; i < arguments.length; i++) {

        for (var j in arguments[i]) {
            base[j] = arguments[i][j];
        }
    }

    return base;
};

Utility.isSafari = function () {
    return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
};

Utility.isIE = function() {
    var userAgent = window.navigator.userAgent;

    return userAgent.indexOf('MSIE ') > 0 || userAgent.indexOf('Trident/') > 0;
};

Utility.debounce = function(debouncedFunction, timeout) {
    var timeoutId;

    return function(...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(function () {
            debouncedFunction.apply(this, args);
        }, timeout);
    };
};
