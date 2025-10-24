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
    var thickLinesMultiplier = 0;
    var thickLinesTimeout = null;
    var squareHeadActive = false;
    var squareHeadPreviousKey = null;
    var squareHeadTimeout = null;

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
    this.setThickGapsActive = function(active) { thickLinesMultiplier = active ? 4 : 1; };

    this.isImmuneTo = function(curve) { return immunityFor > 0 && (immunityTo === 'all' || immunityTo.includes(curve)); };
    this.isPowerUpTimeOut = function() { return powerUpTimeOutFor > 0; };
    this.isThickGapsActive = function() { return thickLinesMultiplier > 1; };
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
    this.getThickLinesMultiplier = function() { return thickLinesMultiplier; };
    this.setThickLinesMultiplier = function(multiplier) { thickLinesMultiplier = multiplier; };

    this.isSquareHeadActive = function() { return squareHeadActive; };
    this.setSquareHeadActive = function(active) { squareHeadActive = active; };
    this.getSquareHeadPreviousKey = function() { return squareHeadPreviousKey; };
    this.setSquareHeadPreviousKey = function(key) { squareHeadPreviousKey = key; };

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

    this.applyThickLines = function(duration) {
        if (thickLinesTimeout) {
            clearTimeout(thickLinesTimeout);
        }
        
        // Stack the effect: add 4 to the current multiplier
        thickLinesMultiplier += 4;
        
        // Set up timeout to reset
        thickLinesTimeout = setTimeout(function() {
            thickLinesMultiplier = 0;
            thickLinesTimeout = null;
        }, duration);
    };

    this.applyRunFaster = function(duration) {
        var self = this;
        var originalStepLength = this.getOptions().stepLength;
        this.getOptions().stepLength = originalStepLength * 2;
        setTimeout(function() {
            self.getOptions().stepLength = originalStepLength;
        }, duration);
    };

    this.applyRunSlower = function(duration) {
        var self = this;
        var originalStepLength = this.getOptions().stepLength;
        this.getOptions().stepLength = originalStepLength / 2;
        setTimeout(function() {
            self.getOptions().stepLength = originalStepLength;
        }, duration);
    };

    this.applySquareHead = function(duration) {
        var self = this;
        var originalDAngle = this.getOptions().dAngle;
        
        // Snap to 90-degree angle
        this.getOptions().angle = (Math.PI / 2) * Math.round(this.getOptions().angle / (Math.PI / 2));
        this.getOptions().dAngle = 0;
        
        this.setSquareHeadActive(true);
        this.setSquareHeadPreviousKey(null);
        
        if (squareHeadTimeout) {
            clearTimeout(squareHeadTimeout);
        }
        
        squareHeadTimeout = setTimeout(function() {
            self.getOptions().dAngle = originalDAngle;
            self.setSquareHeadActive(false);
            self.setSquareHeadPreviousKey(null);
            squareHeadTimeout = null;
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
        // Draw thick line for thick lines superpower (4x thicker per stack)
        var thickLineWidth = 4 * this.getThickLinesMultiplier(); // 4px base * multiplier
        field.pixiCurves.lineStyle(thickLineWidth, u.stringToHex(this.getPlayer().getColor()));
        field.pixiCurves.moveTo(this.getPositionX(), this.getPositionY());
        field.pixiCurves.lineTo(this.getNextPositionX(), this.getNextPositionY());
        
        // Add thick collision boundaries by adding offset lines to collision map
        var thickness = thickLineWidth / 2;
        var angle = this.getOptions().angle;
        var perpendicular = angle + Math.PI / 2;
        
        // Add the center line
        field.addLineToDrawnPixel('curve', this.getPositionX(), this.getPositionY(), this.getNextPositionX(), this.getNextPositionY(), this.getPlayer().getColor(), this);
        
        // Add offset lines perpendicular to the direction of movement to create thickness in collision detection
        for (var offset = 2; offset < thickness; offset += 2) {
            var offsetX1 = this.getPositionX() + Math.cos(perpendicular) * offset;
            var offsetY1 = this.getPositionY() + Math.sin(perpendicular) * offset;
            var offsetX2 = this.getNextPositionX() + Math.cos(perpendicular) * offset;
            var offsetY2 = this.getNextPositionY() + Math.sin(perpendicular) * offset;
            
            field.addLineToDrawnPixel('curve', offsetX1, offsetY1, offsetX2, offsetY2, this.getPlayer().getColor(), this);
            
            var offsetX3 = this.getPositionX() - Math.cos(perpendicular) * offset;
            var offsetY3 = this.getPositionY() - Math.sin(perpendicular) * offset;
            var offsetX4 = this.getNextPositionX() - Math.cos(perpendicular) * offset;
            var offsetY4 = this.getNextPositionY() - Math.sin(perpendicular) * offset;
            
            field.addLineToDrawnPixel('curve', offsetX3, offsetY3, offsetX4, offsetY4, this.getPlayer().getColor(), this);
        }
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
    
    // If thick lines are active, expand trace to include perpendicular offset points
    if (this.isThickGapsActive()) {
        var thickLineWidth = 4 * this.getThickLinesMultiplier();
        var thickness = thickLineWidth / 2;
        var angle = this.getOptions().angle;
        var perpendicular = angle + Math.PI / 2;
        
        // Add offset traces perpendicular to movement direction
        for (var offset = 2; offset < thickness; offset += 2) {
            var offsetTracePos = u.interpolateTwoPoints(
                this.getPositionX() + Math.cos(perpendicular) * offset,
                this.getPositionY() + Math.sin(perpendicular) * offset,
                this.getNextPositionX() + Math.cos(perpendicular) * offset,
                this.getNextPositionY() + Math.sin(perpendicular) * offset
            );
            var offsetTraceNeg = u.interpolateTwoPoints(
                this.getPositionX() - Math.cos(perpendicular) * offset,
                this.getPositionY() - Math.sin(perpendicular) * offset,
                this.getNextPositionX() - Math.cos(perpendicular) * offset,
                this.getNextPositionY() - Math.sin(perpendicular) * offset
            );
            
            // Merge offset traces into main trace
            for (var px in offsetTracePos) {
                if (!trace[px]) trace[px] = {};
                for (var py in offsetTracePos[px]) {
                    trace[px][py] = true;
                }
            }
            for (var px in offsetTraceNeg) {
                if (!trace[px]) trace[px] = {};
                for (var py in offsetTraceNeg[px]) {
                    trace[px][py] = true;
                }
            }
        }
    }
    
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
    
    // Check self-collision with extended timeout for thick lines
    if ( drawnPoint.curve === this ) {
        var timeoutFrames = this.isThickGapsActive() ? 10 : this.getOptions().selfCollisionTimeoutInFrames;
        if ( Kurve.Game.CURRENT_FRAME_ID - drawnPoint.frameId < timeoutFrames ) return false;
    }

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
    
    // Handle square head mode
    if (this.isSquareHeadActive()) {
        var keyPressed = null;
        
        if (isRight) {
            keyPressed = 'right';
        } else if (isLeft) {
            keyPressed = 'left';
        }
        
        // Only rotate if a DIFFERENT key is pressed (key must be released and re-pressed or switched)
        if (keyPressed !== null && this.getSquareHeadPreviousKey() !== keyPressed) {
            if (keyPressed === 'right') {
                if (turnDirection === 1) {
                    this.getOptions().angle += Math.PI / 2;
                } else {
                    this.getOptions().angle -= Math.PI / 2;
                }
            } else if (keyPressed === 'left') {
                if (turnDirection === 1) {
                    this.getOptions().angle -= Math.PI / 2;
                } else {
                    this.getOptions().angle += Math.PI / 2;
                }
            }
        }
        
        this.setSquareHeadPreviousKey(keyPressed);
        return;
    }
    
    // Normal mode
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

Kurve.Curve.prototype.isThickLineCollidingWithToken = function(tokenX, tokenY, tokenRadius) {
    // Check if thick line head collides with token
    var headDistance = Math.sqrt(Math.pow(this.getNextPositionX() - tokenX, 2) + Math.pow(this.getNextPositionY() - tokenY, 2));
    if (headDistance < tokenRadius + 3) {
        return true;
    }
    
    // If thick lines active, also check offset points
    if (this.isThickGapsActive()) {
        var thickLineWidth = 4 * this.getThickLinesMultiplier();
        var thickness = thickLineWidth / 2;
        var angle = this.getOptions().angle;
        var perpendicular = angle + Math.PI / 2;
        
        for (var offset = 2; offset < thickness; offset += 2) {
            // Check positive offset
            var offsetX1 = this.getNextPositionX() + Math.cos(perpendicular) * offset;
            var offsetY1 = this.getNextPositionY() + Math.sin(perpendicular) * offset;
            var dist1 = Math.sqrt(Math.pow(offsetX1 - tokenX, 2) + Math.pow(offsetY1 - tokenY, 2));
            if (dist1 < tokenRadius + 3) {
                return true;
            }
            
            // Check negative offset
            var offsetX2 = this.getNextPositionX() - Math.cos(perpendicular) * offset;
            var offsetY2 = this.getNextPositionY() - Math.sin(perpendicular) * offset;
            var dist2 = Math.sqrt(Math.pow(offsetX2 - tokenX, 2) + Math.pow(offsetY2 - tokenY, 2));
            if (dist2 < tokenRadius + 3) {
                return true;
            }
        }
    }
    
    return false;
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