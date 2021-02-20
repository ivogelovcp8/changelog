const
  fs = require('fs'),
  path = require('path'),
  rimraf = require('rimraf'),
  markdownIt = require("markdown-it"),
  nunjuck = require('nunjucks'),
  getSVG = require('./lib/filters/getsvg'),
  dev = global.dev = process.argv.includes('--serve'),
  bust = Date.now();

module.exports = config =>
{
  const md = new markdownIt({
    html: true,
    breaks: true,
  });
  md.disable(['code'], true);
  config.setDataDeepMerge(true);
  /// config.setQuietMode(true);
  config.addPassthroughCopy({
    './src/admin/config.yml': '/admin/config.yml',
  });
  config.addPassthroughCopy('./assets');
  config.addWatchTarget('assets');
  // config.addWatchTarget('./src/js/');
  config.addWatchTarget('./src/scss/');

  config.addPairedShortcode("java", (content) => content); // we want to postprocess JavaScript (lib/transforms/minify)
  config.addPairedShortcode("markdown", content =>
  {
    return md.render(content);
  });

  config.addShortcode("version", () => String(bust)); // poor man's cache busting
  /*
  "_permalink": "{% slugify 0, page.filePathStem, page.fileSlug, page.fileSlug | kebab | slug %}.html"
  config.addShortcode('slugify', function (skip, path, stem, slug)
  {
    const folders = path.replace(stem, slug).split('/');
    return '/' + folders.slice(skip + 1).join('/');
  });

  config.addFilter('kebab', function (value)
  {
    return value.replace(/([a-z0-9])([A-Z])/g, function replacer(match, p1, p2)
    {
      return p1 + '-' + p2.toLowerCase();
    }).toLowerCase();
  });
  */
  config.addFilter('svgContent', svgContentFilter);
  config.addFilter('includes', includesFilter);
  config.addFilter('pageUrl', pageUrlFilter);
  config.addFilter('render', function(content, context)
  {
    // 11ty does not preprocess Directory Data files; it does preprocess Global Data files - but the only variable that is exposed there is "pkg", not very useful
    // we need to preprocess the data files ourselves
    // context is an object and should provide all variables that we expect to meet in the data file(s)
    const env = nunjuck.configure({autoescape: true});
    env.addFilter('pageUrl', pageUrlFilter);
    env.addFilter('includes', includesFilter);
    env.addFilter('svgContent', svgContentFilter);
    return nunjuck.renderString(content || '', context);
  });

  config.addCollection('pageNames', collectionApi =>
  {
    // build a map to allow referencing pages by their "name" attribute from the Front Matter
    const result = {};
    collectionApi.getAll().forEach(page =>
    {
      const ident = page.data.name;
      if (ident) result[ident] = page;
    });
    return result;
  });

  config.addTransform('postcss', require('./lib/transforms/postcss'));
  config.addTransform('minify', require('./lib/transforms/minify'));

  // 11ty defaults
  const output = (dev ? path.join(path.normalize(process.env.TEMP), 'eleventy') : path.resolve('dist')).replace(new RegExp('\\' + path.sep,'g'), '/');
  rimraf.sync(output);

  return {
    dir:
    {
      input: 'src',
      output: output,
    },
    jsDataFileSuffix: '.data',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: false,
  };
};

function pageUrlFilter(page)
{
  return page ? page.data.url || page.url : '';
}

function includesFilter(arr, key, list)
{
  // return pages from the List, sorted in the same order
  const keys = key.split('.');
  const len = keys.length;
  return (arr || []).filter(item =>
  {
    let data = item;
    for(let i = 0; i < len; i++)
    {
      if (typeof data === 'undefined') return false;
      data = data[keys[i]];
    }
    item.sortIncludes = list.indexOf(data);
    return item.sortIncludes !== -1;
  }).sort((a, b) => a.sortIncludes - b.sortIncludes);
}

function svgContentFilter(filename, classes)
{
  const optimized = getSVG(path.join(path.resolve('src'),filename), classes);
  if(optimized.error) throw optimized.error;
  return optimized.data || '';
}
