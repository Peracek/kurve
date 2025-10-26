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

Kurve.ControllerManager = {
    peer: null,
    connections: new Map(),
    controllerToPlayerMap: new Map(),
    onInputCallback: null,
    onConnectCallback: null,
    onDisconnectCallback: null,
    onPeerIdCallback: null,
    onColorSelectCallback: null,
    onStartNextRoundCallback: null,
    nextControllerId: 0,
    peerId: null,
    
    init: function() {
        if (typeof Peer === 'undefined') {
            console.warn('PeerJS not loaded, mobile controllers will not be available');
            return;
        }
        
        this.peer = new Peer();
        
        this.peer.on('open', function(id) {
            this.peerId = id;
            console.log('Host peer ID:', id);
            if (this.onPeerIdCallback) {
                this.onPeerIdCallback(id);
            }
        }.bind(this));
        
        this.peer.on('connection', function(conn) {
            const controllerId = this.nextControllerId++;
            this.connections.set(controllerId, conn);
            
            console.log('Controller connected:', controllerId);
            
            conn.on('open', function() {
                conn.send({
                    type: 'connection-ready',
                    controllerId: controllerId
                });
                
                if (this.onConnectCallback) {
                    this.onConnectCallback(controllerId);
                }
            }.bind(this));
            
            conn.on('data', function(data) {
                if (data.type === 'input' && this.onInputCallback) {
                    this.onInputCallback(controllerId, data.data);
                } else if (data.type === 'select-color' && this.onColorSelectCallback) {
                    this.onColorSelectCallback(controllerId, data.colorIndex);
                } else if (data.type === 'start-next-round' && this.onStartNextRoundCallback) {
                    this.onStartNextRoundCallback(controllerId);
                }
            }.bind(this));
            
            conn.on('close', function() {
                console.log('Controller disconnected:', controllerId);
                this.connections.delete(controllerId);
                if (this.onDisconnectCallback) {
                    this.onDisconnectCallback(controllerId);
                }
            }.bind(this));
            
            conn.on('error', function(err) {
                console.error('Connection error:', err);
            });
        }.bind(this));
        
        this.peer.on('error', function(err) {
            console.error('Peer error:', err);
        });
    },
    
    onConnect: function(callback) {
        this.onConnectCallback = callback;
    },
    
    onDisconnect: function(callback) {
        this.onDisconnectCallback = callback;
    },
    
    onInput: function(callback) {
        this.onInputCallback = callback;
    },
    
    onPeerId: function(callback) {
        this.onPeerIdCallback = callback;
    },
    
    onColorSelect: function(callback) {
        this.onColorSelectCallback = callback;
    },
    
    onStartNextRound: function(callback) {
        this.onStartNextRoundCallback = callback;
    },
    
    mapControllerToPlayer: function(controllerId, playerIndex) {
        this.controllerToPlayerMap.set(controllerId, playerIndex);
    },
    
    getPlayerIndexForController: function(controllerId) {
        return this.controllerToPlayerMap.get(controllerId) !== undefined 
            ? this.controllerToPlayerMap.get(controllerId) 
            : controllerId;
    },
    
    getConnectedCount: function() {
        return this.connections.size;
    },
    
    getPeerId: function() {
        return this.peerId;
    },
    
    disconnect: function() {
        if (this.peer) {
            this.peer.destroy();
        }
    }
};
