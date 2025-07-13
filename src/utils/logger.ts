/**
 * Centralized logging utility for the Veracode MCP Server
 * Supports different log levels controlled by LOG_LEVEL environment variable
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO; // Default value

  constructor() {
    this.initializeLogLevel();
  }

  private initializeLogLevel(): void {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    console.error(`[LOGGER] Initializing with LOG_LEVEL: ${process.env.LOG_LEVEL} -> ${level}`);

    switch (level) {
    case 'debug':
      this.logLevel = LogLevel.DEBUG;
      break;
    case 'info':
      this.logLevel = LogLevel.INFO;
      break;
    case 'warn':
      this.logLevel = LogLevel.WARN;
      break;
    case 'error':
      this.logLevel = LogLevel.ERROR;
      break;
    default:
      this.logLevel = LogLevel.INFO;
    }

    console.error(`[LOGGER] Log level set to: ${LogLevel[this.logLevel]} (${this.logLevel})`);
  }

  // Method to reinitialize after env is loaded
  public reinitialize(): void {
    this.initializeLogLevel();
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `[${timestamp}] ${level}${contextStr}: ${message}`;
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.error(this.formatMessage('DEBUG', message, context));
      if (data !== undefined) {
        console.error('  Data:', JSON.stringify(data, null, 2));
      }
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.error(this.formatMessage('INFO', message, context));
      if (data !== undefined) {
        console.error('  Data:', JSON.stringify(data, null, 2));
      }
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.error(this.formatMessage('WARN', message, context));
      if (data !== undefined) {
        console.error('  Data:', JSON.stringify(data, null, 2));
      }
    }
  }

  error(message: string, context?: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
      if (error !== undefined) {
        if (error instanceof Error) {
          console.error('  Error:', error.message);
          console.error('  Stack:', error.stack);
        } else {
          console.error('  Error:', JSON.stringify(error, null, 2));
        }
      }
    }
  }

  // API-specific logging helpers
  apiRequest(method: string, url: string, params?: any): void {
    this.debug(`API Request: ${method} ${url}`, 'API', { params });
  }

  apiResponse(method: string, url: string, status: number, responseTime: number, dataLength?: number): void {
    this.debug(`API Response: ${method} ${url} - ${status} (${responseTime}ms)`, 'API', { dataLength });
  }

  apiError(method: string, url: string, error: any): void {
    this.error(`API Error: ${method} ${url}`, 'API', error);
  }

  toolExecution(toolName: string, args: any): void {
    this.debug(`Tool execution started: ${toolName}`, 'TOOL', { args });
  }

  toolResult(toolName: string, success: boolean, executionTime: number, resultSize?: number): void {
    this.debug(
      `Tool execution completed: ${toolName} - ${success ? 'SUCCESS' : 'FAILED'} (${executionTime}ms)`,
      'TOOL',
      { resultSize }
    );
  }

  toolError(toolName: string, error: any): void {
    this.error(`Tool execution failed: ${toolName}`, 'TOOL', error);
  }
}

// Export singleton instance
export const logger = new Logger();
