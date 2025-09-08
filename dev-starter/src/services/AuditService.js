const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../audit.log');

class AuditService {
  static logEvent(event) {
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(event)}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) {
        console.error('Failed to write to audit log:', err);
      }
    });
  }
}

module.exports = AuditService;