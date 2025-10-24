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
        Kurve.Superpowerconfig.types.GLOBAL_WRAPAROUND,
        Kurve.Superpowerconfig.types.THICK_LINES,
        Kurve.Superpowerconfig.types.JUMP_WEAPON,
        Kurve.Superpowerconfig.types.VERTICAL_BAR_WEAPON,
        Kurve.Superpowerconfig.types.HYDRA_WEAPON,
        Kurve.Superpowerconfig.types.RUN_FASTER_TOKEN,
        Kurve.Superpowerconfig.types.RUN_SLOWER_TOKEN,
        Kurve.Superpowerconfig.types.SQUARE_HEAD_TOKEN
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
        
        if (Kurve.Config.Debug.DEBUG_FAST_TOKENS) {
            min = 500;  // 0.5 seconds
            max = 1000; // 1 second
        }
        
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
                    
                    var hasCollision = false;
                    
                    // Check for thick line collision first
                    if (curve.isThickGapsActive()) {
                        hasCollision = curve.isThickLineCollidingWithToken(token.x, token.y, token.radius);
                    } else {
                        // Standard collision check
                        hasCollision = token.checkCollision(curve);
                    }
                    
                    if (hasCollision) {
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
            // Apply to OTHER players only
            this.applyEffectToOthers(curve, 'applyReverseControls', duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.PLAYER_WRAPAROUND]) {
            curve.applyWraparound(duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.GLOBAL_WRAPAROUND]) {
            this.applyGlobalWraparound(duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.THICK_LINES]) {
            // Apply to OTHER players only
            this.applyEffectToOthers(curve, 'applyThickLines', duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.RUN_FASTER_TOKEN]) {
            // Apply to collector only
            curve.applyRunFaster(duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.RUN_SLOWER_TOKEN]) {
            // Apply to OTHER players only
            this.applyEffectToOthers(curve, 'applyRunSlower', duration);
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.SQUARE_HEAD_TOKEN]) {
            // Apply to collector only
            curve.applySquareHead(duration);
        } else if (token.type.isWeapon) {
            // Handle weapon tokens
            this.applyWeapon(token, curve);
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
    
    applyEffectToOthers: function(collectorCurve, methodName, duration) {
        // Apply effect to all curves EXCEPT the collector
        var collectorPlayerId = collectorCurve.getPlayer().getId();
        
        for (var playerId in Kurve.Game.runningCurves) {
            if (playerId === collectorPlayerId) continue; // Skip the collector
            
            var curves = Kurve.Game.runningCurves[playerId];
            for (var i = 0; i < curves.length; i++) {
                if (typeof curves[i][methodName] === 'function') {
                    curves[i][methodName](duration);
                }
            }
        }
    },
    
    applyWeapon: function(token, curve) {
        // Get the base superpower type (e.g., JUMP from JUMP_WEAPON)
        var baseSuperpowerType = null;
        
        // Map weapon types to base types
        if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.JUMP_WEAPON]) {
            baseSuperpowerType = Kurve.Superpowerconfig.types.JUMP;
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.VERTICAL_BAR_WEAPON]) {
            baseSuperpowerType = Kurve.Superpowerconfig.types.VERTICAL_BAR;
        } else if (token.type === Kurve.Superpowerconfig[Kurve.Superpowerconfig.types.HYDRA_WEAPON]) {
            baseSuperpowerType = Kurve.Superpowerconfig.types.HYDRA;
        }
        
        if (baseSuperpowerType) {
            var player = curve.getPlayer();
            var currentWeapon = player.getSuperpower();
            var currentAmmo = currentWeapon.getCount();
            
            // Always create a fresh weapon instance to avoid residual state from previous uses
            var newWeapon = Kurve.Factory.getSuperpower(baseSuperpowerType);
            newWeapon.init(curve);
            
            // Set as the current active superpower
            player.setSuperpower(newWeapon);
            
            // Set ammo count to current + 1 using a simple loop
            var targetAmmo = currentAmmo + 1;
            for (var i = 0; i < targetAmmo; i++) {
                newWeapon.incrementCount();
            }
            
            // Store the weapon instance for future reference
            player.setWeapon(baseSuperpowerType, newWeapon);
        }
    },
    
    draw: function(pixiTokens) {
        if (!pixiTokens) return;
        
        this.pixiTokens = pixiTokens;
        pixiTokens.clear();
        
        for (var i = 0; i < this.tokens.length; i++) {
            var token = this.tokens[i];
            if (!token.active) continue;
            
            var colorHex = u.stringToHex(token.type.color);
            
            if (token.type.isWeapon) {
                // Draw as rectangle for weapons
                pixiTokens.lineStyle(3, colorHex);
                pixiTokens.drawRect(token.x - 8, token.y - 8, 16, 16);
            } else {
                // Draw as circle for other tokens
                pixiTokens.lineStyle(3, colorHex);
                pixiTokens.drawCircle(token.x, token.y, token.radius);
            }
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
