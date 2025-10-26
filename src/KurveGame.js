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

import { Config } from './KurveConfig.js';
import { Field } from './KurveField.js';
import { Sound } from './KurveSound.js';
import { Utility } from './KurveUtility.js';
import { Curve } from './KurveCurve.js';
import { ControllerManager } from './KurveControllermanager.js';

// Will be set by main.js to avoid circular dependencies
let Kurve = null;
let Menu = null;

class GameAudio {
    constructor(game) {
        this.game = game;
        this.stemLevel = 1;
        this.audioPlayer = null;
        this.defaultFadeTime = 1000;
    }

    init() {
        this.audioPlayer = Sound.getAudioPlayer();
    }

    startNewRound() {
        const startIn1Delay = Config.Game.startDelay / 3;
        const startIn2Delay = 2 * startIn1Delay;
        const startOutDelay = 3 * startIn1Delay;

        setTimeout(this.audioPlayer.play.bind(this.audioPlayer, 'game-start-in', {reset: true}), startIn1Delay);
        setTimeout(this.audioPlayer.play.bind(this.audioPlayer, 'game-start-in', {reset: true}), startIn2Delay);
        setTimeout(() => {
            this.audioPlayer.play('game-start-out', {reset: true});
            this.setAllCurvesMuted('all', false);

            if (this.game.deathMatch) {
                this.stemLevel = 3;
                this.audioPlayer.play('game-music-stem-1', {fade: this.defaultFadeTime, volume: 1, background: true, loop: true, reset: true});
                this.audioPlayer.play('game-music-stem-4', {fade: this.defaultFadeTime, volume: 1, background: true, loop: true, reset: true});
            } else {
                this.stemLevel = 1;
                this.audioPlayer.play('game-music-stem-1', {fade: this.defaultFadeTime, volume: 1, background: true, loop: true, reset: true});
                this.audioPlayer.play('game-music-stem-2', {fade: this.defaultFadeTime, volume: 0, background: true, loop: true, reset: true});
                this.audioPlayer.play('game-music-stem-3', {fade: this.defaultFadeTime, volume: 0, background: true, loop: true, reset: true});
            }
        }, startOutDelay);
    }

    terminateRound() {
        this.pauseAllCurves('all', {reset: true});
        this.audioPlayer.pause('game-music-stem-1', {fade: this.defaultFadeTime, reset: true});
        this.audioPlayer.pause('game-music-stem-2', {fade: this.defaultFadeTime, reset: true});
        this.audioPlayer.pause('game-music-stem-3', {fade: this.defaultFadeTime, reset: true});
        this.audioPlayer.pause('game-music-stem-4', {fade: this.defaultFadeTime, reset: true});
        this.audioPlayer.play('game-end');
    }

    pauseIn() {
        this.audioPlayer.play('game-pause-in');
        this.setAllCurvesMuted('all', true);
        this.audioPlayer.setVolume('game-music-stem-1', {volume: 0.25, fade: this.defaultFadeTime});

        if (this.stemLevel > 1) {
            this.audioPlayer.setVolume('game-music-stem-2', {volume: 0, fade: this.defaultFadeTime});
        }

        if (this.stemLevel > 2) {
            this.audioPlayer.setVolume('game-music-stem-3', {volume: 0, fade: this.defaultFadeTime});
        }

        if (this.game.deathMatch) {
            this.audioPlayer.setVolume('game-music-stem-4', {volume: 0, fade: this.defaultFadeTime});
        }
    }

    pauseOut() {
        this.audioPlayer.play('game-pause-out');
        this.setAllCurvesMuted('all', false);
        this.audioPlayer.setVolume('game-music-stem-1', {volume: 1, fade: this.defaultFadeTime});

        if (this.stemLevel > 1) {
            this.audioPlayer.setVolume('game-music-stem-2', {volume: 0.5, fade: this.defaultFadeTime});
        }

        if (this.stemLevel > 2) {
            this.audioPlayer.setVolume('game-music-stem-3', {volume: 0.3, fade: this.defaultFadeTime});
        }

        if (this.game.deathMatch) {
            this.audioPlayer.setVolume('game-music-stem-4', {volume: 1, fade: this.defaultFadeTime});
        }
    }

    tension() {
        if (this.game.deathMatch) {
            return;
        }

        this.stemLevel = 3;
        this.audioPlayer.setVolume('game-music-stem-2', {volume: 0.5, fade: this.defaultFadeTime});
        this.audioPlayer.setVolume('game-music-stem-3', {volume: 0.3, fade: this.defaultFadeTime});
    }

    initDeathMatch() {
        this.audioPlayer.play('game-deathmatch');
    }

    gameOver() {
        this.audioPlayer.pause('all');
        this.audioPlayer.play('game-victory');
    }

    setAllCurvesMuted(soundKey, muted) {
        this.game.curves.forEach(curve => {
            curve.setMuted(soundKey, muted);
        });
    }

    pauseAllCurves(soundKey, options) {
        this.game.curves.forEach(curve => {
            curve.pause(soundKey, options);
        });
    }
}

class GameClass {
    constructor() {
        this.runIntervalId = null;
        this.fps = null;
        this.intervalTimeOut = null;
        this.maxPoints = null;
        
        this.keysDown = {};
        this.isRunning = false;
        this.curves = [];
        this.runningCurves = {};
        this.players = [];
        this.deathMatch = false;
        this.isPaused = false;
        this.isRoundStarted = false;
        this.playerScoresElement = null;
        this.isGameOver = false;
        this.CURRENT_FRAME_ID = 0;
        
        this.Audio = new GameAudio(this);
    }
    
    init() {
        this.fps = Config.Game.fps;
        this.intervalTimeOut = Math.round(1000 / this.fps);
        this.playerScoresElement = document.getElementById('player-scores');

        this.Audio.init();
    }
    
    run() {
        requestAnimationFrame(this.drawFrame.bind(this));
    }
    
    drawFrame() {
        this.CURRENT_FRAME_ID++;

        for (let i in this.runningCurves) {
            for (let j = 0; this.runningCurves[i] && j < this.runningCurves[i].length; ++j) {
                this.runningCurves[i][j].drawNextFrame();
            }
        }
    }
    
    addWindowListeners() {
        this.Menu.removeWindowListeners();
        
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));  
    }
    
    onKeyDown(event) {
        if (this.Menu.scrollKeys.indexOf(event.key) >= 0) {
            event.preventDefault(); //prevent page scrolling
        }

        if (event.keyCode === 32) {
            this.onSpaceDown();
        }

        this.keysDown[event.keyCode] = true;
    }
    
    onKeyUp(event) {
        delete this.keysDown[event.keyCode];
    }
    
    isKeyDown(keyCode) {
        return this.keysDown[keyCode] === true;
    }
    
    onSpaceDown() {
        if (this.isGameOver) return location.reload();
        if (this.isRunning || this.isPaused) return this.togglePause();
        if (!this.isRoundStarted && !this.deathMatch) return this.startNewRound();
        if (!this.isRoundStarted && this.deathMatch) return this.startDeathMatch();
    }
    
    togglePause() {
        if (this.isPaused) {
            this.endPause();
        } else {
            this.doPause();
        }
    }

    doPause() {
        if (this.isPaused) return;

        this.isPaused = true;
        this.Audio.pauseIn();
        this.stopRun();
        this.Kurve.Lightbox.show('<h2>Game is paused</h2>');
    }

    endPause() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.Audio.pauseOut();
        this.Kurve.Lightbox.hide();
        this.startRun();
    }
    
    startGame() {
        this.maxPoints = (this.curves.length - 1) * 10;
        
        this.addPlayers();
        this.addWindowListeners();
        this.renderPlayerScores();

        this.Kurve.Piwik.trackPageVariable(1, 'theme', this.Kurve.Theming.currentTheme);
        this.Kurve.Piwik.trackPageVariable(2, 'number_of_players', this.players.length);
        this.Kurve.Piwik.trackPageView('Game');
        
        this.notifyControllersGameStarted();
        this.startNewRound();
    }
    
    notifyControllersGameStarted() {
        if (!ControllerManager) return;
        
        ControllerManager.connections.forEach((conn, controllerId) => {
            if (conn && conn.open) {
                conn.send({
                    type: 'game-started'
                });
            }
        });
    }
    
    renderPlayerScores() {
        let playerHTML = '';
        
        this.players.sort(this.playerSorting);
        this.players.forEach(player => { playerHTML += player.renderScoreItem() });
        
        this.playerScoresElement.innerHTML = playerHTML;
    }
    
    playerSorting(playerA, playerB) {
        return playerB.getPoints() - playerA.getPoints();
    }
    
    addPlayers() {
        this.curves.forEach(curve => {
            for (let i = 0; i < Config.Game.initialSuperpowerCount; i++) {
                curve.getPlayer().getSuperpower().incrementCount();
            }

            this.players.push(curve.getPlayer());
        });
    }
    
    notifyDeath(curve) {
        const playerId = curve.getPlayer().getId();
        // Drop this curve.
        if (this.runningCurves[playerId] === undefined) return;

        this.runningCurves[playerId].splice(this.runningCurves[playerId].indexOf(curve), 1);

        if (this.runningCurves[playerId].length === 0) {
            // Drop this player.
            delete this.runningCurves[curve.getPlayer().getId()];
            for (let i in this.runningCurves) {
                this.runningCurves[i][0].getPlayer().incrementPoints();
            }
        
            this.renderPlayerScores();

            if (Object.keys(this.runningCurves).length === 2) {
                this.Audio.tension();
            }
        
            if (Object.keys(this.runningCurves).length === 1) this.terminateRound();
        }
    }
    
    startNewRound() {
        this.isRoundStarted = true;
        this.CURRENT_FRAME_ID = 0;

        Field.clearFieldContent();
        this.initRun();
        this.renderPlayerScores();

        setTimeout(this.startRun.bind(this), Config.Game.startDelay);
        this.Audio.startNewRound();
    }
    
    startRun() {
        this.isRunning = true;
        this.runIntervalId = setInterval(this.run.bind(this), this.intervalTimeOut);
    }
    
    stopRun() {
        this.isRunning = false;
        clearInterval(this.runIntervalId);
    }
    
    initRun() {
        this.curves.forEach(curve => {
            this.runningCurves[curve.getPlayer().getId()] = [curve];
            
            curve.setPosition(Field.getRandomPosition().getPosX(), Field.getRandomPosition().getPosY());
            curve.setRandomAngle();
            curve.getPlayer().getSuperpower().init(curve);
            curve.drawCurrentPosition(Field);
        });
    }
    
    terminateRound() {
        this.curves.forEach(curve => {
            curve.getPlayer().getSuperpower().close(curve);
        });

        if (this.deathMatch) {
            const curve = this.runningCurves[Object.keys(this.runningCurves)[0]][0];
            this.gameOver(curve.getPlayer());
        }

        this.isRoundStarted = false;
        this.stopRun();
        this.runningCurves = {};
        this.incrementSuperpowers();
        this.Audio.terminateRound();
        Field.resize();
        this.checkForWinner();
        
        // Notify controllers that the round has ended
        this.notifyControllersRoundEnded();
    }
    
    notifyControllersRoundEnded() {
        if (!ControllerManager) return;
        
        ControllerManager.connections.forEach((conn, controllerId) => {
            if (conn && conn.open) {
                conn.send({
                    type: 'round-ended'
                });
            }
        });
    }

    incrementSuperpowers() {
        const numberOfPlayers = this.players.length;

        if (numberOfPlayers === 2) {
            this.players[0].getSuperpower().incrementCount();
            this.players[1].getSuperpower().incrementCount();
        } else {
            for (let i in this.players) {
                if (parseInt(i) === 0) continue; // skip the leader

                this.players[i].getSuperpower().incrementCount();
            }

            // extra superpower for the loser
            this.players[numberOfPlayers - 1].getSuperpower().incrementCount();
        }
    }
    
    checkForWinner() {
        if (this.deathMatch) return;

        const winners = [];
        
        this.players.forEach(player => {
            if (player.getPoints() >= this.maxPoints) winners.push(player);
        });
        
        if (winners.length === 0) return;
        if (winners.length === 1) this.gameOver(winners[0]);
        if (winners.length > 1) this.initDeathMatch(winners);
    }

    initDeathMatch(winners) {
        this.deathMatch = true;
        this.Audio.initDeathMatch();
        this.Kurve.Lightbox.show('<div class="deathmatch"><h1>DEATHMATCH!</h1></div>');

        const winnerCurves = [];
        this.curves.forEach(curve => {
            winners.forEach(player => {
                if (curve.getPlayer() === player) {
                    winnerCurves.push(curve);
                    player.setColor(this.Kurve.Theming.getThemedValue('field', 'deathMatchColor'));
                }
            });
        });

        this.curves = winnerCurves;
    }
    
    startDeathMatch(winners) {
        this.Kurve.Piwik.trackPageVariable(3, 'death_match', 'yes');
        this.Kurve.Lightbox.hide();
        this.startNewRound();
    }
    
    gameOver(winner) {
        this.isGameOver = true;

        this.Audio.gameOver();
        this.Kurve.Piwik.trackPageVariable(4, 'finished_game', 'yes');
        this.Kurve.Piwik.trackPageView('GameOver');

        this.Kurve.Lightbox.show(
            '<h1 class="active ' + winner.getId() + '">' + winner.getId() + ' wins!</h1>' +
            '<a href="#" onclick="reload(); return false;" title="Go back to the menu"  class="button">Start new game</a>'
        );
    }
}

// Export singleton instance to maintain backward compatibility
export const Game = new GameClass();
