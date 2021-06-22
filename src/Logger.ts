export enum LogLevel {
  DEBUG = 4,
  INFO = 3,
  WARN = 2,
  ERROR = 1,
  NONE = 0,
}

export class Logger {
  logLevel: LogLevel;
  nestingString: string | boolean = false;

  constructor(logLevel: LogLevel, nesting: boolean | string = false) {
    this.logLevel = logLevel;
    if (nesting === true) {
      this.nestingString = '  ';
    } else if (typeof nesting == 'string') {
      this.nestingString = nesting;
    }
  }

  private getNesting(num: number): string {
    if (!this.nestingString) {
      return '';
    }
    return Array(num).fill(this.nestingString).join('');
  }

  info(message: string, nestingLevel: number = 0) {
    if (this.logLevel < LogLevel.INFO) {
      return;
    }
    console.log(`${this.getNesting(nestingLevel)}${message}`);
  }

  error(message: string, nestingLevel: number = 0) {
    if (this.logLevel < LogLevel.ERROR) {
      return;
    }
    console.error(`${this.getNesting(nestingLevel)}${message}`);
  }

  warn(message: string, nestingLevel: number = 0) {
    if (this.logLevel < LogLevel.WARN) {
      return;
    }
    console.warn(`${this.getNesting(nestingLevel)}${message}`);
  }

  debug(message: string, nestingLevel: number = 0) {
    if (this.logLevel < LogLevel.DEBUG) {
      return;
    }
    console.debug(`${this.getNesting(nestingLevel)}${message}`);
  }
}
