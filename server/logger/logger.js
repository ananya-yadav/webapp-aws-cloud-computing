const log4js = require('log4js');
const PropertiesReader = require('properties-reader');
const prop = PropertiesReader('./server/properties/webapp.properties');
const logger = log4js.getLogger();
const debugLevel = prop.get('logger.level');

log4js.configure({
    appenders: {
        out: {
            type: 'stdout'
        },
        app: {
            type: 'file',
            filename: '/Myfiles.log',
            maxLogSize: 10485760,
            backups: 1,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: ['out', 'app'],
            level: debugLevel
        }
    }
});

logger.debug('Logger Level On : ', debugLevel);
module.exports = logger;