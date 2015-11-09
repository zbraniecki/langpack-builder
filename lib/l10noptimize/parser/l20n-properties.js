'use strict';

var MAX_PLACEABLES = 100;

var PropertiesParser = {
  patterns: null,
  entryIds: null,

  init: function() {
    this.patterns = {
      comment: /^\s*#|^\s*$/,
      entity: /^([^=\s]+)\s*=\s*(.*)$/,
      multiline: /[^\\]\\$/,
      index: /\{\[\s*(\w+)(?:\(([^\)]*)\))?\s*\]\}/i,
      unicode: /\\u([0-9a-fA-F]{1,4})/g,
      entries: /[^\r\n]+/g,
      controlChars: /\\([\\\n\r\t\b\f\{\}\"\'])/g,
      placeables: /\{\{\s*([^\s]*?)\s*\}\}/,
    };
  },

  parse: function(source) {
    if (!this.patterns) {
      this.init();
    }

    var entries = {};

    var lines = source.match(this.patterns.entries);
    if (!lines) {
      return entries;
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (this.patterns.comment.test(line)) {
        continue;
      }

      while (this.patterns.multiline.test(line) && i < lines.length) {
        line = line.slice(0, -1) + lines[++i].trim();
      }

      var entityMatch = line.match(this.patterns.entity);
      if (entityMatch) {
        try {
          this.parseEntity(entityMatch[1], entityMatch[2], entries);
        } catch (e) {
          throw e;
        }
      }
    }
    return entries;
  },

  parseEntity: function(id, value, entries) {
    var name, key;

    var pos = id.indexOf('[');
    if (pos !== -1) {
      name = id.substr(0, pos);
      key = id.substring(pos + 1, id.length - 1);
    } else {
      name = id;
      key = null;
    }

    var nameElements = name.split('.');

    if (nameElements.length > 2) {
      throw new Error('Error in ID: "' + name + '".' +
          ' Nested attributes are not supported.');
    }

    var attr;
    if (nameElements.length > 1) {
      name = nameElements[0];
      attr = nameElements[1];

      if (attr[0] === '$') {
        throw new Error('Attribute can\'t start with "$"');
      }
    } else {
      attr = null;
    }

    this.setEntityValue(name, attr, key, this.unescapeString(value), entries);
  },

  setEntityValue: function(id, attr, key, rawValue, entries) {
    var value = rawValue.indexOf('{{') > -1 ?
      this.parseString(rawValue) : rawValue;

    var isSimpleValue = typeof value === 'string';
    var root = entries;

    var isSimpleNode = typeof entries[id] === 'string';

    if (!entries[id] && (attr || key || !isSimpleValue)) {
      entries[id] = Object.create(null);
      isSimpleNode = false;
    }

    if (attr) {
      if (isSimpleNode) {
        var val = entries[id];
        entries[id] = Object.create(null);
        entries[id].value = val;
      }
      if (!entries[id].attrs) {
        entries[id].attrs = Object.create(null);
      }
      if (!entries[id].attrs && !isSimpleValue) {
        entries[id].attrs[attr] = Object.create(null);
      }
      root = entries[id].attrs;
      id = attr;
    }

    if (key) {
      isSimpleNode = false;
      if (typeof root[id] === 'string') {
        var val = root[id];
        root[id] = Object.create(null);
        root[id].index = this.parseIndex(val);
        root[id].value = Object.create(null);
      }
      root = root[id].value;
      id = key;
      isSimpleValue = true;
    }

    if (isSimpleValue && (!entries[id] || isSimpleNode)) {
      if (id in root) {
        throw new Error();
      }
      root[id] = value;
    } else {
      if (!root[id]) {
        root[id] = Object.create(null);
      }
      root[id].value = value;
    }
  },

  parseString: function(str) {
    var chunks = str.split(this.patterns.placeables);
    var complexStr = [];

    var len = chunks.length;
    var placeablesCount = (len - 1) / 2;

    if (placeablesCount >= MAX_PLACEABLES) {
      throw new Error('Too many placeables (' + placeablesCount +
                          ', max allowed is ' + MAX_PLACEABLES + ')');
    }

    for (var i = 0; i < chunks.length; i++) {
      if (chunks[i].length === 0) {
        continue;
      }
      if (i % 2 === 1) {
        complexStr.push({type: 'idOrVar', name: chunks[i]});
      } else {
        complexStr.push(chunks[i]);
      }
    }
    return complexStr;
  },

  unescapeString: function(str) {
    if (str.lastIndexOf('\\') !== -1) {
      str = str.replace(this.patterns.controlChars, '$1');
    }
    return str.replace(this.patterns.unicode, function(match, token) {
      return String.fromCodePoint(parseInt(token, 16));
    });
  },

  parseIndex: function(str) {
    var match = str.match(this.patterns.index);
    if (!match) {
      throw new L10nError('Malformed index');
    }
    if (match[2]) {
      return [{
        type: 'call',
        expr: {
          type: 'prop',
          expr: {
            type: 'glob',
            name: 'cldr'
          },
          prop: 'plural',
          cmpt: false
        }, args: [{
          type: 'idOrVar',
          name: match[2]
        }]
      }];
    } else {
      return [{type: 'idOrVar', name: match[1]}];
    }
  },
};

module.exports = PropertiesParser;
