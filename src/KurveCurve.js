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

Kurve.Curve = function(player, game, field, config, audioPlayer) {

    var immunityFor = 0;  // Collision-immune frames.
    var immunityTo = [];  // Curves we are immune to.
    var powerUpTimeOutFor = 0;
    var isInvisible = false;
    var positionY = null;
    var positionX = null;
    var nextPositionY = null;
    var nextPositionX = null;
    var controlsReversed = false;
    var controlsReversedTimeout = null;
    var wraparoundEnabled = false;
    var wraparoundTimeout = null;
    var justWrapped = false;
    var thickGapsActive = false;

    var options = {
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
    this.setThickGapsActive = function(active) { thickGapsActive = active; };

    this.isImmuneTo = function(curve) { return immunityFor > 0 && (immunityTo === 'all' || immunityTo.includes(curve)); };
    this.isPowerUpTimeOut = function() { return powerUpTimeOutFor > 0; };
    this.isThickGapsActive = function() { return thickGapsActive; };
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
    this.isControlsReversed = function() { return controlsReversed; };
    this.isWraparoundEnabled = function() { return wraparoundEnabled; };
    this.isJustWrapped = function() { return justWrapped; };
    this.setJustWrapped = function(value) { justWrapped = value; };

    this.applyReverseControls = function(duration) {
        if (controlsReversedTimeout) {
            clearTimeout(controlsReversedTimeout);
        }
        controlsReversed = true;
        controlsReversedTimeout = setTimeout(function() {
            controlsReversed = false;
            controlsReversedTimeout = null;
        }, duration);
    };

    this.applyWraparound = function(duration) {
        if (wraparoundTimeout) {
            clearTimeout(wraparoundTimeout);
        }
        wraparoundEnabled = true;
        wraparoundTimeout = setTimeout(function() {
            wraparoundEnabled = false;
            wraparoundTimeout = null;
        }, duration);
    };

    this.resetHoleCountDown(); //Randomize initial hole interval
};

Kurve.Curve.prototype.drawNextFrame = function() {
    this.moveToNextFrame();
    this.checkForCollision();
    this.drawLine(this.getField());
    this.decrementPowerUpTimeOut();
    
    if ( this.useSuperpower(Kurve.Superpowerconfig.hooks.DRAW_NEXT_FRAME) ) {
        this.getPlayer().getSuperpower().act(Kurve.Superpowerconfig.hooks.DRAW_NEXT_FRAME, this);
    }

    if ( Kurve.Config.Debug.curvePosition ) {
        this.getField().pixiDebug.lineStyle(1, 0x000000);
        this.getField().pixiDebug.drawRect(u.round(this.getPositionX(), 0), u.round(this.getPositionY(), 0), 1, 1);
    }
};

Kurve.Curve.prototype.drawCurrentPosition = function(field) {
    field.drawUntrackedPoint(this.getPositionX(), this.getPositionY(), this.getPlayer().getColor());
};

Kurve.Curve.prototype.drawLine = function(field) {
    this.setIsInvisible(this.getOptions().holeCountDown < 0);

    if ( this.useSuperpower(Kurve.Superpowerconfig.hooks.DRAW_LINE) ) {
        this.getPlayer().getSuperpower().act(Kurve.Superpowerconfig.hooks.DRAW_LINE, this);
    }

    if ( this.isJustWrapped() ) {
        this.setJustWrapped(false);
        return;
    }

    if ( this.isInvisible() ) {
        if (this.getOptions().holeCountDown < 0) {
            field.drawLine('powerUp', this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY(), '', this);
        }

        if ( this.getOptions().holeCountDown < -7 ) this.resetHoleCountDown();
    } else if ( this.isThickGapsActive() ) {
        // Draw thick line for THICK_GAPS superpower (4x thicker)
        var thickLineWidth = 16; // 4x the default line width of 4
        field.pixiCurves.lineStyle(thickLineWidth, u.stringToHex(this.getPlayer().getColor()));
        field.pixiCurves.moveTo(this.getPositionX(), this.getPositionY());
        field.pixiCurves.lineTo(this.getNextPositionX(), this.getNextPositionY());
        
        // Add to drawn pixels for collision detection
        field.addLineToDrawnPixel('curve', this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY(), this.getPlayer().getColor(), this);
    } else {
        field.drawLine('curve', this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY(), this.getPlayer().getColor(), this);
    }

    this.getOptions().holeCountDown--;
};

Kurve.Curve.prototype.moveToNextFrame = function() {
    this.computeNewAngle();

    this.setPositionY(this.getNextPositionY());
    this.setPositionX(this.getNextPositionX());

    this.setNextPositionY(this.getMovedPositionY(this.getOptions().stepLength));
    this.setNextPositionX(this.getMovedPositionX(this.getOptions().stepLength));
};

Kurve.Curve.prototype.getMovedPositionX = function(step) {
    return this.getNextPositionX() + step * Math.cos(this.getOptions().angle);
};

Kurve.Curve.prototype.getMovedPositionY = function(step) {
    return this.getNextPositionY() + step * Math.sin(this.getOptions().angle);
};

Kurve.Curve.prototype.checkForCollision = function() {
    if ( this.useSuperpower(Kurve.Superpowerconfig.hooks.IS_COLLIDED) ) {
        var superpowerIsCollided = this.getPlayer().getSuperpower().act(Kurve.Superpowerconfig.hooks.IS_COLLIDED, this);

        //use === to make sure it is not null, null leads to default collision detection
        if ( superpowerIsCollided === true ) return this.die();
        if ( superpowerIsCollided === false ) return;
    }

    var trace = u.interpolateTwoPoints(this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY());
    var isCollided = false;

    outerLoop:
    for (var pointX in trace) {
        for (var pointY in trace[pointX]) {
            var pointSurroundings = Kurve.Field.getPointSurroundings(pointX, pointY);
            var powerUpPoint = Kurve.Field.getPowerUpPoint(pointX, pointY);

            if ( powerUpPoint !== false && !this.isPowerUpTimeOut() && powerUpPoint.curve !== this ) {
                var usePowerUp = true;

                if ( this.useSuperpower(Kurve.Superpowerconfig.hooks.POWER_UP) ) {
                    usePowerUp = this.getPlayer().getSuperpower().act(Kurve.Superpowerconfig.hooks.POWER_UP, this);
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

                    if (isCollided && !Kurve.Config.Debug.curveTrace) {
                        break outerLoop;
                    }

                    if ( Kurve.Config.Debug.curveTrace ) {
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

Kurve.Curve.prototype.isCollided = function(positionX, positionY) {
    var globalWraparound = Kurve.TokenManager && Kurve.TokenManager.globalWraparoundActive;
    var hasWraparound = this.isWraparoundEnabled() || globalWraparound;
    
    if ( this.getField().isPointOutOfBounds(positionX, positionY) ) {
        if (hasWraparound) {
            this.handleWraparound();
            return false;
        }
        return true;
    }

    var drawnPoint = this.getField().getDrawnPoint(positionX, positionY);

    if ( !drawnPoint ) return false;  // No collision.
    if ( drawnPoint.curve && this.isImmuneTo(drawnPoint.curve) ) return false;
    if ( drawnPoint.curve === this && this.isWithinSelfCollisionTimeout(drawnPoint.frameId) ) return false;

    return true;
};

Kurve.Curve.prototype.isWithinSelfCollisionTimeout = function(frameId) {
    return Kurve.Game.CURRENT_FRAME_ID - frameId < this.getOptions().selfCollisionTimeoutInFrames;
};

Kurve.Curve.prototype.handleWraparound = function() {
    var field = this.getField();
    var nextX = this.getNextPositionX();
    var nextY = this.getNextPositionY();
    var wrapped = false;
    
    if (nextX < 0) {
        this.setNextPositionX(field.width + nextX);
        wrapped = true;
    } else if (nextX > field.width) {
        this.setNextPositionX(nextX - field.width);
        wrapped = true;
    }
    
    if (nextY < 0) {
        this.setNextPositionY(field.height + nextY);
        wrapped = true;
    } else if (nextY > field.height) {
        this.setNextPositionY(nextY - field.height);
        wrapped = true;
    }
    
    if (wrapped) {
        this.setPositionX(this.getNextPositionX());
        this.setPositionY(this.getNextPositionY());
        this.setJustWrapped(true);
    }
};

Kurve.Curve.prototype.die = function() {
    this.getPlayer().getSuperpower().getAudioPlayer().pause('all', {reset: true});
    this.getAudioPlayer().play('curve-crashed', {reset: true});
    this.getGame().notifyDeath(this);
};

Kurve.Curve.prototype.computeNewAngle = function() {
    var turnDirection = this.isControlsReversed() ? -1 : 1;
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
        if (turnDirection === 1) {
            this.incrementAngle();
        } else {
            this.decrementAngle();
        }
    } else if ( isLeft ) {
        if (turnDirection === 1) {
            this.decrementAngle();
        } else {
            this.incrementAngle();
        }
    }
};
    
Kurve.Curve.prototype.setRandomAngle = function() {
    this.setAngle(2 * Math.PI * Math.random());
};

Kurve.Curve.prototype.useSuperpower = function(hook) {
    if ( !this.getPlayer().getSuperpower().usesHook(hook) ) return false;
    if ( this.getPlayer().getSuperpower().isActive() ) return true;
    if ( Kurve.Game.isKeyDown(this.getPlayer().getKeySuperpower()) && this.getPlayer().getSuperpower().getCount() > 0 ) return true;

    return false;
};

Kurve.Curve.prototype.resetHoleCountDown = function() {
    this.getOptions().holeCountDown = this.getOptions().holeInterval + u.round(Math.random() * this.getOptions().holeIntervalRandomness, 0);
};

Kurve.Curve.prototype.setMuted = function (soundKey, muted) {
    this.getAudioPlayer().setMuted(soundKey, muted);
    this.getPlayer().getSuperpower().getAudioPlayer().setMuted(soundKey, muted);
};

Kurve.Curve.prototype.pause = function (soundKey, options) {
    this.getAudioPlayer().pause(soundKey, options);
    this.getPlayer().getSuperpower().getAudioPlayer().pause(soundKey, options);
};