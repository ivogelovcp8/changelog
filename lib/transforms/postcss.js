// PostCSS CSS processing

/* global dev */

const
  fs = require('fs'),
  path = require('path'),
  postcss = require('postcss'),
  sass_parser = require('postcss-scss'),
  postcssPlugins = [
    require('postcss-advanced-variables'),
    require('postcss-nested'),
    require('postcss-hexrgba'),
    require('tailwindcss'),
    require('autoprefixer'),
  ];
// CSSnano apparently must be last
if(!dev) postcssPlugins.push(require('cssnano'));

module.exports = async (content, outputPath) =>
{
  if (!String(outputPath).endsWith('.css')) return content;

  if(dev && String(outputPath).endsWith('tailwind.css'))
  {
    if(fs.existsSync(outputPath))
    {
      return fs.readFileSync(outputPath, 'utf8');
    }
  }
  const from = path.basename(outputPath, '.css');
  return (
    await postcss(postcssPlugins).process(content, {
      from: `src/scss/${from}.scss`,
      syntax: sass_parser,
      map: dev ? { inline: true } : false
    })
  ).css;

};
