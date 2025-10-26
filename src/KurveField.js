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

import * as PIXI from 'pixi.js';
import { Config } from './KurveConfig.js';
import { Theming } from './KurveTheming.js';
import { Utility } from './KurveUtility.js';
import { Point } from './KurvePoint.js';

// Lazy load Game to avoid circular dependency
let Game = null;

async function getGame() {
    if (!Game) {
        const mod = await import('./KurveGame.js');
        Game = mod.Game;
    }
    return Game;
}

class FieldClass {
    constructor() {
        this.canvas = null;
        this.pixiApp = null;
        this.pixiCurves = null;
        this.pixiDebug = null;
        
        this.width = null;
        this.height = null;
        
        this.drawnPixels = {};
        this.drawnPowerUps = {};
        this.defaultLineWidth = null;
        this.drawnPixelPrecision = null;
    }
    
    init() {
        this.initWindow();
        this.initCanvas();
        this.initPixi();
        this.initDrawing();
        this.initField();

        // Use setTimeout here because the canvas is only about to be displayed and still has width=0 at this point in time
        setTimeout(() => {
            this.resize();
        }, 0);
    }

    initWindow() {
        window.addEventListener('resize', () => {
            getGame().then(GameModule => {
                if (GameModule.isRoundStarted) {
                    return; // Do not allow resize during a round
                }
                this.resize();
            });
        });
    }

    initCanvas() {
        this.canvas = document.getElementById('field');
    }

    initPixi() {
        PIXI.utils.skipHello();
        this.pixiApp = new PIXI.Application({
            view: this.canvas,
            resizeTo: this.canvas.parentElement,
            width: this.canvas.width,
            height: this.canvas.height,
            antialias: true,
            backgroundAlpha: 0,
        });
        this.pixiCurves = new PIXI.Graphics();
        this.pixiField = new PIXI.Graphics();
        this.pixiDebug = new PIXI.Graphics();

        this.pixiApp.stage.addChild(this.pixiCurves);
        this.pixiApp.stage.addChild(this.pixiField);
        this.pixiApp.stage.addChild(this.pixiDebug);
    }
    
    initField() {
        this.canvas = document.getElementById('field');

        this.resize();
    }

    initDrawing() {
        this.defaultLineWidth = Config.Field.defaultLineWidth;
        this.drawnPixelPrecision = Config.Field.drawnPixelPrecision;
    }

    resize() {
        // Fix window width in order to prevent window resize to change field size
        document.body.style.height = window.innerHeight + 'px';
        document.body.style.width = window.innerWidth + 'px';

        this.width = window.innerWidth * Config.Field.width;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.pixiApp.resize();
        this.drawField();
    }

    clearFieldContent() {
        this.drawnPixels = {};
        this.drawnPowerUps = {};

        this.pixiCurves.clear();
        this.pixiDebug.clear();
    }

    drawField() {
        const borderColor = Utility.stringToHex(Theming.getThemedValue('field', 'borderColor'));

        this.pixiField.clear();
        this.pixiField.lineStyle(2, borderColor);
        this.pixiField.drawRect(0, 0, this.width, this.height);
    }

    drawLine(type, fromPointX, fromPointY, toPointX, toPointY, color, curve) {
        if (color === undefined) color = Theming.getThemedValue('field', 'defaultColor');

        if (type === 'curve') {
            this.pixiCurves.lineStyle(this.defaultLineWidth, Utility.stringToHex(color));
            this.pixiCurves.moveTo(fromPointX, fromPointY);
            this.pixiCurves.lineTo(toPointX, toPointY);
        }

        this.addLineToDrawnPixel(type, fromPointX, fromPointY, toPointX, toPointY, color, curve);
    }

    drawUntrackedPoint(pointX, pointY, color) {
        if (color === undefined) color = Theming.getThemedValue('field', 'defaultColor');

        this.pixiCurves.beginFill(Utility.stringToHex(color));
        this.pixiCurves.lineStyle(0);
        this.pixiCurves.drawCircle(pointX, pointY, 2);
        this.pixiCurves.endFill();
    }

    drawPoint(type, pointX, pointY, color, curve) {
        this.drawUntrackedPoint(pointX, pointY, color);
        this.addPointToDrawnPixel(type, pointX, pointY, color, curve);
    }

    clearLine(fromPointX, fromPointY, toPointX, toPointY) {
        const interpolatedPoints = Utility.interpolateTwoPoints(fromPointX, fromPointY, toPointX, toPointY);
        const color = Theming.getThemedValue('field', 'backgroundColor');

        for (let pointX in interpolatedPoints) {
            for (let pointY in interpolatedPoints[pointX]) {
                const pointSurroundings = this.getPointSurroundings(pointX, pointY);

                for (let pointSurroundingX in pointSurroundings) {
                    for (let pointSurroundingY in pointSurroundings[pointSurroundingX]) {
                        const pointSurroundings2 = this.getPointSurroundings(pointSurroundingX, pointSurroundingY);

                        for (let pointSurrounding2X in pointSurroundings2) {
                            for (let pointSurrounding2Y in pointSurroundings2[pointSurrounding2X]) {
                                if (this.drawnPixels[pointSurrounding2X] !== undefined && this.drawnPixels[pointSurrounding2X][pointSurrounding2Y] !== undefined) {
                                    this.drawnPixels[pointSurrounding2X][pointSurrounding2Y] = undefined;

                                    if (Config.Debug.fieldDrawnPixels) {
                                        this.pixiDebug.lineStyle(1, 0xFD379B);
                                        this.pixiDebug.drawRect(pointSurrounding2X, pointSurrounding2Y, 1, 1);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.pixiCurves.lineStyle(this.defaultLineWidth * 2, Utility.stringToHex(color));
        this.pixiCurves.moveTo(fromPointX, fromPointY);
        this.pixiCurves.lineTo(toPointX, toPointY);
    }

    addLineToDrawnPixel(type, fromPointX, fromPointY, toPointX, toPointY, color, curve) {
        const interpolatedPoints = Utility.interpolateTwoPoints(fromPointX, fromPointY, toPointX, toPointY);

        for (let pointX in interpolatedPoints) {
            for (let pointY in interpolatedPoints[pointX]) {
                this.addPointToDrawnPixel(type, pointX, pointY, color, curve);
            }
        }
    }
    
    addPointToDrawnPixel(type, pointX, pointY, color, curve) {
        const pointX0 = Utility.round(pointX, 0);
        const pointY0 = Utility.round(pointY, 0);
        const drawnMap = type === 'powerUp' ? this.drawnPowerUps : this.drawnPixels;

        if (drawnMap[pointX0] === undefined) {
            drawnMap[pointX0] = {};
        }

        drawnMap[pointX0][pointY0] = {
            color: color,
            curve: curve,
            frameId: this.Game.CURRENT_FRAME_ID
        };

        if (Config.Debug.fieldDrawnPixels) {
            if (type === 'curve') {
                this.pixiDebug.lineStyle(1, 0x37FDFC);
            } else {
                this.pixiDebug.lineStyle(1, 0xFDFC37);
            }

            this.pixiDebug.drawRect(pointX0, pointY0, 1, 1);
        }
    }
    
    isPointOutOfBounds(pointX, pointY) {
        return pointX <= 0 || pointY <= 0 || pointX >= this.width || pointY >= this.height;
    }

    isPointDrawn(pointX, pointY) {
        return this.drawnPixels[Utility.round(pointX, 0)] !== undefined &&
               this.drawnPixels[Utility.round(pointX, 0)][Utility.round(pointY, 0)] !== undefined;
    }

    getPowerUpPoint(pointX, pointY) {
        const pointX0 = Utility.round(pointX, 0);
        const pointY0 = Utility.round(pointY, 0);

        if (this.drawnPowerUps[pointX0] !== undefined && this.drawnPowerUps[pointX0][pointY0] !== undefined) {
            return this.drawnPowerUps[pointX0][pointY0];
        } else {
            return false;
        }
    }

    getDrawnPoint(pointX, pointY) {
        const pointX0 = Utility.round(pointX, 0);
        const pointY0 = Utility.round(pointY, 0);

        if (this.drawnPixels[pointX0] !== undefined && this.drawnPixels[pointX0][pointY0] !== undefined) {
            return this.drawnPixels[pointX0][pointY0];
        } else {
            return false;
        }
    }
    
    getRandomPosition(borderPadding) {
        if (borderPadding === undefined) borderPadding = 80;
        
        const posX = borderPadding + Math.round((this.width - 2 * borderPadding) * Math.random());
        const posY = borderPadding + Math.round((this.height - 2 * borderPadding) * Math.random());
        
        return new Point(posX, posY);
    }

    getPointSurroundings(pointX, pointY) {
        const pointX0 = Utility.round(pointX, 0);
        const pointY0 = Utility.round(pointY, 0);
        const pointSurroundings = {};

        Utility.addPointToMap(pointSurroundings, pointX0,     pointY0);
        Utility.addPointToMap(pointSurroundings, pointX0 + 1, pointY0);
        Utility.addPointToMap(pointSurroundings, pointX0 + 1, pointY0 - 1);
        Utility.addPointToMap(pointSurroundings, pointX0,     pointY0 - 1);
        Utility.addPointToMap(pointSurroundings, pointX0 - 1, pointY0 - 1);
        Utility.addPointToMap(pointSurroundings, pointX0 - 1, pointY0);
        Utility.addPointToMap(pointSurroundings, pointX0 - 1, pointY0 + 1);
        Utility.addPointToMap(pointSurroundings, pointX0,     pointY0 + 1);
        Utility.addPointToMap(pointSurroundings, pointX0 + 1, pointY0 + 1);

        return pointSurroundings;
    }
}

// Export singleton instance to maintain backward compatibility
export const Field = new FieldClass();
