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
 * along with this.Kurve.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

'use strict';

import { Sound } from './KurveSound.js';
import { Config } from './KurveConfig.js';
import { Superpowerconfig } from './KurveSuperpowerconfig.js';
import { Factory } from './KurveFactory.js';
import { ControllerManager } from './KurveControllermanager.js';
import { Utility } from './KurveUtility.js';

// Will be set by main.js to avoid circular dependencies
let Kurve = null;
let Game = null;

export const Menu = {
    
    boundOnKeyDown: null,
    audioPlayer: null,
    scrollKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Spacebar', ' '],
    qrCodeInstance: null,
    
    // Self-reference for event handlers
    self: null,
    
    init: function() {
        this.self = this;
        this.initPlayerMenu();
        this.addWindowListeners();
        this.addMouseListeners();
        this.initMenuMusic();
        this.initControllers();
    },
        
    initPlayerMenu: function() {
        var playerHTML = '';
        
        this.Kurve.players.forEach((player) => {
            playerHTML += player.renderMenuItem();
        });
        
        document.getElementById('menu-players-list').innerHTML += playerHTML;
    },
    
    addWindowListeners: function() {
        this.boundOnKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.boundOnKeyDown, false);
    },

    addMouseListeners: function() {
        var playerItems = document.getElementById('menu-players-list').children;

        for (var i=0; i < playerItems.length; i++) {
            playerItems[i].addEventListener('click', this.onPlayerItemClicked.bind(this), false);
        }
    },

    initMenuMusic: function() {
        this.audioPlayer = this.Kurve.Sound.getAudioPlayer();
        this.audioPlayer.play('menu-music', {loop: true, background: true, fade: 2000, volume: 1});
    },
    
    removeWindowListeners: function() {
        window.removeEventListener('keydown', this.boundOnKeyDown, false);  
    },

    onPlayerItemClicked: function(event) {
        this.Kurve.Menu.audioPlayer.play('menu-navigate');
        const playerId = event.currentTarget.id;
        this.Kurve.Menu.togglePlayerActivation(playerId);
    },
    
    onKeyDown: function(event) {
        if (event.metaKey) {
            return; //Command or Ctrl pressed
        }

        if (this.Kurve.Menu.scrollKeys.indexOf(event.key) >= 0) {
            event.preventDefault(); //prevent page scrolling
        }

        if (event.keyCode === 32) {
            this.Kurve.Menu.onSpaceDown();
        }

        this.Kurve.players.forEach((player) => {
            if ( player.isKeyLeft(event.keyCode) ) {
                this.Kurve.Menu.activatePlayer(player.getId());
                this.Kurve.Menu.audioPlayer.play('menu-navigate');
            } else if ( player.isKeyRight(event.keyCode) ) {
                this.Kurve.Menu.deactivatePlayer(player.getId());
                this.Kurve.Menu.audioPlayer.play('menu-navigate');
            } else if ( player.isKeySuperpower(event.keyCode) ) {
                this.Kurve.Menu.nextSuperpower(player.getId());
                this.Kurve.Menu.audioPlayer.play('menu-navigate');
            }
        });
    },
    
    onSpaceDown: function() {
        this.Kurve.players.forEach((player) => {
            if ( player.isActive() ) {
                this.Kurve.Game.curves.push(
                    new this.Kurve.Curve(player, this.Kurve.Game, this.Kurve.Field, this.Kurve.Config.Curve, this.Kurve.Sound.getAudioPlayer())
                );    
            }
        });
        
        if (this.Kurve.Game.curves.length <= 1) {
            this.Kurve.Game.curves = [];
            this.Kurve.Menu.audioPlayer.play('menu-error', {reset: true});

            Utility.addClass('shake', 'menu');

            setTimeout(function() {
                Utility.removeClass('shake', 'menu');
            }, 450); //see Sass shake animation in _mixins.scss

            return; //not enough players are ready
        }

        this.Kurve.Field.init();
        this.Kurve.Menu.audioPlayer.pause('menu-music', {fade: 1000});
        this.Kurve.Game.startGame();

        Utility.addClass('hidden', 'layer-menu');
        Utility.removeClass('hidden', 'layer-game');
    },

    onNextSuperPowerClicked: function(event, playerId) {
        event.stopPropagation();
        this.Kurve.Menu.audioPlayer.play('menu-navigate');
        this.Kurve.Menu.nextSuperpower(playerId);
    },

    onPreviousSuperPowerClicked: function(event, playerId) {
        event.stopPropagation();
        this.Kurve.Menu.audioPlayer.play('menu-navigate');
        this.Kurve.Menu.previousSuperpower(playerId);
    },

    nextSuperpower: function(playerId) {
        var player = this.Kurve.getPlayer(playerId);
        var count = 0;
        var superpowerType = '';

        for (var i in this.Kurve.Superpowerconfig.types) {
            count++;
            if ( !(this.Kurve.Superpowerconfig.types[i] === player.getSuperpower().getType() ) ) continue;

            if ( Object.keys(this.Kurve.Superpowerconfig.types).length === count) {
                superpowerType = Object.keys(this.Kurve.Superpowerconfig.types)[0];
            } else {
                superpowerType = Object.keys(this.Kurve.Superpowerconfig.types)[count];
            }

            break;
        }

        player.setSuperpower( this.Kurve.Factory.getSuperpower(superpowerType) );
    },

    previousSuperpower: function(playerId) {
        var player = this.Kurve.getPlayer(playerId);
        var count = 0;
        var superpowerType = '';

        for (var i in this.Kurve.Superpowerconfig.types) {
            count++;
            if ( !(this.Kurve.Superpowerconfig.types[i] === player.getSuperpower().getType() ) ) continue;

            if ( 1 === count) {
                superpowerType = Object.keys(this.Kurve.Superpowerconfig.types)[Object.keys(this.Kurve.Superpowerconfig.types).length - 1];
            } else {
                superpowerType = Object.keys(this.Kurve.Superpowerconfig.types)[count - 2];
            }

            break;
        }

        player.setSuperpower( this.Kurve.Factory.getSuperpower(superpowerType) );
    },

    activatePlayer: function(playerId) {
        if ( this.Kurve.getPlayer(playerId).isActive() ) return;

        this.Kurve.getPlayer(playerId).setIsActive(true);

        Utility.removeClass('inactive', playerId);
        Utility.addClass('active', playerId);
    },

    deactivatePlayer: function(playerId) {
        if ( !this.Kurve.getPlayer(playerId).isActive() ) return;

        this.Kurve.getPlayer(playerId).setIsActive(false);

        Utility.removeClass('active', playerId);
        Utility.addClass('inactive', playerId);
    },

    togglePlayerActivation: function(playerId) {
        if ( this.Kurve.getPlayer(playerId).isActive() ) {
            this.Kurve.Menu.deactivatePlayer(playerId);
        } else {
            this.Kurve.Menu.activatePlayer(playerId);
        }
    },

    requestFullScreen: function() {
        document.body.webkitRequestFullScreen();
    },

    initControllers: function() {
        if (!this.Kurve.ControllerManager) return;

        this.Kurve.ControllerManager.init();

        this.Kurve.ControllerManager.onPeerId(function(peerId) {
            this.updateMobileUrl(peerId);
        }.bind(this));

        this.Kurve.ControllerManager.onConnect(function(controllerId) {
            console.log('Controller connected:', controllerId);
            // Controller will select a player via color picker, so don't assign yet
            this.updateConnectionStatus();
        }.bind(this));

        this.Kurve.ControllerManager.onDisconnect(function(controllerId) {
            console.log('Controller disconnected:', controllerId);
            const playerIndex = this.Kurve.ControllerManager.getPlayerIndexForController(controllerId);
            if (this.Kurve.players[playerIndex]) {
                this.Kurve.players[playerIndex].setControllerConnected(false);
                const playerId = this.Kurve.players[playerIndex].getId();
                if (playerId) {
                    this.Kurve.Menu.deactivatePlayer(playerId);
                }
            }
            // Clean up the mapping
            this.Kurve.ControllerManager.controllerToPlayerMap.delete(controllerId);
            this.updateConnectionStatus();
        }.bind(this));

        this.Kurve.ControllerManager.onColorSelect(function(controllerId, colorIndex) {
            console.log('Color selected:', controllerId, colorIndex);
            // Map the controller to the selected player
            if (colorIndex < this.Kurve.players.length) {
                this.Kurve.ControllerManager.mapControllerToPlayer(controllerId, colorIndex);
                this.Kurve.Menu.audioPlayer.play('menu-navigate');
                this.Kurve.Menu.activatePlayer(this.Kurve.players[colorIndex].getId());
                this.Kurve.players[colorIndex].setControllerConnected(true);
                
                // Send confirmation back to controller to show game controls
                const conn = this.Kurve.ControllerManager.connections.get(controllerId);
                if (conn && conn.open) {
                    conn.send({
                        type: 'assign-id',
                        controllerId: controllerId
                    });
                }
            }
        }.bind(this));

        this.Kurve.ControllerManager.onStartNextRound(function(controllerId) {
            console.log('Start next round requested by controller:', controllerId);
            // Only start if not already started
            if (!this.Kurve.Game.isRoundStarted) {
                this.Kurve.Game.startNewRound();
            }
        });

        this.Kurve.ControllerManager.onStartGame(function(controllerId) {
            console.log('Start game requested by controller:', controllerId);
            // Trigger the same logic as pressing space
            this.Kurve.Menu.onSpaceDown();
        });

        var controllerInputStates = {};

        this.Kurve.ControllerManager.onInput(function(controllerId, data) {
            const playerIndex = this.Kurve.ControllerManager.getPlayerIndexForController(controllerId);
            if (this.Kurve.players[playerIndex]) {
                if (!controllerInputStates[controllerId]) {
                    controllerInputStates[controllerId] = { left: false, right: false, superpower: false };
                }

                if (data.action === 'left') {
                    controllerInputStates[controllerId].left = data.value;
                } else if (data.action === 'right') {
                    controllerInputStates[controllerId].right = data.value;
                } else if (data.action === 'superpower') {
                    controllerInputStates[controllerId].superpower = data.value;
                }

                this.Kurve.players[playerIndex].setControllerInput(
                    controllerInputStates[controllerId].left,
                    controllerInputStates[controllerId].right,
                    controllerInputStates[controllerId].superpower
                );
            }
        });
    },

    updateMobileUrl: function(peerId) {
        var pathname = window.location.pathname;
        if (pathname.endsWith('index.html')) {
            pathname = pathname.replace('index.html', '');
        } else if (!pathname.endsWith('/')) {
            pathname += '/';
        }
        var baseUrl = window.location.origin + pathname;
        var mobileUrl = baseUrl + 'mobile-controller.html?peer=' + peerId;

        var qrCodeDiv = document.getElementById('qr-code');
        if (qrCodeDiv) {
            if (this.qrCodeInstance) {
                qrCodeDiv.innerHTML = '';
            }

            if (typeof QRCode !== 'undefined') {
                this.qrCodeInstance = new QRCode(qrCodeDiv, {
                    text: mobileUrl,
                    width: 150,
                    height: 150,
                    colorDark: '#000000',
                    colorLight: '#ffffff'
                });
            } else {
                setTimeout(function() {
                    this.updateMobileUrl(peerId);
                }.bind(this), 100);
            }
        }
    },

    updateConnectionStatus: function() {
        var statusElement = document.getElementById('controller-status');
        if (!statusElement || !this.Kurve.ControllerManager) return;

        var connectedCount = this.Kurve.ControllerManager.getConnectedCount();
        statusElement.textContent = connectedCount + ' controller' + (connectedCount !== 1 ? 's' : '') + ' connected';
    },
};
