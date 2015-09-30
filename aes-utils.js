/**
 * AES加解密工具
 */
var crypto = require('crypto');
var _ = require('underscore')._;

module.exports = {
    newInstance: newInstance
};

//默认配置
var defaultOptions = {
    algorithm: 'aes-128-ecb',
    iv: '',
    clearEncoding: 'utf8', //明文编码
    cipherEncoding: 'base64'//密文编码
};

/**
 * 初始化
 */
function newInstance(options) {
    defaultOptions = _.extend(defaultOptions, options);

    return {
        encrypt: aesEncrypt,
        decrypt: aesDecrypt
    };
}


/**
 * AES加密
 * @param content 明文
 * @param key 密钥
 * @return string base64以后的密文
 */
function aesEncrypt(content, key) {
    var cipher = crypto.createCipheriv(defaultOptions.algorithm, base64tobuffer(key), defaultOptions.iv);
    cipher.setAutoPadding(true);

    var cipherChunks = [];
    cipherChunks.push(cipher.update(content, defaultOptions.clearEncoding, defaultOptions.cipherEncoding));
    cipherChunks.push(cipher.final(defaultOptions.cipherEncoding));

    return cipherChunks.join('');
}

/**
 * AES解密
 * @param encrypted 密文
 * @param key 密钥
 */
function aesDecrypt(encrypted, key) {
    var cipher = crypto.createDecipheriv(defaultOptions.algorithm, base64tobuffer(key), defaultOptions.iv);
    cipher.setAutoPadding(true);

    var cipherChunks = [];
    cipherChunks.push(cipher.update(encrypted, defaultOptions.cipherEncoding, defaultOptions.clearEncoding));
    cipherChunks.push(cipher.final(defaultOptions.clearEncoding));

    return cipherChunks.join('');
}

/**
 * 工具方法,将base64格式str解压成buffer
 */
function base64tobuffer(content) {
    return new Buffer(content, "base64");
}