const os = require('os');
const axios = require('axios');
const zlib = require('zlib');
const TypeUtils = require('data-type-utils');
const packageJson = require('./package.json');

const log4js = require('@log4js-node/log4js-api');

const STAT_SERVER_STAGING = 'https://stat-staging.createlab.org'
const STAT_SERVER = 'https://stat.createlab.org'
const STAT_LOG_API_URL = '/api/log'
const DEFAULT_HTTP_TIMEOUT_MILLIS = 20 * 1000;    // 20 seconds

const DEFAULT_OPTIONS = Object.freeze({
                                         useStagingServer : false,
                                         httpTimeoutMillis : DEFAULT_HTTP_TIMEOUT_MILLIS,
                                         useCompression : true
                                      });

class StatClient {
   constructor(serviceGroupName, hostName, hostShortName, options = DEFAULT_OPTIONS) {
      this._serviceGroupName = serviceGroupName;
      this._hostShortName = hostShortName;
      this._hostName = hostName;

      // This magic is described here:
      // * https://stackoverflow.com/a/9602718/703200
      // * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
      const allOptions = Object.assign({}, DEFAULT_OPTIONS, options);

      // noinspection NegatedConditionalExpressionJS
      allOptions['useStagingServer'] = !!allOptions['useStagingServer'];
      allOptions['useCompression'] = !!allOptions['useCompression'];

      if (!TypeUtils.isPositiveInt(allOptions['httpTimeoutMillis'])) {
         throw new TypeError("Option 'httpTimeoutMillis' must be a positive integer");
      }

      this._useCompression = allOptions['useCompression'];
      this._statServerApiUrl = (allOptions['useStagingServer'] ? STAT_SERVER_STAGING : STAT_SERVER) + STAT_LOG_API_URL

      if (!TypeUtils.isNonEmptyString(serviceGroupName)) {
         throw new TypeError("serviceGroupName must be a non-empty string");
      }

      if (!TypeUtils.isNonEmptyString(hostName)) {
         throw new TypeError("hostName must be a non-empty string");
      }

      this._log = log4js.getLogger('StatClient[' + serviceGroupName + '|' + hostName + ']');

      // construct the user agent string
      const userAgent = [
         serviceGroupName + '[StatClient]/' + packageJson.version,
         '(' + os.type() + ' ' + os.arch() + '; ' + os.release() + ')',
         'Node.js/' + process.version,
         'Axios/' + packageJson.dependencies.axios
      ].join(' ');

      // create axios options
      const axiosOptions = {
         timeout : allOptions['httpTimeoutMillis'],
         headers : {
            'user-agent' : userAgent,
            'Content-Type' : 'application/json'
         }
      };
      if (this._useCompression) {
         axiosOptions.headers['Content-Encoding'] = 'gzip';
      }

      this._axios = axios.create(axiosOptions);
   }

   async _postLog(logLevel, message, details = null, validForSecs) {
      const self = this;

      // build the request
      const requestConfig = {
         url : self._statServerApiUrl,
         method : 'post',
         data : {
            'service' : self._serviceGroupName,
            'datetime' : new Date().toISOString(),
            'host' : self._hostName,
            'level' : logLevel,
            'summary' : message,
            'details' : details,
            'shortname' : self._hostShortName,
         }
      };

      // make sure validForSecs is a positive integer before inserting it into the request; ignore otherwise
      if (TypeUtils.isPositiveInt(validForSecs)) {
         requestConfig.data['valid_for_secs'] = parseInt(validForSecs);
      }
      else {
         self._log.warn("Ignoring validForSecs [" + validForSecs + "] because it is not a positive integer");
      }

      // optionally compress the request
      if (self._useCompression) {
         requestConfig['transformRequest'] = function(jsonData) {
            return zlib.gzipSync(JSON.stringify(jsonData));
         };
      }

      try {
         const response = await self._axios(requestConfig);
         return TypeUtils.isDefinedAndNotNull(response) &&
                TypeUtils.isDefinedAndNotNull(response.data) &&
                response.data.status === 'ok';
      }
      catch (err) {
         self._log.error("Error POSTing to stat: ", err.message);
      }

      return false;
   }

   async up(message, details = null, validForSecs) {
      return await this._postLog('up', message, details, validForSecs)
   }

   async down(message, details = null, validForSecs) {
      return await this._postLog('down', message, details, validForSecs)
   }

   async debug(message, details = null) {
      return await this._postLog('debug', message, details)
   }

   async info(message, details = null) {
      return await this._postLog('info', message, details)
   }

   async warning(message, details = null) {
      return await this._postLog('warning', message, details)
   }

   async critical(message, details = null) {
      return await this._postLog('critical', message, details)
   }
}

module.exports = StatClient;
