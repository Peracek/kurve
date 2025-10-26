/**
 * Main entry point for Kurve application
 * ES Module implementation with named exports
 */

// Import polyfills first
import './window.js';

// Import SCSS
import '../scss/main.scss';

// Import all modules with named exports
import { Kurve } from './Kurve.js';
import { Utility } from './KurveUtility.js';
import { Config } from './KurveConfig.js';
import { Storage } from './KurveStorage.js';
import { Sound } from './KurveSound.js';
import { Theming } from './KurveTheming.js';
import { Factory } from './KurveFactory.js';
import { ControllerManager } from './KurveControllermanager.js';
import { Menu } from './KurveMenu.js';
import { Game } from './KurveGame.js';
import { Field } from './KurveField.js';
import { Superpower } from './KurveSuperpower.js';
import { Superpowerconfig } from './KurveSuperpowerconfig.js';
import { Curve } from './KurveCurve.js';
import { Point } from './KurvePoint.js';
import { Player } from './KurvePlayer.js';
import { Lightbox } from './KurveLightbox.js';
import { Piwik } from './KurvePiwik.js';
import { Privacypolicy } from './KurvePrivacypolicy.js';

// Attach all modules to Kurve object for cross-module access
// This enables references like Kurve.Sound, Kurve.Game, etc.
Kurve.Utility = Utility;
Kurve.Config = Config;
Kurve.Storage = Storage;
Kurve.Sound = Sound;
Kurve.Theming = Theming;
Kurve.Factory = Factory;
Kurve.ControllerManager = ControllerManager;
Kurve.Menu = Menu;
Kurve.Game = Game;
Kurve.Field = Field;
Kurve.Superpower = Superpower;
Kurve.Superpowerconfig = Superpowerconfig;
Kurve.Curve = Curve;
Kurve.Point = Point;
Kurve.Player = Player;
Kurve.Lightbox = Lightbox;
Kurve.Piwik = Piwik;
Kurve.Privacypolicy = Privacypolicy;

// Resolve circular dependencies by attaching references directly
// Menu and Game can now reference each other and Kurve through these properties
Menu.Kurve = Kurve;
Menu.Game = Game;
Game.Kurve = Kurve;
Game.Menu = Menu;
Field.Game = Game;

// Create global helper for onclick handlers in HTML
window.menuOnPreviousSuperPowerClicked = (event, playerId) => Menu.onPreviousSuperPowerClicked(event, playerId);
window.menuOnNextSuperPowerClicked = (event, playerId) => Menu.onNextSuperPowerClicked(event, playerId);
window.toggleTheme = () => Theming.toggleTheme();
window.toggleSound = () => Sound.toggleSound();
window.showPrivacyPolicy = () => Privacypolicy.showPrivacyPolicy();
window.onPrivacyPolicyAccepted = () => Privacypolicy.onPrivacyPolicyAccepted();
window.onCreditsClicked = () => Sound.onCreditsClicked();
window.onCreditsCloseClicked = () => Sound.onCreditsCloseClicked();
window.reload = () => Kurve.reload();

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    Kurve.init();
});
