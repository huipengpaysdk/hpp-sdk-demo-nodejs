var aesUtils = require('./aes-utils.js').newInstance();

var key = '1rJTjxpz+L7oWOLYUeDCdg==';
var content = '中文test';

var encrypted = aesUtils.encrypt(content, key);
console.log('encrypted after:=>' + encrypted);
console.log('source:=>' + aesUtils.decrypt(encrypted, key));
