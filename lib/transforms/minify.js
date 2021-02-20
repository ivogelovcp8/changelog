/* global dev */

const extname = require("path").extname;
const htmlmin = require("./htmlminify");
const jsmin = require("./jsminify");

module.exports = async (content, outputPath) =>
{
  if (dev) return content;

  switch (extname(outputPath))
  {
    case ".html":
      return htmlmin(content, outputPath);
    case ".js":
      return jsmin(content, outputPath);
    default:
      return content;
  }
};
