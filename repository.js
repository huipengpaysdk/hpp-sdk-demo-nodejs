var _ = require('underscore')._;
/**
 * 内存中的模拟存储.
 */
var orderCache = [];

module.exports = {
    save: save,
    find: find,
    findAll: findAll
};

/**
 * 更新或插入
 */
function save(order) {
    if (!order.orderNumber) {
        return;
    }

    var _order = _.find(orderCache, function (item) {
        return item.orderNumber == order.orderNumber;
    });

    if (_order) {
        _.extend(_order, order);
    } else {
        orderCache.push(order);
    }

}

/**
 * id查询
 */
function find(id) {
    return _.find(orderCache, function (item) {
        return item.orderNumber == id;
    });
}

/**
 * 全部订单
 */
function findAll() {
    return orderCache;
}
