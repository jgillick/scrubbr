export enum LogLevel {
  DEBUG = 4,
  INFO = 3,
  WARN = 2,
  ERROR = 1,
  NONE = 0,
}

export class Logger {
  logLevel: LogLevel;

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  private getIndent(num: number): string {
    return Array(num).fill('  ').join('');
  }

  log(message: string, indent: number = 0) {
    if (this.logLevel < LogLevel.INFO) {
      return;
    }
    console.log(`${this.getIndent(indent)}${message}`);
  }

  error(message: string, indent: number = 0) {
    if (this.logLevel < LogLevel.ERROR) {
      return;
    }
    console.error(`${this.getIndent(indent)}${message}`);
  }

  warn(message: string, indent: number = 0) {
    if (this.logLevel < LogLevel.WARN) {
      return;
    }
    console.warn(`${this.getIndent(indent)}${message}`);
  }

  debug(message: string, indent: number = 0) {
    if (this.logLevel < LogLevel.DEBUG) {
      return;
    }
    console.debug(`${this.getIndent(indent)}${message}`);
  }
}
