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
import { Sound } from './KurveSound.js';
import { Superpower } from './KurveSuperpower.js';

export const Factory = {

    getSuperpower: function(type) {
        if ( !Superpowerconfig.hasOwnProperty(type) ) throw 'Superpower type ' + type + ' is not yet registered.';
        
        var hooks = Superpowerconfig[type].hooks;
        var act = Superpowerconfig[type].act;
        var init = Superpowerconfig[type].init;
        var close = Superpowerconfig[type].close;
        var helpers = {};
        var audioPlayer = Sound.getAudioPlayer();

        for (var attribute in Superpowerconfig[type].helpers) {
            if (Superpowerconfig[type].helpers.hasOwnProperty(attribute)) {
                helpers[attribute] = Superpowerconfig[type].helpers[attribute];
            }
        }

        return new Superpower(hooks, act, helpers, type, init, close, audioPlayer);
    }

};