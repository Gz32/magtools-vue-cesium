/**
 * Provides a single, top-level imagery tile.  The single image is assumed to use a
 * {@link GeographicTilingScheme}.
 *
 * @alias HeatmapImageryProvider
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} [options.heatmapoptions] Optional heatmap.js options to be used (see http://www.patrick-wied.at/static/heatmapjs/docs.html#h337-create).
 * @param {Object} [options.bounds] The bounding box for the heatmap in WGS84 coordinates.
 * @param {Number} [options.bounds.north] The northernmost point of the heatmap.
 * @param {Number} [options.bounds.south] The southernmost point of the heatmap.
 * @param {Number} [options.bounds.west] The westernmost point of the heatmap.
 * @param {Number} [options.bounds.east] The easternmost point of the heatmap.
 * @param {Object} [options.data] Data to be used for the heatmap.
 * @param {Object} [options.data.min] Minimum allowed point value.
 * @param {Object} [options.data.max] Maximum allowed point value.
 * @param {Array} [options.data.points] The data points for the heatmap containing x=lon, y=lat and value=number.
 */

import Cesium from 'cesium/Cesium'
import Heatmap from 'heatmap.js'

let defaultValue = Cesium.defaultValue;
let defined = Cesium.defined;
let CesiumEvent = Cesium.Event;
let DeveloperError = Cesium.DeveloperError;
let WebMercatorProjection = Cesium.WebMercatorProjection;
let WebMercatorTilingScheme = Cesium.WebMercatorTilingScheme;

let fromDegrees = Cesium.Cartographic.fromDegrees;
let Cartesian3 = Cesium.Cartesian3;
let Cartesian2 = Cesium.Cartesian2;

let defineProperties = Cesium.defineProperties;

let HeatmapImageryProvider = function (options) {
  options = defaultValue(options, {});

  let bounds = options.bounds;
  if (!defined(bounds)) {
    throw new DeveloperError('options.bounds is required.');
  } else if (!defined(bounds.north) || !defined(bounds.south) || !defined(bounds.east) || !defined(bounds.west)) {
    throw new DeveloperError('options.bounds.north, options.bounds.south, options.bounds.east and options.bounds.west are required.');
  }

  this._wmp = new WebMercatorProjection();
  this._mbounds = this.wgs84ToMercatorBBox(bounds);
  this._options = defaultValue(options.heatmapoptions, {});
  this._options.gradient = defaultValue(this._options.gradient, { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"});

  this._setWidthAndHeight(this._mbounds);
  this._options.radius = Math.round(defaultValue(this._options.radius, ((this.width > this.height) ? this.width / 60 : this.height / 60)));

  this._spacing = this._options.radius * 1.5;
  this._xoffset = this._mbounds.west;
  this._yoffset = this._mbounds.south;

  this.width = Math.round(this.width + this._spacing * 2);
  this.height = Math.round(this.height + this._spacing * 2);

  this._mbounds.west -= this._spacing * this._factor;
  this._mbounds.east += this._spacing * this._factor;
  this._mbounds.south -= this._spacing * this._factor;
  this._mbounds.north += this._spacing * this._factor;

  this.bounds = this.mercatorToWgs84BBox(this._mbounds);

  this._container = this._getContainer(this.width, this.height);
  this._options.container = this._container;

  this._heatmap = Heatmap.create(this._options);
  this._canvas = this._container.children[0];

  this._tilingScheme = new WebMercatorTilingScheme({
    rectangleSouthwestInMeters: new Cartesian2(this._mbounds.west, this._mbounds.south),
    rectangleNortheastInMeters: new Cartesian2(this._mbounds.east, this._mbounds.north)
  });

  this._image = this._canvas;
  this._texture = undefined;
  this._tileWidth = this.width;
  this._tileHeight = this.height;

  this._ready = false;
  if (options.data) {
    this._ready = this._setWGS84Data(options.data.min, options.data.max, options.data.points);
  }
};

defineProperties(HeatmapImageryProvider.prototype, {
  /**
   * Gets the width of each tile, in pixels. This function should
   * not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  tileWidth : {
    get : function() {
      if (!this._ready) {
        throw new DeveloperError('tileWidth must not be called before the imagery provider is ready.');
      }

      return this._tileWidth;
    }
  },

  /**
   * Gets the height of each tile, in pixels.  This function should
   * not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  tileHeight: {
    get : function() {
      if (!this._ready) {
        throw new DeveloperError('tileHeight must not be called before the imagery provider is ready.');
      }

      return this._tileHeight;
    }
  },

  /**
   * Gets the maximum level-of-detail that can be requested.  This function should
   * not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  maximumLevel : {
    get : function() {
      if (!this._ready) {
        throw new DeveloperError('maximumLevel must not be called before the imagery provider is ready.');
      }

      return 0;
    }
  },

  /**
   * Gets the minimum level-of-detail that can be requested.  This function should
   * not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  minimumLevel : {
    get : function() {
      if (!this._ready) {
        throw new DeveloperError('minimumLevel must not be called before the imagery provider is ready.');
      }

      return 0;
    }
  },

  /**
   * Gets the tiling scheme used by this provider.  This function should
   * not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme : {
    get : function() {
      if (!this._ready) {
        throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
      }

      return this._tilingScheme;
    }
  },

  /**
   * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
   * not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle : {
    get : function() {
      return this._tilingScheme.rectangle; // TODO: change to custom rectangle?
    }
  },

  /**
   * Gets a value indicating whether or not the provider is ready for use.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Boolean}
   * @readonly
   */
  ready : {
    get : function() {
      return this._ready;
    }
  },

  /**
   * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
   * the source of the imagery.  This function should not be called before {@link HeatmapImageryProvider#ready} returns true.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit : {
    get : function() {
      return this._credit;
    }
  },

  /**
   * Gets a value indicating whether or not the images provided by this imagery provider
   * include an alpha channel.  If this property is false, an alpha channel, if present, will
   * be ignored.  If this property is true, any images without an alpha channel will be treated
   * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
   * and texture upload time are reduced.
   * @memberof HeatmapImageryProvider.prototype
   * @type {Boolean}
   * @readonly
   */
  hasAlphaChannel : {
    get : function() {
      return true;
    }
  }
});

/**** 私有函数 ****/
HeatmapImageryProvider.prototype._setWidthAndHeight = function(mbb) {
  let maxCanvasSize = 2000;
  let minCanvasSize = 700;
  this.width = ((mbb.east > 0 && mbb.west < 0) ? mbb.east + Math.abs(mbb.west) : Math.abs(mbb.east - mbb.west));
  this.height = ((mbb.north > 0 && mbb.south < 0) ? mbb.north + Math.abs(mbb.south) : Math.abs(mbb.north - mbb.south));
  this._factor = 1;

  if (this.width > this.height && this.width > maxCanvasSize) {
    this._factor = this.width / maxCanvasSize;

    if (this.height / this._factor < minCanvasSize) {
      this._factor = this.height / minCanvasSize;
    }
  } else if (this.height > this.width && this.height > maxCanvasSize) {
    this._factor = this.height / maxCanvasSize;

    if (this.width / this._factor < minCanvasSize) {
      this._factor = this.width / minCanvasSize;
    }
  } else if (this.width < this.height && this.width < minCanvasSize) {
    this._factor = this.width / minCanvasSize;

    if (this.height / this._factor > maxCanvasSize) {
      this._factor = this.height / maxCanvasSize;
    }
  } else if (this.height < this.width && this.height < minCanvasSize) {
    this._factor = this.height / minCanvasSize;

    if (this.width / this._factor > maxCanvasSize) {
      this._factor = this.width / maxCanvasSize;
    }
  }

  this.width = this.width / this._factor;
  this.height = this.height / this._factor;
};

HeatmapImageryProvider.prototype._getContainer = function(width, height, id) {
  let c = document.createElement("div");
  if (id) {
    c.setAttribute("id", id);
  }
  c.setAttribute("style", "width: " + width + "px; height: " + height + "px; margin: 0px; display: none;");
  document.body.appendChild(c);

  return c;
};

/**
 * Set an array of WGS84 locations.
 *
 * @param {Number} min The minimum allowed value for the data points.
 * @param {Number} max The maximum allowed value for the data points.
 * @param {Array} data An array of data points with WGS84 coordinates(x=lon, y=lat) and value
 * @returns {Boolean} Wheter or not the data was successfully added or failed.
 */
HeatmapImageryProvider.prototype._setWGS84Data = function(min, max, data) {
  if (data && data.length > 0 &&
      min !== null && min !== false &&
      max !== null && max !== false) {
    let convdata = [];

    for (let i = 0; i < data.length; i++) {
      let gp = data[i];

      let hp = this._wgs84ToHeatmapPoint(gp);
      if (gp.value || gp.value === 0) { hp.value = gp.value; }

      convdata.push(hp);
    }

    this._heatmap.setData({
      min: min,
      max: max,
      data: convdata
    });

    return true;
  }

  return false;
};

/**
 * Convert a WGS84 location to the corresponding heatmap location.
 *
 * @param {Object} point The WGS84 location.
 * @param {Number} [point.x] The longitude of the location.
 * @param {Number} [point.y] The latitude of the location.
 * @returns {Object} The corresponding heatmap location.
 */
HeatmapImageryProvider.prototype._wgs84ToHeatmapPoint = function(point) {
  return this._mercatorToHeatmapPoint(this._wgs84ToMercator(point));
};

/**
 * Convert a mercator location to the corresponding heatmap location.
 *
 * @param {Object} point The Mercator lcation.
 * @param {Number} [point.x] The x of the location.
 * @param {Number} [point.y] The y of the location.
 * @returns {Object} The corresponding heatmap location.
 */
HeatmapImageryProvider.prototype._mercatorToHeatmapPoint = function(point) {
  let pn = {};

  pn.x = Math.round((point.x - this._xoffset) / this._factor + this._spacing);
  pn.y = Math.round((point.y - this._yoffset) / this._factor + this._spacing);
  pn.y = this.height - pn.y;

  return pn;
};

/**
 * Convert a WGS84 location into a Mercator location.
 *
 * @param {Object} point The WGS84 location.
 * @param {Number} [point.x] The longitude of the location.
 * @param {Number} [point.y] The latitude of the location.
 * @returns {Cesium.Cartesian3} The Mercator location.
 */
HeatmapImageryProvider.prototype._wgs84ToMercator = function(point) {
  return this._wmp.project(fromDegrees(point.x, point.y));
};

/**
 * Convert radians into degrees.
 *
 * @param {Number} radians The radians to be converted to degrees.
 * @returns {Number} The converted degrees.
 */
HeatmapImageryProvider.prototype._rad2deg = function(radians) {
  return (radians / (Math.PI / 180.0));
};

/**** 公有函数 ****/
/**
 * Convert a WGS84 bounding box into a Mercator bounding box.
 *
 * @param {Object} bounds The WGS84 bounding box.
 * @param {Number} [bounds.north] The northernmost position.
 * @param {Number} [bounds.south] The southrnmost position.
 * @param {Number} [bounds.east] The easternmost position.
 * @param {Number} [bounds.west] The westernmost position.
 * @returns {Object} The Mercator bounding box containing north, south, east and west properties.
 */
HeatmapImageryProvider.prototype.wgs84ToMercatorBBox = function(bounds) {
  let ne = this._wmp.project(fromDegrees(bounds.east, bounds.north));
  let sw = this._wmp.project(fromDegrees(bounds.west, bounds.south));
  return {
    north: ne.y,
    south: sw.y,
    east: ne.x,
    west: sw.x
  };
};

/**
 * Convert a Mercator bounding box into a WGS84 bounding box.
 *
 * @param {Object} bounds The Mercator bounding box.
 * @param {Number} [bounds.north] The northernmost position.
 * @param {Number} [bounds.south] The southrnmost position.
 * @param {Number} [bounds.east] The easternmost position.
 * @param {Number} [bounds.west] The westernmost position.
 * @returns {Object} The WGS84 bounding box containing north, south, east and west properties.
 */
HeatmapImageryProvider.prototype.mercatorToWgs84BBox = function(bounds) {
  let sw = this._wmp.unproject(new Cartesian3(bounds.west, bounds.south));
  let ne = this._wmp.unproject(new Cartesian3(bounds.east, bounds.north));
  return {
    north: this._rad2deg(ne.latitude),
    east: this._rad2deg(ne.longitude),
    south: this._rad2deg(sw.latitude),
    west: this._rad2deg(sw.longitude)
  };
};

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
HeatmapImageryProvider.prototype.getTileCredits = function(x, y, level) {
  return undefined;
};

/**
 * Requests the image for a given tile.  This function should
 * not be called before {@link HeatmapImageryProvider#ready} returns true.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @returns {Promise} A promise for the image that will resolve when the image is available, or
 *          undefined if there are too many active requests to the server, and the request
 *          should be retried later.  The resolved image may be either an
 *          Image or a Canvas DOM object.
 *
 * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
 */
HeatmapImageryProvider.prototype.requestImage = function(x, y, level) {
  if (!this._ready) {
    throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
  }

  return this._image;
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
 * @return {Promise} A promise for the picked features that will resolve when the asynchronous
 *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
 *                   instances.  The array may be empty if no features are found at the given location.
 *                   It may also be undefined if picking is not supported.
 */
HeatmapImageryProvider.prototype.pickFeatures = function() {
  return undefined;
};

export default HeatmapImageryProvider;
