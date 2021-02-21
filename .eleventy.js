const
  path = require('path'),
  rimraf = require('rimraf'),
  flattenDeep = require('lodash/flattenDeep'),
  lodashGet = require('lodash/get'),
  deburr = require('lodash/deburr'),
  chunk = require('lodash/chunk'),
  slugify = require('slugify'),
  dev = global.dev = process.argv.includes('--serve'),
  bust = Date.now();

/**
 * Get all unique key values from a collection
 *
 * @param {Array} collectionArray - collection to loop through
 * @param {String} key - key to get values from
 */
function getAllKeyValues(collectionArray, key)
{
  // get all values from collection
  let allValues = collectionArray.map((item) =>
  {
    return item.data[key] ? item.data[key] : [];
  });

  // flatten values array
  allValues = flattenDeep(allValues);
  // to lowercase
  allValues = allValues.map((item) => item.toLowerCase());
  // remove duplicates
  allValues = [...new Set(allValues)];
  // order alphabetically
  allValues = allValues.sort((a, b) =>
  {
    return a.localeCompare(b, "en", { sensitivity: "base" });
  });
  return allValues;
}

/**
 * Transform a string into a slug
 * Uses slugify package
 *
 * @param {String} str - string to slugify
 */
function strToSlug(str)
{
  const options = {
    replacement: "-",
    remove: /[&,+()$~%.'":*?<>{}]/g,
    lower: true
  };

  return slugify(str, options);
}

/**
 * Select all objects in an array
 * where the path includes the value to match
 * capitalisation and diacritics are removed from compared values
 *
 * @param {Array} arr - array of objects to inspect
 * @param {String} path - path to inspect for each object
 * @param {String} value - value to match
 * @return {Array} - new array
 */
function filterInclude(arr, path, value)
{
  value = deburr(value).toLowerCase();
  return arr.filter((item) => deburr(lodashGet(item, path)).toLowerCase().includes(value));
}

module.exports = config =>
{
  config.setDataDeepMerge(true);
  config.addPassthroughCopy({
    './src/admin/config.yml': '/admin/config.yml',
  });
  config.addPassthroughCopy('./assets');
  config.addWatchTarget('assets');
  config.addWatchTarget('./src/scss/');

  config.addCollection('changelog', collectionApi =>
  {
    const result = [];
    collectionApi.getAll().forEach(page =>
    {
      if (page.data.changelog)
      {
        result.push({
          title: page.data.title,
          description: page.data.description,
          date: page.data.date || page.date,
          url: page.data.nameISP.website + page.url,
        });
      }
    });
    return result;
  });
  // create blog categories collection
  config.addCollection("blogCategories", collection =>
  {
    const allCategories = getAllKeyValues(collection.getFilteredByTag('posts'),"category");
    return allCategories.map((category) => ({
      title: category.substr(0, 1).toUpperCase() + category.substr(1),
      slug: strToSlug(category)
    }));
  });

  // https://www.webstoemp.com/blog/basic-custom-taxonomies-with-eleventy/
  // 2-level pagination solution - first by category, then by posts
  // create flattened paginated blogposts per categories collection
  // based on Zach Leatherman's solution - https://github.com/11ty/eleventy/issues/332
  config.addCollection("postsByCategory", collection =>
  {
    const itemsPerPage = 1;
    const postsByCategory = [];
    const allBlogposts = collection.getFilteredByTag('posts').reverse();
    const blogCategories = getAllKeyValues(allBlogposts, "category");

    // walk over each unique category
    blogCategories.forEach((category) =>
    {
      const sanitizedCategory = deburr(category).toLowerCase();
      // create array of posts in that category
      const postsInCategory = allBlogposts.filter((post) => deburr(post.data.category || 'No category').toLowerCase() == sanitizedCategory);

      // chunk the array of posts
      let chunkedPostsInCategory = chunk(postsInCategory, itemsPerPage);

      // create array of page slugs
      const pagesSlugs = [];
      for (let i = 0; i < chunkedPostsInCategory.length; i++)
      {
        let categorySlug = strToSlug(category);
        let pageSlug = i > 0 ? `${categorySlug}/${i + 1}` : `${categorySlug}`;
        pagesSlugs.push(pageSlug);
      }

      // create array of objects
      chunkedPostsInCategory.forEach((posts, index) =>
      {
        postsByCategory.push({
          title: category.substr(0, 1).toUpperCase() + category.substr(1),
          slug: pagesSlugs[index],
          pageNumber: index,
          totalPages: pagesSlugs.length,
          pageSlugs:
          {
            all: pagesSlugs,
            next: pagesSlugs[index + 1] || null,
            previous: pagesSlugs[index - 1] || null,
            first: pagesSlugs[0] || null,
            last: pagesSlugs[pagesSlugs.length - 1] || null
          },
          items: posts
        });
      });
    });

    return postsByCategory;
  });

  config.addShortcode("version", () => String(bust)); // poor man's cache busting
  config.addFilter("include", filterInclude);

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
