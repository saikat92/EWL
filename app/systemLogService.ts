type LogType = 'command' | 'status' | 'error' | 'operation' | 'connection';

interface LogEntry {
  id: string;
  type: LogType;
  title: string;
  message: string;
  timestamp: number;
  details?: any;
}

class SystemLogService {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs
  private subscribers: ((logs: LogEntry[]) => void)[] = [];

  addLog(type: LogType, title: string, message: string, details?: any) {
    const log: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: Date.now(),
      details
    };

    this.logs.unshift(log); // Add to beginning
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify subscribers
    this.notifySubscribers();
    
    return log;
  }

  getLogs(limit?: number): LogEntry[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.notifySubscribers();
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    const logsCopy = [...this.logs];
    this.subscribers.forEach(callback => callback(logsCopy));
  }

  // Helper methods for common log types
  logCommand(command: string, extra?: any) {
    return this.addLog('command', 'Command Sent', `Sent command: ${command}`, extra);
  }

  logStatus(status: any) {
    return this.addLog('status', 'Status Update', 'Device status updated', status);
  }

  logError(error: string, details?: any) {
    return this.addLog('error', 'Error Occurred', error, details);
  }

  logOperation(operation: string, details?: any) {
    return this.addLog('operation', 'Operation', operation, details);
  }

  logConnection(status: string, details?: any) {
    return this.addLog('connection', 'Connection', status, details);
  }
}

export const systemLog = new SystemLogService();