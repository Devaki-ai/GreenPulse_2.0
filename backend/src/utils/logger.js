/**
 * Simple logger utility for GreenPulse
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const timestamp = () => new Date().toISOString();

const logger = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${timestamp()} - ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${timestamp()} - ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}[WARN]${colors.reset} ${timestamp()} - ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${timestamp()} - ${msg}`),
  debug: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.white}[DEBUG]${colors.reset} ${timestamp()} - ${msg}`);
    }
  },
};

module.exports = logger;
