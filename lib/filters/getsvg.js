const fs = require('fs');
const path = require('path');
const SVGO = require('../syncSVGO/svgoSync');

module.exports = function inlineSVG(file, className)
{
  const options = {
    plugins:
      [
        {
          removeXMLNS: true,
        },
        {
          removeViewBox: false,
        },
        {
          cleanupIDs: false,
        },
        {
          removeDimensions: true,
        },
        {
          inlineStyles:
            {
              onlyMatchedOnce: false
            }
        },
      ]
  };
  if (className && className.trim() != '')
  {
    options.plugins.push({
      addClassesToSVGElement:
        {
          classNames: className.split(' '),
        }
    });
  }
  const svgo = new SVGO(options);
  if (path.extname(file) !== '.svg')
  {
    throw new Error('SVG filter requires an SVG filename');
  }

  const data = fs.readFileSync(file, (err, contents) =>
  {
    if (err)
    {
      throw new Error(err);
    }
    return contents;
  });

  return svgo.optimizeSync(data.toString('utf8'));
};
