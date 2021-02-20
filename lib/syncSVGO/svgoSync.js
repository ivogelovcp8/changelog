'use strict';

const
  CONFIG = require('svgo/lib/svgo/config.js'),
  SVG2JSSYNC = require('./svg2jsSync.js'),
  PLUGINS = require('svgo/lib/svgo/plugins.js'),

  JSAPI = require('svgo/lib/svgo/jsAPI.js'),
  encodeSVGDatauri = require('svgo/lib/svgo/tools.js').encodeSVGDatauri,
  JS2SVG = require('svgo/lib/svgo/js2svg.js');

const SVGO = function(config)
{
  this.config = CONFIG(config);
};

SVGO.prototype.optimizeSync = function(svgstr, info)
{
  info = info || {};
  if (this.config.error)
  {
    throw this.config.error;
  }

  let
    counter = 0,
    prevResultSize = Number.POSITIVE_INFINITY,
    svgjs = this._optimizeOnceSync(svgstr, info);
  const
    config = this.config,
    maxPassCount = config.multipass ? 10 : 1;

  info.multipassCount = counter;
  while (++counter < maxPassCount && svgjs.data.length < prevResultSize)
  {
    if (svgjs.error) break;
    prevResultSize = svgjs.data.length;
    svgjs = this._optimizeOnceSync(svgjs.data, info);
  }

  if (config.datauri)
  {
    svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
  }
  if (info && info.path)
  {
    svgjs.path = info.path;
  }
  return svgjs;
};

SVGO.prototype._optimizeOnceSync = function(svgstr, info)
{
  const config = this.config;

  let svgjs = SVG2JSSYNC(svgstr);
  if (svgjs.error)
  {
    return svgjs;
  }

  svgjs = PLUGINS(svgjs, info, config.plugins);
  return JS2SVG(svgjs, config.js2svg);
};

SVGO.prototype.createContentItem = function(data)
{
  return new JSAPI(data);
};

SVGO.Config = CONFIG;

module.exports = SVGO;
// Offer ES module interop compatibility.
module.exports.default = SVGO;
