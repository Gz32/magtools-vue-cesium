import Cesium from 'cesium/Cesium'
import Windy from './Windy'

let defaultValue = Cesium.defaultValue;
let defined = Cesium.defined;
let DeveloperError = Cesium.DeveloperError;
let WebMercatorProjection = Cesium.WebMercatorProjection;
let CesiumEvent = Cesium.Event;
let CesiumCredit = Cesium.Credit;

let defineProperties = Cesium.defineProperties;

/** 构造函数 **/
let WindImageryProvider = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  debugger;
  let data = options.data;
  if (!defined(data)) {
    throw new DeveloperError('data is required.');
  }
  let canvas = options.canvas;
  if (!defined(canvas)) {
    throw new DeveloperError('canvas is required.');
  }

  this._data = data;
  this._canvas = canvas;

  this._wmp = new WebMercatorProjection();
  this._errorEvent = new CesiumEvent();

  let credit = defaultValue(options.credit, new CesiumCredit('WMTS'));
  if (typeof credit === 'string') {
    credit = new CesiumCredit(credit);
  }
  this._credit = credit;
  this._texture = undefined;

  let viewer = window.globeViewer;
  // Initialize windy
  this._windy = new Windy({ viewer: viewer, canvas: canvas, data: data });
  if (!this._windy) {
    throw new DeveloperError('fail to init windy.');
  }

  this._width = viewer.canvas.width;
  this._height = viewer.canvas.height;
  this._image = canvas;

  this._ready = true;
};

/**** 属性 ****/
defineProperties(WindImageryProvider.prototype, {
  url : { get : function() {
      return this._url;
    }},

  proxy : { get : function() {
      return this._proxy;
    }},

  errorEvent : { get : function() {
      return this._errorEvent;
    }},

  ready : { get : function() {
      return this._ready;
    }},

  credit : { get : function() {
      return this._credit;
    }},

  tileWidth : { get : function() {
      if (!this._ready) {
        throw new Cesium.DeveloperError('imagery provider is not ready, cannot call tileWidth.');
      }
      return this._tileWidth;
    }},
  tileHeight : { get : function() {
      if (!this._ready) {
        throw new Cesium.DeveloperError('imagery provider is not ready, cannot call tileHeight.');
      }
      return this._tileHeight;
    }},

  minimumLevel : { get : function() {
      if (!this._ready) {
        throw new Cesium.DeveloperError('imagery provider is not ready, cannot call minimumLevel.');
      }
      return this._minimumLevel;
    }},
  maximunLevel : { get : function() {
      if (!this._ready) {
        throw new Cesium.DeveloperError('imagery provider is not ready, cannot call maximunLevel.');
      }
      return this._maximumLevel;
    }},

  tilingScheme : { get : function() {
      if (!this._ready) {
        throw new Cesium.DeveloperError('imagery provider is not ready, cannot call tilingScheme.');
      }
      return this._tilingScheme;
    }},

  tileDiscardPolicy : { get : function() {
      if (!this._ready) {
        throw new Cesium.DeveloperError('imagery provider is not ready, cannot call tileDiscardPolicy.');
      }
      return undefined;
    }},

  hasAlphaChannel : { get : function() {
      return true;
    }}
});


WindImageryProvider.prototype.start = function(bounds, width, height) {
  debugger;
  return this._windy.start(bounds, width, height);
};

WindImageryProvider.prototype.stop = function() {
  this._windy.stop();
};

export default WindImageryProvider;
