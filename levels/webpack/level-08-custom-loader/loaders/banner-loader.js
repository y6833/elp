const loaderUtils = require('loader-utils');
const validateOptions = require('schema-utils');

// 选项验证 schema
const schema = {
  type: 'object',
  properties: {
    banner: {
      type: 'string'
    },
    author: {
      type: 'string'
    },
    date: {
      type: 'boolean'
    },
    multiline: {
      type: 'boolean'
    }
  },
  additionalProperties: false
};

/**
 * Banner Loader
 * 在文件顶部添加版权信息或注释
 */
module.exports = function(source) {
  // 获取 loader 选项
  const options = loaderUtils.getOptions(this) || {};
  
  // 验证选项
  validateOptions(schema, options, {
    name: 'Banner Loader',
    baseDataPath: 'options'
  });
  
  // 构建 banner 内容
  let banner = '';
  
  if (options.banner) {
    banner = options.banner;
  } else {
    // 默认 banner 内容
    const parts = [];
    
    if (options.author) {
      parts.push(`Author: ${options.author}`);
    }
    
    if (options.date !== false) {
      parts.push(`Generated: ${new Date().toISOString()}`);
    }
    
    parts.push(`File: ${this.resourcePath}`);
    
    banner = parts.join('\\n');
  }
  
  // 格式化注释
  let comment;
  if (options.multiline !== false) {
    // 多行注释格式
    comment = `/**\\n * ${banner.replace(/\\n/g, '\\n * ')}\\n */\\n\\n`;
  } else {
    // 单行注释格式
    comment = `// ${banner.replace(/\\n/g, '\\n// ')}\\n\\n`;
  }
  
  // 返回添加了 banner 的源码
  return comment + source;
};

// 导出 schema 供测试使用
module.exports.schema = schema;