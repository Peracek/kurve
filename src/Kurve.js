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

import { Utility } from './KurveUtility.js';
import { Config } from './KurveConfig.js';
import { Player } from './KurvePlayer.js';
import { Piwik } from './KurvePiwik.js';

export const Kurve = {
    
    players: [],
    playersById: {},
    
    init: function() {
        if (Utility.isSafari()) Utility.addClass('is-safari', 'app');
        if (Utility.isIE())  Utility.addClass('is-ie', 'app');

        this.Theming.init();
        this.Sound.init();
        this.initPlayers();
        this.Menu.init();
        this.Game.init();
        this.Lightbox.init();
        this.Privacypolicy.init();

        Utility.removeClass('hidden', 'app');
    },
        
    initPlayers: function() {
        Config.Players.forEach(function(player) {
            var player = new Player(player.id, player.keyLeft, player.keyRight, player.keySuperpower);

            this.players.push(player);
            this.playersById[player.getId()] = player;
        }.bind(this));
    },

    getPlayer: function(playerId) {
        return this.playersById[playerId];
    },

    reload: function() {
        location.reload();
    },

    onUnload: function() {
        Piwik.trackPageView();
    }

};
