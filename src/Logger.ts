import { ScrubbrOptions } from './';

export enum LogLevel {
  DEBUG = 4,
  INFO = 3,
  WARN = 2,
  ERROR = 1,
  NONE = 0,
}

export class Logger {
  logLevel: LogLevel;
  prefix: string;
  nestingString: string | boolean = false;
  nestLevel: number = 0;

  constructor(options: ScrubbrOptions, nestLevel: number = 0) {
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
