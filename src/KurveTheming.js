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

import { Storage } from './KurveStorage.js';
import { Config } from './KurveConfig.js';
import { Utility } from './KurveUtility.js';

export const Theming = {
    currentTheme: 'dark',

    init: function() {
        if (Storage.has('kurve.theme')) {
            this.currentTheme = Storage.get('kurve.theme');
        } else {
            Storage.set('kurve.theme', this.currentTheme);
        }

        if (this.currentTheme === 'default') {
            document.getElementById('change-theme').innerText = 'Lights on';
        } else {
            document.getElementById('change-theme').innerText = 'Lights off';
        }

        Utility.addClass(this.currentTheme + '-theme', 'app');
    },

    getThemedValue: function(section, value) {
        if (Config['Theming'][this.currentTheme] !== undefined) {
            return Config['Theming'][this.currentTheme][section][value];
        }
    },

    changeTheme: function(theme) {
        Utility.removeClass(this.currentTheme + '-theme', 'app');
        Utility.addClass(theme + '-theme', 'app');

        this.currentTheme = theme;
        Storage.set('kurve.theme', this.currentTheme);
    },

    toggleTheme: function() {
        if (this.currentTheme === 'default') {
            this.changeTheme('dark');
            document.getElementById('change-theme').innerText = 'Lights off';
        } else {
            this.changeTheme('default');
            document.getElementById('change-theme').innerText = 'Lights on';
        }
    },
};
