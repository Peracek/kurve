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

export const ControllerManager = {
    peer: null,
    connections: new Map(),
    controllerToPlayerMap: new Map(),
    onInputCallback: null,
    onConnectCallback: null,
    onDisconnectCallback: null,
    onPeerIdCallback: null,
    onColorSelectCallback: null,
    onStartNextRoundCallback: null,
    onStartGameCallback: null,
    nextControllerId: 0,
    peerId: null,
    peerInitAttempts: 0,
    maxPeerInitAttempts: 3,
    peerInitTimeout: null,
    
    // Configuration for custom PeerJS server
    peerConfig: {
        host: null,  // Will be set from config or env var
        port: 443,
        secure: true,
        path: '/peerjs'
    },
    
    // Set custom PeerJS server configuration
    setServerConfig: function(config) {
        if (config.host) this.peerConfig.host = config.host;
        if (config.port) this.peerConfig.port = config.port;
        if (config.secure !== undefined) this.peerConfig.secure = config.secure;
        if (config.path) this.peerConfig.path = config.path;
        console.log('PeerJS server configured:', this.peerConfig);
    },
    
    init: function() {
        if (typeof Peer === 'undefined') {
            console.warn('PeerJS not loaded, mobile controllers will not be available');
            return;
        }
        
        this.initPeer();
    },
    
    initPeer: function() {
        try {
            // Determine which PeerJS server to use
            // Priority: Explicit config > Window variable > Environment > Default (peerjs.com)
            let peerConfig = { ...this.peerConfig };
            
            // Check for explicit window configuration
            if (window.PEERJS_CONFIG) {
                this.setServerConfig(window.PEERJS_CONFIG);
                peerConfig = { ...this.peerConfig };
            }
            
            // Fallback: if no host specified, try environment or use default
            if (!peerConfig.host) {
                peerConfig.host = window.PEERJS_HOST || 'peerjs.com';
            }
            
            console.log('🔌 Connecting to PeerJS server:', peerConfig.host);
            
            // Use custom configuration with reliable STUN servers
            // and fallback options for PeerJS connectivity
            this.peer = new Peer({
                // Use public STUN servers for better connectivity
                config: {
                    iceServers: [
                        { urls: ['stun:stun.l.google.com:19302'] },
                        { urls: ['stun:stun1.l.google.com:19302'] },
                        { urls: ['stun:stun2.l.google.com:19302'] },
                        { urls: ['stun:stun3.l.google.com:19302'] },
                        { urls: ['stun:stun4.l.google.com:19302'] }
                    ]
                },
                // PeerJS server configuration
                host: peerConfig.host,
                port: peerConfig.port,
                secure: peerConfig.secure,
                path: peerConfig.path
            });
            
            // Set timeout to detect if peer ID isn't obtained
            this.peerInitTimeout = setTimeout(() => {
                if (!this.peerId && this.peerInitAttempts < this.maxPeerInitAttempts) {
                    console.warn('Peer ID timeout, retrying... (attempt ' + (this.peerInitAttempts + 1) + ')');
                    this.peerInitAttempts++;
                    this.retryPeerInit();
                } else if (!this.peerId) {
                    console.error('Failed to get Peer ID after ' + this.maxPeerInitAttempts + ' attempts');
                    console.error('⚠️ This usually means: PeerJS server is unavailable');
                    console.error('💡 Solutions:');
                    console.error('  1. Try again later (server may be down)');
                    console.error('  2. Check if server is accessible: https://' + (peerConfig.host || 'peerjs.com'));
                    console.error('  3. Check your custom PeerJS server configuration');
                    console.error('  4. Try a different network/VPN');
                }
            }, 5000);
            
            this.peer.on('open', function(id) {
                clearTimeout(this.peerInitTimeout);
                this.peerId = id;
                this.peerInitAttempts = 0;
                console.log('✅ Host peer ID:', id);
                console.log('✅ Connected to:', peerConfig.host);
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
                    } else if (data.type === 'start-game' && this.onStartGameCallback) {
                        this.onStartGameCallback(controllerId);
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
                console.error('❌ Peer error:', err);
                console.error('Error type:', err.type);
                console.log('Available error types: network, peer-unavailable, invalid-id, invalid-key, unavailable-id');
                
                clearTimeout(this.peerInitTimeout);
                
                // Retry on error if attempts remaining
                if (this.peerInitAttempts < this.maxPeerInitAttempts) {
                    console.warn('Peer initialization error, retrying... (attempt ' + (this.peerInitAttempts + 1) + ')');
                    this.peerInitAttempts++;
                    this.retryPeerInit();
                } else {
                    console.error('⚠️ Max retries reached.');
                    console.error('Try:');
                    console.error('  1. Refresh the page in a few minutes');
                    console.error('  2. Check if PeerJS server is running');
                    console.error('  3. Verify your server configuration');
                    console.error('  4. Check https://' + (peerConfig.host || 'peerjs.com'));
                }
            }.bind(this));
        } catch (err) {
            console.error('❌ Error creating Peer:', err);
            if (this.peerInitAttempts < this.maxPeerInitAttempts) {
                console.warn('Retrying Peer initialization... (attempt ' + (this.peerInitAttempts + 1) + ')');
                this.peerInitAttempts++;
                this.retryPeerInit();
            }
        }
    },
    
    retryPeerInit: function() {
        // Destroy old peer instance
        if (this.peer) {
            try {
                this.peer.destroy();
            } catch (err) {
                console.error('Error destroying peer:', err);
            }
        }
        
        // Wait a bit before retrying
        setTimeout(function() {
            this.initPeer();
        }.bind(this), 1000);
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
        // If peer ID is already available, call callback immediately
        if (this.peerId) {
            callback(this.peerId);
        }
    },
    
    onColorSelect: function(callback) {
        this.onColorSelectCallback = callback;
    },
    
    onStartNextRound: function(callback) {
        this.onStartNextRoundCallback = callback;
    },
    
    onStartGame: function(callback) {
        this.onStartGameCallback = callback;
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
        if (this.peerInitTimeout) {
            clearTimeout(this.peerInitTimeout);
        }
        if (this.peer) {
            this.peer.destroy();
        }
    }
};
