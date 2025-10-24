/**
 * Main entry point for Kurve application
 * ES Module wrapper for the original concatenated scripts
 */

// Import polyfills and global setup
import './window.js';

// Import SCSS
import '../scss/main.scss';

// Import Kurve first to create the global window.Kurve object
import './Kurve.js';

// Import all Kurve modules in the correct order
// The order matters because later modules depend on earlier ones
import './KurveUtility.js';
import './KurveConfig.js';
import './KurveStorage.js';
import './KurveSound.js';
import './KurveTheming.js';
import './KurveFactory.js';
import './KurveControllermanager.js';
import './KurveMenu.js';
import './KurveGame.js';
import './KurveField.js';
import './KurveSuperpower.js';
import './KurveSuperpowerconfig.js';
import './KurveTokenmanager.js';
import './KurveCurve.js';
import './KurvePoint.js';
import './KurvePlayer.js';
import './KurveLightbox.js';
import './KurvePiwik.js';
import './KurvePrivacypolicy.js';

// Kurve and u are now available globally via window.Kurve and window.u

// Initialize Kurve when DOM is ready, ensuring all modules are loaded
document.addEventListener('DOMContentLoaded', window.Kurve.init.bind(window.Kurve));
