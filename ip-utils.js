/**
 * 针对ipv6地址的格式化方法
 */

module.exports = {
    formatV4: formatV4
};

function formatV4(req) {
    var ip = req.ip;
    console.log('ip is:' + ip);
    console.log('ip startsWith:' + ip.startsWith);
    if (ip.indexOf('::') === 0) { //ipv6前缀
        var ips = ip.split(':');
        var finalOne = ips[ips.length - 1];
        if (finalOne === 1 || finalOne.indexOf('.') === -1) {
            return '127.0.0.1';
        }
        return finalOne;
    }

    return ip;
}
