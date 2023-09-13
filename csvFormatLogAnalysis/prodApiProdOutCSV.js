const fs = require('fs');
const csv = require('csv-parser');

// Read the log file
fs.readFile('../logData/prod-api-prod-out.log', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the log file:', err);
    return;
  }

  // Split the log file into individual log entries
  const logEntries = data.split(/\n\s*\n/);

  // Initialize status code counts
  const statusCounts = {};
  const endpointCounts = {};
  const callsPerMinute = {};

  // Process each log entry
  for (const logEntry of logEntries) {
    // Remove backticks within the log entry
    const cleanedLog = logEntry.replace(/`/g, '');

    // Split the cleaned log entry into lines
    const logLines = cleanedLog.split('\n');
    let timestamp = null;
    let endpoint = null;

    for (const line of logLines) {
      const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
      if (timestampMatch) {
        timestamp = timestampMatch[1];
      }

      const endpointMatch = line.match(/"GET (\/[^? ]+)/);
      if (endpointMatch) {
        endpoint = endpointMatch[1];
      }

      // Extract the status code using a more flexible regex
      const statusMatch = line.match(/ (\d{3}) /);

      if (statusMatch) {
        const status = parseInt(statusMatch[1], 10);

        if (timestamp && endpoint) {
          // Count API calls by endpoint
          if (endpointCounts[endpoint]) {
            endpointCounts[endpoint]++;
          } else {
            endpointCounts[endpoint] = 1;
          }

          // Count API calls per minute
          if (callsPerMinute[timestamp]) {
            callsPerMinute[timestamp]++;
          } else {
            callsPerMinute[timestamp] = 1;
          }
        }

        // Count API calls by HTTP status code
        if (statusCounts[status]) {
          statusCounts[status]++;
        } else {
          statusCounts[status] = 1;
        }
      }
    }
  }

  // Prepare data for CSV
  const csvData = [];
  for (const statusCode in statusCounts) {
    csvData.push([`Status Code ${statusCode}`, statusCounts[statusCode]]);
  }
  for (const timestamp in callsPerMinute) {
    csvData.push(['API Calls Per Minute', timestamp, callsPerMinute[timestamp]]);
  }
  for (const endpoint in endpointCounts) {
    csvData.push(['API Calls by Endpoint', endpoint, endpointCounts[endpoint]]);
  }

  // Convert data to CSV format
  const csvContent = csvData.map((row) => row.join(',')).join('\n');

  // Write to a CSV file
  fs.writeFile('prod-api-prod-out-logs-summary.csv', csvContent, (err) => {
    if (err) {
      console.error('Error writing to CSV file:', err);
      return;
    }
    console.log('CSV file written successfully: prod-api-prod-out-logs-summary.csv');
  });
});
