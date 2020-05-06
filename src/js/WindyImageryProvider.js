import Cesium from 'cesium/Cesium'

let defaultValue = Cesium.defaultValue;
let defined = Cesium.defined;
let DeveloperError = Cesium.DeveloperError;

let defineProperties = Cesium.defineProperties;

let WindyImageryProvider = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let canvas = options.canvas;
  if (!defined(canvas)) {
    throw new DeveloperError('options.canvas is required.');
  }
  let data = options.data;
  if (!defined(data)) {
    throw new DeveloperError('options.data is required.');
  }

  this.VELOCITY_SCALE = 0.011;             // scale for wind velocity (completely arbitrary--this value looks nice)
  this.INTENSITY_SCALE_STEP = 10;          // step size of particle intensity color scale
  this.MAX_WIND_INTENSITY = 40;            // wind velocity at which particle intensity is maximum (m/s)
  this.MAX_PARTICLE_AGE = 100;             // max number of frames a particle is drawn before regeneration
  this.PARTICLE_LINE_WIDTH = 1;            // line width of a drawn particle
  this.PARTICLE_MULTIPLIER = 3;            // particle count scalar (completely arbitrary--this values looks nice) scale: [5, 10, 15, 20, 25, 30, 35, 40]
  this.PARTICLE_REDUCTION = 0.75;          // reduce particle count to this much of normal for mobile devices
  this.FRAME_RATE = 50;                    // desired milliseconds per frame

  this.MAX_TASK_TIME = 1000;					// amount of time before a task yields control (millis)
  this.MIN_SLEEP_TIME = 25;           // amount of time a task waits before resuming (millis)

  this.NULL_WIND_VECTOR = [NaN, NaN, null];  // singleton for no wind in the form: [u, v, magnitude]

  // 定义变量
  //this._viewer = window.globeViewer;
  this._canvas = canvas;
  this._gridData = data;

  this._viewRect = this._cesiumViewRect();
  this._sparseFactor = this._calcSparseFactor();

  this._field = null;
  this._timer = null;
};

/**** 属性 ****/
defineProperties(WindyImageryProvider.prototype, {
});

/**** 私有函数 ****/
/**
 * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
 */
WindyImageryProvider.prototype._isMobile = function() {
  return (/android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i).test(navigator.userAgent);
};

/**
 * @returns {Boolean} true if the specified value is not null and not undefined.
 */
WindyImageryProvider.prototype._isValue = function(x) {
  return x !== null && x !== undefined;
};

/**
 * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
 *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
 */
WindyImageryProvider.prototype._floorMod = function(a, n) {
  return a - n * Math.floor(a / n);
};

WindyImageryProvider.prototype._distortion = function(λ, φ, x, y) {
  let τ = 2 * Math.PI;
  let G = 36e-6;
  let i = λ < 0 ? G : -G
    , a = φ < 0 ? G : -G
    , u = this._cesiumWGS84ToScreen([λ + i, φ])
    , c = this._cesiumWGS84ToScreen([λ, φ + a])
    , s = Math.cos(φ / 360 * τ);

  return [(u[0] - x) / i / s, (u[1] - y) / i / s, (c[0] - x) / a, (c[1] - y) / a];
};

/**
 * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
 * vector is modified in place and returned by this function.
 */
WindyImageryProvider.prototype._distort = function(λ, φ, x, y, scale, wind) {
  let u = wind[0] * scale;
  let v = wind[1] * scale;

  let d = this._distortion(λ, φ, x, y);
  // Scale distortion vectors by u and v, then add.
  wind[0] = d[0] * u + d[2] * v;
  wind[1] = d[1] * u + d[3] * v;

  return wind;
};

WindyImageryProvider.prototype._cesiumView2D = function() {
  let viewer = window.globeViewer;
  let canvas = viewer.canvas;

  let e, t, a, n;
  let r = canvas.width / 2;
  let o = canvas.height / 2;
  let s, c;
  for (s = r, c = 0; c < canvas.height; c++) {
    if (e = i(s, c)) {
      e = e[1];
      break;
    }
  }
  for (s = r, c = canvas.height - 1; c >= 0; c--) {
    if (t = i(s, c)) {
      t = t[1];
      break;
    }
  }
  for (s = 0, c = o; s < canvas.width; s++) {
    if (a = i(s, c)) {
      a = a[0];
      break;
    }
  }
  for (s = canvas.width, c = o; s >= 0; s--) {
    if (n = i(s, c)) {
      n = n[0];
      break;
    }
  }

  return {
    east: n,
    west: a,
    north: e,
    south: t
  };
};

WindyImageryProvider.prototype._cesiumViewRect = function() {
  let east, west, north, south;

  let viewer = window.globeViewer;
  let camera = viewer.scene.camera;
  let r = (viewer.scene.mapProjection.ellipsoid, camera.computeViewRectangle(viewer.scene.globe.ellipsoid));

  return r ? (east = 360 * r.east / 2 / Math.PI,
    west = 360 * r.west / 2 / Math.PI,
    north = 360 * r.north / 2 / Math.PI,
    south = 360 * r.south / 2 / Math.PI) : (r = this._cesiumView2D(),
    east = r.east,
    west = r.west,
    north = r.north,
    south = r.south),
    {
      east: east,
      west: west,
      north: north,
      south: south
    }
};

WindyImageryProvider.prototype._calcSparseFactor = function() {
  let viewRect = this._viewRect;

  let minRange = Math.min(Math.abs(viewRect.east - viewRect.west), Math.abs(viewRect.north - viewRect.south));
  return Math.sqrt(minRange / 90);
};

WindyImageryProvider.prototype._cesiumScreenToWGS84 = function(x, y) {
  let viewer = window.globeViewer;
  let point = {
    x: x,
    y: y
  };
  let scene = viewer.scene;
  let cartesian = viewer.camera.pickEllipsoid(point, scene.globe.ellipsoid);
  if (cartesian) {
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);

    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude)
    ];
  }
};

WindyImageryProvider.prototype._cesiumWGS84ToScreen = function(point) {
  let viewer = window.globeViewer;
  let scene = viewer.scene;

  let lonLat = Cesium.Cartesian3.fromDegrees(point[0], point[1]);
  let coord = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, lonLat);

  return [coord.x, coord.y]
};

WindyImageryProvider.prototype._bilinearInterpolateVector = function(x, y, g00, g10, g01, g11) {
  let rx = (1 - x);
  let ry = (1 - y);
  let a = rx * ry,  b = x * ry,  c = rx * y,  d = x * y;

  let u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
  let v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;

  return [u, v, Math.sqrt(u * u + v * v)];
};

WindyImageryProvider.prototype._createWindBuilder = function(uComp, vComp) {
  let uData = uComp.data;
  let vData = vComp.data;

  return {
    header: uComp.header,
    data: function(i) {
      return [uData[i], vData[i]];
    },
    interpolate: this._bilinearInterpolateVector
  }
};

WindyImageryProvider.prototype._createBuilder = function(data) {
  let uComp = null, vComp = null, scalar = null;

  data.forEach(function(record) {
    switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
      case "2,2":
        uComp = record;
        break;
      case "2,3":
        vComp = record;
        break;
      default:
        scalar = record;
    }
  });

  return this._createWindBuilder(uComp, vComp);
};

/**
 * Build grid
 */
WindyImageryProvider.prototype._buildGrid = function (data, callback) {
  // Create builder
  let builder = this._createBuilder(data);

  let header = builder.header;
  let λ0 = header.lo1, φ0 = header.la1;  // the grid's origin (e.g., 0.0E, 90.0N)
  let Δλ = header.dx, Δφ = header.dy;  // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
  let ni = header.nx, nj = header.ny;      // number of grid points W-E and N-S (e.g., 144 x 73)

  let date = new Date(header.refTime);
  date.setHours(date.getHours() + header.forecastTime);

  // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
  // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
  let grid = [], p = 0;
  let isContinuous = Math.floor(ni * Δλ) >= 360;
  for (let j = 0; j < nj; j++) {
    let row = [];
    for (let i = 0; i < ni; i++, p++) {
      row[i] = builder.data(p);
    }
    if (isContinuous) {
      // For wrapped grids, duplicate first column as last column to simplify interpolation logic
      row.push(row[0]);
    }
    grid[j] = row;
  }

  let that = this;
  function interpolate(λ, φ) {
    let i = that._floorMod(λ - λ0, 360) / Δλ;  // calculate longitude index in wrapped range [0, 360)
    let j = (φ0 - φ) / Δφ;                      // calculate latitude index in direction +90 to -90

    let fi = Math.floor(i), ci = fi + 1;
    let fj = Math.floor(j), cj = fj + 1;

    let row;
    if ((row = grid[fj])) {
      let g00 = row[fi];
      let g10 = row[ci];
      if (that._isValue(g00) && that._isValue(g10) && (row = grid[cj])) {
        let g01 = row[fi];
        let g11 = row[ci];
        if (that._isValue(g01) && that._isValue(g11)) {
          // All four points found, so interpolate the value.
          return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }
    return null;
  }
  callback({
    date: date,
    interpolate: interpolate
  });
};

WindyImageryProvider.prototype._createField = function(columns, bounds, callback) {
  let that = this;
  /**
   * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
   *          is undefined at that point.
   */
  function field(x, y) {
    let column = columns[Math.round(x)];
    return column && column[Math.round(y)] || that.NULL_WIND_VECTOR;
  }

  /**
   * @returns {boolean} true if the field is valid at the point (x, y)
   */
  field.isDefined = function(x, y) {
    return field(x, y)[2] !== null;
  };

  /**
   * @returns {boolean} true if the point (x, y) lies inside the outer boundary of the vector field, even if
   *          the vector field has a hole (is undefined) at that point, such as at an island in a field of
   *          ocean currents.
   */
  field.isInsideBoundary = function(x, y) {
    return field(x, y) !== that.NULL_WIND_VECTOR;
  };

  // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
  // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.
  field.release = function() {
    columns = [];
  };

  field.randomize = function(o) {  // UNDONE: this method is terrible
    let x, y;
    let safetyNet = 0;
    do {
      x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
      y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y);

    } while (field(x, y)[2] === null && safetyNet++ < 30);
    o.x = x;
    o.y = y;

    return o;
  };

  callback(bounds, field);
};

WindyImageryProvider.prototype._interpolateField = function (grid, bounds, callback) {
  let scale = 1/40000;
  let velocityScale = bounds.height * scale * Math.min(3.0, this._sparseFactor);

  let columns = [];
  let x = bounds.x;

  debugger;
  let that = this;
  function interpolateColumn(x) {
    let column = [];
    for (let y = bounds.y; y <= bounds.yMax; y += 2) {
      // 屏幕坐标转地理坐标
      let coord = that._cesiumScreenToWGS84(x, y);
      if (coord) {
        let λ = coord[0], φ = coord[1];
        if (isFinite(λ)) {
          let wind = grid.interpolate(λ, φ);
          if (wind) {
            wind = that._distort(λ, φ, x, y, velocityScale, wind);
            column[y + 1] = column[y] = wind;
          }
        }
      }
    }
    columns[x + 1] = columns[x] = column;
  }

  (function batchInterpolate() {
    let start = Date.now();
    while (x < bounds.width) {
      interpolateColumn(x);
      x += 2;
      if ((Date.now() - start) > that.MAX_TASK_TIME) {
        // Interpolation is taking too long. Schedule the next batch for later and yield
        setTimeout(batchInterpolate, that.MIN_SLEEP_TIME);
        return;
      }
    }
    that._createField(columns, bounds, callback);
  })();
};

WindyImageryProvider.prototype._buildBounds = function(bounds, width, height) {
  let upperLeft = bounds[0];
  let lowerRight = bounds[1];
  let x = Math.round(upperLeft[0]);
  let y = Math.max(Math.floor(upperLeft[1], 0), 0);
  let xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
  let yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);

  return {x: x, y: y, xMax: xMax, yMax: yMax, width: width, height: height};
};

WindyImageryProvider.prototype._animate = function(bounds, field) {

  function hexToR(h) { return parseInt((cutHex(h)).substring(0,2),16); }
  function hexToG(h) { return parseInt((cutHex(h)).substring(2,4),16); }
  function hexToB(h) { return parseInt((cutHex(h)).substring(4,6),16); }
  function cutHex(h) { return (h.charAt(0) === "#") ? h.substring(1,7) : h; }

  function windIntensityColorScale(step, maxWind) {
    let result = [
      //blue to red
      "rgba(" + hexToR('#178be7') + ", " + hexToG('#178be7') + ", " + hexToB('#178be7') + ", " + 1 + ")",
      "rgba(" + hexToR('#8888bd') + ", " + hexToG('#8888bd') + ", " + hexToB('#8888bd') + ", " + 1 + ")",
      "rgba(" + hexToR('#b28499') + ", " + hexToG('#b28499') + ", " + hexToB('#b28499') + ", " + 1 + ")",
      "rgba(" + hexToR('#cc7e78') + ", " + hexToG('#cc7e78') + ", " + hexToB('#cc7e78') + ", " + 1 + ")",
      "rgba(" + hexToR('#de765b') + ", " + hexToG('#de765b') + ", " + hexToB('#de765b') + ", " + 1 + ")",
      "rgba(" + hexToR('#ec6c42') + ", " + hexToG('#ec6c42') + ", " + hexToB('#ec6c42') + ", " + 1 + ")",
      "rgba(" + hexToR('#f55f2c') + ", " + hexToG('#f55f2c') + ", " + hexToB('#f55f2c') + ", " + 1 + ")",
      "rgba(" + hexToR('#fb4f17') + ", " + hexToG('#fb4f17') + ", " + hexToB('#fb4f17') + ", " + 1 + ")",
      "rgba(" + hexToR('#fe3705') + ", " + hexToG('#fe3705') + ", " + hexToB('#fe3705') + ", " + 1 + ")",
      "rgba(" + hexToR('#ff0000') + ", " + hexToG('#ff0000') + ", " + hexToB('#ff0000') + ", " + 1 + ")"];

    result.indexFor = function(m) {  // map wind speed to a style
      return Math.floor(Math.min(m, maxWind) / maxWind * (result.length - 1));
    };

    return result;
  }

  let colorStyles = windIntensityColorScale(this.INTENSITY_SCALE_STEP, this.MAX_WIND_INTENSITY);
  let buckets = colorStyles.map(function() { return []; });

  let particleCount = Math.round(bounds.width * this.PARTICLE_MULTIPLIER);
  console.log(particleCount);
  if (this._isMobile()) {
    particleCount *= this.PARTICLE_REDUCTION;
  }

  let fadeFillStyle = "rgba(255, 0, 0, 0.95)";

  let particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(field.randomize({age: Math.floor(Math.random() * this.MAX_PARTICLE_AGE) + 0}));
  }

  let that = this;
  function evolve() {
    buckets.forEach(function(bucket) { bucket.length = 0; });
    particles.forEach(function(particle) {
      if (particle.age > that.MAX_PARTICLE_AGE) {
        field.randomize(particle).age = 0;
      }
      let x = particle.x;
      let y = particle.y;
      let v = field(x, y);  // vector at current position
      let m = v[2];
      if (m === null) {
        particle.age = that.MAX_PARTICLE_AGE;  // particle has escaped the grid, never to return...
      }
      else {
        let xt = x + v[0]/3.0;
        let yt = y + v[1]/3.0;
        if (field(xt, yt)[2] !== null) {
          // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
          particle.xt = xt;
          particle.yt = yt;
          buckets[colorStyles.indexFor(m)].push(particle);
        }
        else {
          // Particle isn't visible, but it still moves through the field.
          particle.x = xt;
          particle.y = yt;
        }
      }
      particle.age += 1;
    });
  }

  let g = this._canvas.getContext("2d");
  g.lineWidth = this.PARTICLE_LINE_WIDTH;
  g.fillStyle = fadeFillStyle;

  function draw() {
    // Fade existing particle trails.
    let prev = g.globalCompositeOperation;
    g.globalCompositeOperation = "destination-in";
    g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    g.globalCompositeOperation = prev;

    // Draw new particle trails.
    buckets.forEach(function(bucket, i) {
      if (bucket.length > 0) {
        g.beginPath();
        g.strokeStyle = colorStyles[i];

        bucket.forEach(function(particle) {
          g.moveTo(particle.x, particle.y);
          g.lineTo(particle.xt, particle.yt);
          particle.x = particle.xt;
          particle.y = particle.yt;
        });
        g.stroke();
      }
    });
  }

  (function frame() {
    try {
      that._timer = setTimeout(function() {
        requestAnimationFrame(frame);
        evolve();
        draw();
      }, 1000 / that.FRAME_RATE);
    } catch (e) {
      console.error(e);
    }
  })();
};

/**** 公有函数 ****/
/**
 * Start
 */
WindyImageryProvider.prototype.start = function(bounds, width, height) {
  // stop
  this.stop();

  let that = this;
  this._buildGrid(this._gridData, function(grid) {
    debugger;
    that._interpolateField(grid, that._buildBounds(bounds, width, height), function (bounds, field) {
      that._field = field;
      that._animate(bounds, field);
    });
  });

  return true;
};

/**
 * Stop
 */
WindyImageryProvider.prototype.stop = function() {
  if (this._field) {
    this._field.release();
  }
  if (this._timer) {
    clearTimeout(this._timer);
  }
};

export default WindyImageryProvider;

// shim layer with setTimeout fallback
window.requestAnimationFrame = (function() {
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame  ||
    window.mozRequestAnimationFrame     ||
    window.oRequestAnimationFrame  ||
    window.msRequestAnimationFrame ||
    function( callback ){
      window.setTimeout(callback, 1000 / 50);
    };
})();
