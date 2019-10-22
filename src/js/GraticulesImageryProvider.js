/**
 * An {@link ImageryProvider} that draws a box around every rendered tile in the tiling scheme, and draws
 * a label inside it indicating the X, Y, Level coordinates of the tile.  This is mostly useful for
 * debugging terrain and imagery rendering problems.
 *
 * @alias LonlatsImageryProvider
 * @constructor
 *
 * @param {Object} [options] Object with the following properties:
 * @param {TilingScheme} [options.tilingScheme=new GeographicTilingScheme()] The tiling scheme for which to draw tiles.
 * @param {Ellipsoid} [options.ellipsoid] The ellipsoid.  If the tilingScheme is specified,
 *                    this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither
 *                    parameter is specified, the WGS84 ellipsoid is used.
 * @param {Color} [options.color=Color.YELLOW] The color to draw the tile box and label.
 * @param {Number} [options.tileWidth=256] The width of the tile for level-of-detail selection purposes.
 * @param {Number} [options.tileHeight=256] The height of the tile for level-of-detail selection purposes.
 */

import Cesium from 'cesium/Cesium'

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var resolve = Cesium.when.resolve;
var CesiumEvent = Cesium.Event;
var Color = Cesium.Color;
var GeographicTilingScheme = Cesium.GeographicTilingScheme;
var defineProperties = Cesium.defineProperties;

var GraticulesImageryProvider = function (options) {
  options = Cesium.defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = defined(options.tilingScheme) ? options.tilingScheme : new GeographicTilingScheme({ ellipsoid: options.ellipsoid });
  this._color = defaultValue(options.color, Color.YELLOW);
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);
  this._readyPromise = resolve(true);

  this._errorEvent = new CesiumEvent();
};

defineProperties(GraticulesImageryProvider.prototype, {
    /**
     * Gets the width of each tile, in pixels.
     * @type {Number}
     * @readonly
     */
    tileWidth : {
        get : function() { return this._tileWidth; }
    },

    /**
     * Gets the height of each tile, in pixels.
     * @type {Number}
     * @readonly
     */
    tileHeight: {
        get : function() { return this._tileHeight; }
    },

    /**
     * Gets the tiling scheme used by this provider.
     * @type {TilingScheme}
     * @readonly
     */
    tilingScheme : {
        get : function() { return this._tilingScheme; }
    },

    /**
     * Gets the rectangle, in radians, of the imagery provided by this instance.
     * @type {Rectangle}
     * @readonly
     */
    rectangle : {
        get : function() { return this._tilingScheme.rectangle; }
    },

    /**
     * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
     * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
     * are passed an instance of {@link TileProviderError}.
     * @type {Event}
     * @readonly
     */
    errorEvent : {
        get : function() { return this._errorEvent; }
    },

    /**
     * Gets a value indicating whether or not the provider is ready for use.
     * @type {Boolean}
     * @readonly
     */
    ready : {
        get : function() { return true; }
    },

    /**
     * Gets a promise that resolves to true when the provider is ready for use.
     * @type {Promise.<Boolean>}
     * @readonly
     */
    readyPromise : {
        get : function() { return this._readyPromise; }
    },

    /**
     * Gets a value indicating whether or not the images provided by this imagery provider
     * include an alpha channel.  If this property is false, an alpha channel, if present, will
     * be ignored.  If this property is true, any images without an alpha channel will be treated
     * as if their alpha is 1.0 everywhere.  Setting this property to false reduces memory usage
     * and texture upload time.
     * @type {Boolean}
     * @readonly
     */
    hasAlphaChannel : {
        get : function() { return true; }
    }
});

/**
 * Gets the credits to be displayed when a given tile is displayed.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level;
 * @returns {Credit[]} The credits to be displayed when the tile is displayed.
 *
 * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
 */
GraticulesImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * Requests the image for a given tile.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @param {Request} [request] The request object. Intended for internal use only.
 * @returns {Promise.<Image|Canvas>|undefined} A promise for the image that will resolve when the image is available, or
 *          undefined if there are too many active requests to the server, and the request
 *          should be retried later.  The resolved image may be either an
 *          Image or a Canvas DOM object.
 */
GraticulesImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return undefined;
};

/**
 * Picking features is not currently supported by this imagery provider, so this function simply returns
 * undefined.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @param {Number} longitude The longitude at which to pick features.
 * @param {Number} latitude  The latitude at which to pick features.
 * @return {Promise.<ImageryLayerFeatureInfo[]>|undefined} A promise for the picked features that will resolve when the asynchronous
 *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
 *                   instances.  The array may be empty if no features are found at the given location.
 *                   It may also be undefined if picking is not supported.
 */
GraticulesImageryProvider.prototype.pickFeatures = function (x, y, level, longitude, latitude) {
  return undefined;
};

export default GraticulesImageryProvider;
