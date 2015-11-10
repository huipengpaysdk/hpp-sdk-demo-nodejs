/**
 * 路由控制
 */
var express = require('express'),
    router = express.Router(),
    logger = require('log4js').getLogger('trade'),
    uuid = require('node-uuid'), //随机订单号
    moment = require('moment'),
    request = require('request'),
    hppConfig = require('./hpp-config'),
    repository = require('./repository'),
    ipUtils = require('./ip-utils'),
    aesUtils = require('./aes-utils').newInstance();

logger.setLevel('DEBUG');

//-----------------------------routers----------------------------//

// 订单明细列表
router.get('/orders', function(req, res) {
    res.render('order-list.html', {
        data: repository.findAll()
    });
});

//明细跳转
router.get('/jump/:id', function(req, res) {

    if (!req.params.id) {
        return;
    }

    var order = repository.find(req.params.id);

    res.render(
        order.payInterface === 'UNIONPAY_WEB' ? 'form-proxy.html' : 'barcode-proxy.html',
        order.responseData
    );
});

//状态更新
router.get('/order-query/:id', function(req, res) {

    if (!req.params.id) {
        return;
    }

    var order = repository.find(req.params.id);

    if (order.status == 'NOTIFY_CONFIRM') {
        logger.warn('订单[%s]已完成,无需重新处理...', req.params.id);
        res.redirect('/orders');
        return;
    }

    var queryRequest = {
        tradeSn: order.responseData.tradeSn
    };

    logger.warn('开始查询订单[%s]的状态', queryRequest.tradeSn);
    makeHppRequest(
        hppConfig.urlOfOrderQuery, queryRequest,
        function(error, body) {
            res.render('error.html', JSON.parse(body));
        },
        function(responseData) {
            order.status = responseData.status;
            res.redirect('/orders');
        }
    );
});


// API异步支付
router.post('/pay', function(req, res) {
    var orderNumber = uuid.v1();

    var payRequest = {
        appId: 'CA_APP-ID-0001',
        payInterface: req.body.pay_interface,
        orderNumber: orderNumber, //订单号
        orderSubject: 'nodejs-demo-1分钱支付体验', //订单标题
        orderDescribe: req.body.order_describe, //订单信息,汇鹏入单用
        amount: req.body.order_amount, //order_amount 该订单交易金额
        customerIp: ipUtils.formatV4(req), //防钓鱼,customer_ip 持卡人IP
        returnUrl: 'http://127.0.0.1:3000/callback/return/' + orderNumber //回调地址
    };

    logger.warn('商户订单[%s]签名完成,开始使用proxy进行请求输出', orderNumber);
    makeHppRequest(
        hppConfig.urlOfPay, payRequest,
        function(error, body) {
            res.render('error.html', JSON.parse(body));
        },
        function(responseData) {
            payRequest.status = 'TRADE_CREATED';
            payRequest.createOn = moment().format('YY-MM-DD HH:mm:ss');
            payRequest.responseData = responseData;
            repository.save(payRequest);
            res.json({
                orderNumber: payRequest.orderNumber
            });
        }
    );
});

//前端控制用户页面跳转
router.post('/callback/return/:id', function(req, res) {
    var _id = req.params.id;
    logger.warn('收到订单[%s]的跳转响应', _id);

    var _order = repository.find(_id);
    if (_order.status != 'NOTIFY_CONFIRM') {
        logger.warn('订单[%s]尚未收到入账响应,进行主动查询', _id);
        res.redirect('/order-query/' + _id);
        return;
    }

    logger.warn('[%s]跳转响应完成,开始输出付款完成界面', _id);
    res.render('pay-result.html', req.body);
});

//后端通知入库查询
router.all('/callback/notify', function(req, res) {
    var notifyData = aesUtils.decrypt(req.body, hppConfig.signToken);
    var notifyObj = JSON.parse(notifyData);
    logger.warn('收到[%s][%s]入账响应', notifyObj.payInterface, notifyObj.orderNumber);

    if (notifyObj.status == 'NOTIFY_CONFIRM') {
        logger.warn('订单[%s]已支付成功', notifyObj.orderNumber);
        var _order = repository.find(notifyObj.orderNumber);

        if (_order) {
            _order.status = notifyObj.status;

            logger.warn('[%s][%s]跳转响应完成,开始发货...', notifyObj.payInterface, notifyObj.orderNumber);
        }
    }

    res.status(200).end();//输出一个200信号,表示入账成功
});


/**
 * 发送hpp加密请求
 * @param url 请求地址
 * @param requestBody 请求体
 * @param onError 错误的回调
 * @param onSuccess 成功的回调
 */
function makeHppRequest(url, requestBody, onError, onSuccess) {

    //AES加密
    var encrypted = aesUtils.encrypt(JSON.stringify(requestBody), hppConfig.signToken);

    request.post({
        rejectUnauthorized: false, //https模块的传递参数,测试环境下的证书过期异常
        url: url,
        body: encrypted,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0', //伪造一个请求头
            'X-mt-sno': hppConfig.xMtSno
        }
    }, function(error, response, body) {
        if (error || response.statusCode != 200) {
            logger.error('请求错误[%s]', error);
            onError(error, body);
        }

        if (!error && response.statusCode == 200) {
            logger.debug('响应成功,开始AES解密');
            var responseData = JSON.parse(aesUtils.decrypt(body, hppConfig.signToken));
            onSuccess(responseData);
        }
    });

}


module.exports = router;
