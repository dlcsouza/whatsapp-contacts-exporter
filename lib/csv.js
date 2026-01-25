/**
 * CSV Generator - Lightweight CSV generation library
 * No external dependencies
 */

const CSVGenerator = {
  /**
   * Generate CSV string from array of objects
   * @param {Array} data - Array of objects to convert
   * @param {Array} columns - Column names to include (optional)
   * @param {Object} options - Configuration options
   * @returns {string} CSV formatted string
   */
  generate: function(data, columns = null, options = {}) {
    if (!data || data.length === 0) {
      return '';
    }

    const {
      delimiter = ',',
      lineBreak = '\n',
      includeHeader = true,
      quoteAll = false
    } = options;

    // Determine columns from first object if not provided
    const cols = columns || Object.keys(data[0]);
    
    // Build CSV lines
    const lines = [];

    // Header row
    if (includeHeader) {
      const headerRow = cols.map(col => this.formatValue(this.humanize(col), delimiter, quoteAll));
      lines.push(headerRow.join(delimiter));
    }

    // Data rows
    data.forEach(item => {
      const row = cols.map(col => {
        const value = item[col];
        return this.formatValue(value, delimiter, quoteAll);
      });
      lines.push(row.join(delimiter));
    });

    // Add BOM for Excel compatibility
    const bom = '\ufeff';
    return bom + lines.join(lineBreak);
  },

  /**
   * Format a value for CSV output
   * @param {any} value - Value to format
   * @param {string} delimiter - Field delimiter
   * @param {boolean} quoteAll - Quote all fields
   * @returns {string} Formatted value
   */
  formatValue: function(value, delimiter, quoteAll) {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue = String(value);

    // Check if quoting is needed
    const needsQuoting = quoteAll ||
      stringValue.includes(delimiter) ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r');

    if (needsQuoting) {
      // Escape double quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }

    return stringValue;
  },

  /**
   * Convert camelCase or snake_case to human-readable format
   * @param {string} str - String to humanize
   * @returns {string} Human-readable string
   */
  humanize: function(str) {
    return str
      // Insert space before uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Capitalize first letter
      .replace(/^./, s => s.toUpperCase())
      // Clean up extra spaces
      .trim();
  },

  /**
   * Parse CSV string to array of objects
   * @param {string} csvString - CSV string to parse
   * @param {Object} options - Configuration options
   * @returns {Array} Array of objects
   */
  parse: function(csvString, options = {}) {
    const {
      delimiter = ',',
      hasHeader = true
    } = options;

    const lines = csvString.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    const result = [];
    const headers = hasHeader ? this.parseLine(lines[0], delimiter) : null;
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const values = this.parseLine(lines[i], delimiter);
      
      if (hasHeader) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        result.push(obj);
      } else {
        result.push(values);
      }
    }

    return result;
  },

  /**
   * Parse a single CSV line respecting quoted values
   * @param {string} line - CSV line to parse
   * @param {string} delimiter - Field delimiter
   * @returns {Array} Array of values
   */
  parseLine: function(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    values.push(current);
    return values;
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSVGenerator;
}
