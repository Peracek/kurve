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

import { Superpowerconfig } from './KurveSuperpowerconfig.js';
import { Config } from './KurveConfig.js';
import { Utility } from './KurveUtility.js';

export class Curve {
    constructor(player, game, field, config, audioPlayer) {
        let immunityFor = 0;  // Collision-immune frames.
        let immunityTo = [];  // Curves we are immune to.
        let powerUpTimeOutFor = 0;
        let isInvisible = false;
        let positionY = null;
        let positionX = null;
        let nextPositionY = null;
        let nextPositionX = null;

        let options = {
            stepLength: config.stepLength,
            lineWidth: config.lineWidth,
            angle: 0,
            dAngle: config.dAngle,
            holeInterval: config.holeInterval,
            holeIntervalRandomness: config.holeIntervalRandomness,
            holeCountDown: config.holeInterval,
            selfCollisionTimeoutInFrames: config.selfCollisionTimeoutInFrames
        };

        this.setPosition = function(newPositionX, newPositionY) {
            positionX = nextPositionX = newPositionX;
            positionY = nextPositionY = newPositionY;
        };
        
        this.incrementAngle = function() { options.angle += options.dAngle };
        this.decrementAngle = function() { options.angle -= options.dAngle };
        
        this.setPositionY = function(newPosition) { positionY = newPosition; };
        this.setPositionX = function(newPosition) { positionX = newPosition; };
        this.setNextPositionY = function(newPosition) { nextPositionY = newPosition; };
        this.setNextPositionX = function(newPosition) { nextPositionX = newPosition; };
        this.setAngle = function(newAngle) { options.angle = newAngle; };
        this.setImmunity = function(curves, duration) { immunityTo = curves; immunityFor = duration; };
        this.setPowerUpTimeOut = function(timeOut) { powerUpTimeOutFor = timeOut; };
        this.decrementImmunity = function() { if ( immunityFor > 0 ) immunityFor -= 1; };
        this.decrementPowerUpTimeOut = function() { if ( powerUpTimeOutFor > 0 ) powerUpTimeOutFor -= 1; };
        this.setIsInvisible = function(newIsInvisible) { isInvisible = newIsInvisible; };

        this.isImmuneTo = function(curve) { return immunityFor > 0 && (immunityTo === 'all' || immunityTo.includes(curve)); };
        this.isPowerUpTimeOut = function() { return powerUpTimeOutFor > 0; };
        this.getAudioPlayer = function() { return audioPlayer; };
        this.getPlayer = function() { return player; };
        this.getGame = function() { return game; };
        this.getField = function() { return field; };
        this.getPositionY = function() { return positionY; };
        this.getPositionX = function() { return positionX; };
        this.getNextPositionY = function() { return nextPositionY; };
        this.getNextPositionX = function() { return nextPositionX; };
        this.getOptions = function() { return options; };
        this.isInvisible = function() { return isInvisible; };

        this.resetHoleCountDown(); //Randomize initial hole interval
    }

    drawNextFrame() {
        this.moveToNextFrame();
        this.checkForCollision();
        this.drawLine(this.getField());
        this.decrementPowerUpTimeOut();
        
        if ( this.useSuperpower(Superpowerconfig.hooks.DRAW_NEXT_FRAME) ) {
            this.getPlayer().getSuperpower().act(Superpowerconfig.hooks.DRAW_NEXT_FRAME, this);
        }

        if ( Config.Debug.curvePosition ) {
            this.getField().pixiDebug.lineStyle(1, 0x000000);
            this.getField().pixiDebug.drawRect(Utility.round(this.getPositionX(), 0), Utility.round(this.getPositionY(), 0), 1, 1);
        }
    }

    drawCurrentPosition(field) {
        field.drawUntrackedPoint(this.getPositionX(), this.getPositionY(), this.getPlayer().getColor());
    }

    drawLine(field) {
        this.setIsInvisible(this.getOptions().holeCountDown < 0);

        if ( this.useSuperpower(Superpowerconfig.hooks.DRAW_LINE) ) {
            this.getPlayer().getSuperpower().act(Superpowerconfig.hooks.DRAW_LINE, this);
        }

        if ( this.isInvisible() ) {
            if (this.getOptions().holeCountDown < 0) {
                field.drawLine('powerUp', this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY(), '', this);
            }

            if ( this.getOptions().holeCountDown < -7 ) this.resetHoleCountDown();
        } else {
            field.drawLine('curve', this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY(), this.getPlayer().getColor(), this);
        }

        this.getOptions().holeCountDown--;
    }

    moveToNextFrame() {
        this.computeNewAngle();

        this.setPositionY(this.getNextPositionY());
        this.setPositionX(this.getNextPositionX());

        this.setNextPositionY(this.getMovedPositionY(this.getOptions().stepLength));
        this.setNextPositionX(this.getMovedPositionX(this.getOptions().stepLength));
    }

    getMovedPositionX(step) {
        return this.getNextPositionX() + step * Math.cos(this.getOptions().angle);
    }

    getMovedPositionY(step) {
        return this.getNextPositionY() + step * Math.sin(this.getOptions().angle);
    }

    checkForCollision() {
        if ( this.useSuperpower(Superpowerconfig.hooks.IS_COLLIDED) ) {
            var superpowerIsCollided = this.getPlayer().getSuperpower().act(Superpowerconfig.hooks.IS_COLLIDED, this);

            //use === to make sure it is not null, null leads to default collision detection
            if ( superpowerIsCollided === true ) return this.die();
            if ( superpowerIsCollided === false ) return;
        }

        var trace = Utility.interpolateTwoPoints(this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY());
        var isCollided = false;

        outerLoop:
        for (var pointX in trace) {
            for (var pointY in trace[pointX]) {
                var pointSurroundings = this.getField().getPointSurroundings(pointX, pointY);
                var powerUpPoint = this.getField().getPowerUpPoint(pointX, pointY);

                if ( powerUpPoint !== false && !this.isPowerUpTimeOut() && powerUpPoint.curve !== this ) {
                    var usePowerUp = true;

                    if ( this.useSuperpower(Superpowerconfig.hooks.POWER_UP) ) {
                        usePowerUp = this.getPlayer().getSuperpower().act(Superpowerconfig.hooks.POWER_UP, this);
                    }

                    if (usePowerUp) {
                        this.setPowerUpTimeOut(5);
                        this.getAudioPlayer().play('game-power-up');
                        this.getPlayer().getSuperpower().incrementCount();
                    }
                }

                for (var pointSurroundingX in pointSurroundings) {
                    for (var pointSurroundingY in pointSurroundings[pointSurroundingX]) {
                        if ( this.isCollided(pointSurroundingX, pointSurroundingY) ) {
                            isCollided = true;
                        }

                        if (isCollided && !Config.Debug.curveTrace) {
                            break outerLoop;
                        }

                        if ( Config.Debug.curveTrace ) {
                            this.getField().pixiDebug.lineStyle(1, 0x000000, 0.5);
                            this.getField().pixiDebug.drawRect(pointSurroundingX, pointSurroundingY, 1, 1);
                        }
                    }
                }
            }
        }

        this.decrementImmunity();
        if ( isCollided ) this.die();
    };

    isCollided = function(positionX, positionY) {
        if ( this.getField().isPointOutOfBounds(positionX, positionY) ) return true;

        var drawnPoint = this.getField().getDrawnPoint(positionX, positionY);

        if ( !drawnPoint ) return false;  // No collision.
        if ( drawnPoint.curve && this.isImmuneTo(drawnPoint.curve) ) return false;
        if ( drawnPoint.curve === this && this.isWithinSelfCollisionTimeout(drawnPoint.frameId) ) return false;

        return true;
    };

    isWithinSelfCollisionTimeout = function(frameId) {
        return this.getGame().CURRENT_FRAME_ID - frameId < this.getOptions().selfCollisionTimeoutInFrames;
    };

    die = function() {
        this.getPlayer().getSuperpower().getAudioPlayer().pause('all', {reset: true});
        this.getAudioPlayer().play('curve-crashed', {reset: true});
        this.getGame().notifyDeath(this);
    };

    computeNewAngle = function() {
        var isRight = false;
        var isLeft = false;
        
        if ( this.getPlayer().hasControllerInput() ) {
            isRight = this.getPlayer().isControllerRight();
            isLeft = this.getPlayer().isControllerLeft();
        } else {
            isRight = this.getGame().isKeyDown(this.getPlayer().getKeyRight());
            isLeft = this.getGame().isKeyDown(this.getPlayer().getKeyLeft());
        }
        
        if ( isRight ) {
            this.incrementAngle();
        } else if ( isLeft ) {
            this.decrementAngle();
        }
    };
    
    setRandomAngle = function() {
        this.setAngle(2 * Math.PI * Math.random());
    };

    useSuperpower = function(hook) {
        if ( !this.getPlayer().getSuperpower().usesHook(hook) ) return false;
        if ( this.getPlayer().getSuperpower().isActive() ) return true;
        
        var isSuperpowerPressed = false;
        if ( this.getPlayer().hasControllerInput() ) {
            isSuperpowerPressed = this.getPlayer().isControllerSuperpower();
        } else {
            isSuperpowerPressed = this.getGame().isKeyDown(this.getPlayer().getKeySuperpower());
        }
        
        if ( isSuperpowerPressed && this.getPlayer().getSuperpower().getCount() > 0 ) return true;

        return false;
    };

    resetHoleCountDown = function() {
        this.getOptions().holeCountDown = this.getOptions().holeInterval + Utility.round(Math.random() * this.getOptions().holeIntervalRandomness, 0);
    };

    setMuted = function (soundKey, muted) {
        this.getAudioPlayer().setMuted(soundKey, muted);
        this.getPlayer().getSuperpower().getAudioPlayer().setMuted(soundKey, muted);
    };

    pause = function (soundKey, options) {
        this.getAudioPlayer().pause(soundKey, options);
        this.getPlayer().getSuperpower().getAudioPlayer().pause(soundKey, options);
    };
}