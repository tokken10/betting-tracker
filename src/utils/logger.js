const levels = ['error', 'warn', 'info', 'debug'];
const level = levels.indexOf((process.env.LOG_LEVEL || 'info').toLowerCase());

function shouldLog(lvl) {
  return levels.indexOf(lvl) <= level;
}

export default {
  error: (...args) => shouldLog('error') && console.error('[ERROR]', ...args),
  warn: (...args) => shouldLog('warn') && console.warn('[WARN]', ...args),
  info: (...args) => shouldLog('info') && console.info('[INFO]', ...args),
  debug: (...args) => shouldLog('debug') && console.debug('[DEBUG]', ...args),
};
