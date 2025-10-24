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

Kurve.Token = function(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = Kurve.Config.Token.radius;
    this.active = true;
    this.pulsePhase = Math.random() * Math.PI * 2;
};

Kurve.Token.prototype.checkCollision = function(curve) {
    if (!this.active) return false;
    
    var dx = this.x - curve.getPositionX();
    var dy = this.y - curve.getPositionY();
    var distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < this.radius + 3;
};

Kurve.TokenManager = {
    
    tokens: [],
    spawnTimer: 0,
    nextSpawnTime: 0,
    globalWraparoundActive: false,
    globalWraparoundTimeout: null,
    pixiTokens: null,
    
    enabledTypes: [
        Kurve.Superpowerconfig.types.REVERSE_CONTROLS,
        Kurve.Superpowerconfig.types.PLAYER_WRAPAROUND,
        Kurve.Superpowerconfig.types.GLOBAL_WRAPAROUND
    ],
    
    init: function() {
        this.tokens = [];
        this.spawnTimer = 0;
        this.nextSpawnTime = this.getRandomSpawnTime();
        this.globalWraparoundActive = false;
        this.globalWraparoundTimeout = null;
        
        if (this.pixiTokens) {
            this.pixiTokens.clear();
        }
    },
    
    getRandomSpawnTime: function() {
        var min = Kurve.Config.Token.spawnIntervalMin;
        var max = Kurve.Config.Token.spawnIntervalMax;
        return min + Math.random() * (max - min);
    },
    
    getRandomDuration: function() {
        var min = Kurve.Config.Token.effectDurationMin;
        var max = Kurve.Config.Token.effectDurationMax;
        return min + Math.random() * (max - min);
    },
    
    update: function(deltaTime) {
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.nextSpawnTime) {
            this.spawnToken();
            this.spawnTimer = 0;
            this.nextSpawnTime = this.getRandomSpawnTime();
        }
        
        this.tokens = this.tokens.filter(function(token) { return token.active; });
    },
    
    spawnToken: function() {
        var margin = 50;
        var field = Kurve.Field;
        var x = margin + Math.random() * (field.width - margin * 2);
        var y = margin + Math.random() * (field.height - margin * 2);
        
        var type = this.enabledTypes[Math.floor(Math.random() * this.enabledTypes.length)];
        var tokenType = Kurve.Superpowerconfig[type];
        
        var token = new Kurve.Token(x, y, tokenType);
        this.tokens.push(token);
    },
    
    checkCollisions: function(runningCurves) {
        for (var playerId in runningCurves) {
            var curves = runningCurves[playerId];
            
            for (var i = 0; i < curves.length; i++) {
                var curve = curves[i];
                
                for (var j = 0; j < this.tokens.length; j++) {
                    var token = this.tokens[j];
                    
                    if (token.checkCollision(curve)) {
                        this.applyTokenEffect(token, curve);
                        token.active = false;
                    }
                }
            }
        }
    },
    
    applyTokenEffect: function(token, curve) {
        var duration = this.getRandomDuration();
        
        if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.REVERSE_CONTROLS]) {
            curve.applyReverseControls(duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.PLAYER_WRAPAROUND]) {
            curve.applyWraparound(duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.GLOBAL_WRAPAROUND]) {
            this.applyGlobalWraparound(duration);
        }
    },
    
    applyGlobalWraparound: function(duration) {
        if (this.globalWraparoundTimeout) {
            clearTimeout(this.globalWraparoundTimeout);
        }
        
        this.globalWraparoundActive = true;
        this.globalWraparoundTimeout = setTimeout(function() {
            this.globalWraparoundActive = false;
            this.globalWraparoundTimeout = null;
        }.bind(this), duration);
    },
    
    draw: function(pixiTokens) {
        if (!pixiTokens) return;
        
        this.pixiTokens = pixiTokens;
        pixiTokens.clear();
        
        for (var i = 0; i < this.tokens.length; i++) {
            var token = this.tokens[i];
            if (!token.active) continue;
            
            var colorHex = u.stringToHex(token.type.color);
            
            pixiTokens.lineStyle(3, colorHex);
            pixiTokens.drawCircle(token.x, token.y, token.radius);
        }
    },
    
    reset: function() {
        this.tokens = [];
        this.spawnTimer = 0;
        this.nextSpawnTime = this.getRandomSpawnTime();
        
        if (this.globalWraparoundTimeout) {
            clearTimeout(this.globalWraparoundTimeout);
        }
        this.globalWraparoundActive = false;
        this.globalWraparoundTimeout = null;
        
        if (this.pixiTokens) {
            this.pixiTokens.clear();
        }
    }
    
};
