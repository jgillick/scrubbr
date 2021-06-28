import { ScrubbrOptions } from './';

/**
 * The scrubbr log level.
 * Setting the log level will enabled logging for that level and below.
 */
export enum LogLevel {
  /**
   * Log additional debug information.
   * Set logNesting to true to also indent the logs with the data nesting.
   */
  DEBUG = 4,

  /**
   * Display basic information as well as warnings and errors.
   */
  INFO = 3,

  /**
   * Log warnings and errors.
   */
  WARN = 2,

  /**
   * Log errors
   */
  ERROR = 1,

  /**
   * Disable logging.
   */
  NONE = 0,
}

/**
 * Used by Scrubbr for logging.
 * @internal
 */
export class Logger {
  logLevel: LogLevel;
  prefix: string;
  nestingString: string | boolean = false;
  nestLevel = 0;

  constructor(options: ScrubbrOptions, nestLevel = 0) {
    this.logLevel = options.logLevel || LogLevel.NONE;
    this.nestLevel = nestLevel;

    this.prefix = '';
    if (options.logPrefix) {
      this.prefix = options.logPrefix;
      if (!this.prefix.endsWith(' ')) {
        this.prefix += ' ';
      }
    }

    const { logNesting } = options;
    if (logNesting === true) {
      this.nestingString = '  ';
    } else if (typeof logNesting == 'string') {
      this.nestingString = logNesting;
    }
  }

  private getPrefix(): string {
    if (!this.nestingString) {
      return this.prefix;
    }
    const indent = Array(this.nestLevel).fill(this.nestingString).join('');
    return this.prefix + indent;
  }

  info(message: string) {
    if (this.logLevel < LogLevel.INFO) {
      return;
    }
    console.log(`${this.getPrefix()}${message}`);
  }

  error(message: string) {
    if (this.logLevel < LogLevel.ERROR) {
      return;
    }
    console.error(`${this.getPrefix()}${message}`);
  }

  warn(message: string) {
    if (this.logLevel < LogLevel.WARN) {
      return;
    }
    console.warn(`${this.getPrefix()}${message}`);
  }

  debug(message: string) {
    if (this.logLevel < LogLevel.DEBUG) {
      return;
    }
    console.debug(`${this.getPrefix()}${message}`);
  }
}
