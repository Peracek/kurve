# Achtung, die Kurve!
This is an open source HTML5 implementation of the famous game also known as Curve Fever, Zatacka or simply Kurve.

## Want to download Achtung, die Kurve and play offline?
No problem! Just download the [sources](https://achtungkurve.com/download/kurve-1.5.0.zip) and double click the file index.html to open it in your favourite browser.

## Screenshots

![](images/screenshot_1.png "Start screen") ![](images/screenshot_2.png "Gameplay") ![](images/screenshot_3.png "Gameplay light")

## Development

### Requirements for development
- node.js (v14+)
- npm

### Installing dependencies
```sh
npm install
```

### Running the development server
```sh
npm run dev
```
This starts a local dev server with hot module replacement (HMR) at `http://localhost:5173`. The app will automatically reload when you make changes.

### Building for production
```sh
npm run build
```
This creates an optimized production build in the `dist/` folder.

### Preview production build locally
```sh
npm run preview
```
This runs the production build locally for testing before deployment.
