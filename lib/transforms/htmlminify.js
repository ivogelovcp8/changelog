// minify HTML

const minify = require('html-minifier').minify;

module.exports = async (content, outputPath) =>
{
  return minify(content, {
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true,
    collapseWhitespace: true,
    removeComments: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeTagWhitespace: true,
  });
};
