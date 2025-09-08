const PDFDocument = require('pdfkit');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

class ReportingService {
  /**
   * Generate a PDF report.
   * @param {object} data - The data to include in the report.
   * @param {string} outputPath - The path to save the PDF file.
   * @returns {Promise<void>}
   */
  static async generatePdfReport(data, outputPath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.fontSize(25).text('Analytics Report', { align: 'center' });

      doc.moveDown();
      doc.fontSize(20).text('API Usage');
      doc.fontSize(12).text(`- Total Calls: ${data.apiUsage.calls}`);
      doc.fontSize(12).text(`- Total Tokens: ${data.apiUsage.tokens}`);

      doc.moveDown();
      doc.fontSize(20).text('Repository Analytics');
      doc.fontSize(12).text(`- Commits: ${data.repoAnalytics.commits}`);
      doc.fontSize(12).text(`- Pull Requests: ${data.repoAnalytics.pullRequests}`);
      doc.fontSize(12).text(`- Issues: ${data.repoAnalytics.issues}`);
      
      doc.end();

      stream.on('finish', () => {
        resolve();
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Generate a CSV report.
   * @param {object} data - The data to include in the report.
   * @param {string} outputPath - The path to save the CSV file.
   * @returns {Promise<void>}
   */
  static async generateCsvReport(data, outputPath) {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' },
      ],
    });

    const records = [
      { metric: 'Total Calls', value: data.apiUsage.calls },
      { metric: 'Total Tokens', value: data.apiUsage.tokens },
      { metric: 'Commits', value: data.repoAnalytics.commits },
      { metric: 'Pull Requests', value: data.repoAnalytics.pullRequests },
      { metric: 'Issues', value: data.repoAnalytics.issues },
    ];

    return csvWriter.writeRecords(records);
  }
}

module.exports = ReportingService;