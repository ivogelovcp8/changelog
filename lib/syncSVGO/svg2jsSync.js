'use strict';

const
  HTMLPARSER = require('htmlparser2'),
  JSAPI = require('svgo/lib/svgo/jsAPI.js'),
  CSSClassList = require('svgo/lib/svgo/css-class-list'),
  CSSStyleDeclaration = require('svgo/lib/svgo/css-style-declaration');

const config = {};

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 */
module.exports = function (data)
{
  const
    root = new JSAPI({
      elem: '#document',
      content: [],
    }),
    stack = [root];
  let
    current = root,
    textContext = null;

  function pushToContent(content)
  {
    content = new JSAPI(content, current);
    (current.content = current.content || []).push(content);
    return content;
  }

  config.onprocessinginstruction = function (name, data)
  {
    pushToContent({
      processinginstruction: data
    });
  };

  config.oncomment = function (comment)
  {
    pushToContent({
      comment: comment.trim()
    });
  };

  config.oncdata = function (cdata)
  {
    pushToContent({
      cdata: cdata
    });
  };

  config.onopentag = function (name, attributes)
  {
    const data = {
      name,
      attributes,
    };
    let elem = {
      elem: data.name,
      attrs: {},
      prefix: '',
      local: '',
    };

    elem.class = new CSSClassList(elem);
    elem.style = new CSSStyleDeclaration(elem);

    if (Object.keys(data.attributes).length)
    {
      for (let attribName in data.attributes)
      {

        if (attribName === 'class')
        { // has class attribute
          elem.class.hasClass();
        }

        if (attribName === 'style')
        { // has style attribute
          elem.style.hasStyle();
        }

        elem.attrs[attribName] = {
          name: attribName,
          value: data.attributes[attribName],
          prefix: '',
          local: '',
        };
      }
    }

    elem = pushToContent(elem);
    current = elem;

    // Save info about <text> tag to prevent trimming of meaningful whitespace
    if (data.name == 'text' && !data.prefix)
    {
      textContext = current;
    }

    stack.push(elem);
  };

  config.ontext = function (text)
  {
    if (/\S/.test(text) || textContext)
    {
      if (!textContext) text = text.trim();
      pushToContent({
        text: text
      });
    }
  };

  config.onclosetag = function ()
  {
    const last = stack.pop();

    // Trim text inside <text> tag.
    if (last == textContext)
    {
      trim(textContext);
      textContext = null;
    }
    current = stack[stack.length - 1];
  };

  config.onerror = function (e)
  {
    e.message = 'Error in parsing SVG: ' + e.message;
    if (e.message.indexOf('Unexpected end') < 0)
    {
      throw e;
    }
  };

  const parser = new HTMLPARSER.Parser(config, {
    decodeEntities: true,
    xmlMode: true,
  });
  parser.write(data);
  parser.end();

  return root;


  function trim(elem)
  {
    if (!elem.content) return elem;

    let
      start = elem.content[0],
      end = elem.content[elem.content.length - 1];

    while (start && start.content && !start.text) start = start.content[0];
    if (start && start.text) start.text = start.text.replace(/^\s+/, '');

    while (end && end.content && !end.text) end = end.content[end.content.length - 1];
    if (end && end.text) end.text = end.text.replace(/\s+$/, '');

    return elem;
  }
};
