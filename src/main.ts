import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// --- Log Bridge Setup ---
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function sendLog(type: string, args: any[]) {
  // Convert args to string-safe format to avoid circular reference errors
  const safeArgs = args.map((arg) => {
    try {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, (key, value) => {
          if (key.startsWith('_')) return undefined; // Skip internal angular props
          return value;
        });
      }
      return String(arg);
    } catch (e) {
      return '[Complex Object]';
    }
  });

  fetch('http://localhost:3000/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, args: safeArgs }),
  }).catch(() => {
    // Silently fail if log server isn't running
  });
}

console.log = (...args) => {
  originalLog(...args);
  sendLog('info', args);
};

console.warn = (...args) => {
  originalWarn(...args);
  sendLog('warn', args);
};

console.error = (...args) => {
  originalError(...args);
  sendLog('error', args);
};
// ------------------------

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
