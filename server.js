// Module Dependencies
var http = require('http'),
    express = require('express'),//expresses
    routes = require('./router'),//路由
    expresslogger = require('morgan'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    fs = require('fs'),
    log4js = require('log4js'),
    path = require('path')
    ;

//logs目录
var log4jsFileSystem = 'd://tmp//logs//';
//coding-env
if (process.env.VCAP_SERVICES) {
    var fileSystemConfig = JSON.parse(process.env.VCAP_SERVICES)['filesystem-1.0'][0].credentials;
    log4jsFileSystem = fileSystemConfig['host_path'] + '/logs/';
}
if (!fs.existsSync(log4jsFileSystem)) {
    console.log('create log dir');
    fs.mkdirSync(log4jsFileSystem, 0777);
}

//log4js配置
log4js.configure({
    appenders: [{
        type: 'console'
    }, {
        type: 'file',
        "absolute": true,
        filename: log4jsFileSystem + 'trade.log',
        category: 'trade'
    }]
});

//express
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.normalize(__dirname) + '/public');

app.use(expresslogger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('html', require('ejs').renderFile);//使用ejs作为模板语言

if ('development' == app.get('env')) {
    app.use(errorHandler());
}

//routers
app.use(routes);

http.createServer(app).listen(app.get('port'), function () {
    console.log('hpp-sdk-demo server listening on port ' + app.get('port'));
});
