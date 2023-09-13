const fs = require('fs');
const Table = require('cli-table');

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

  // Create a table for status code counts
  const statusTable = new Table({
    head: ['Status', 'statusCode', 'count'],
    colWidths: [20, 15, 10],
  });

  // Populate the status code table
  statusTable.push({ 'Status': 'Server Error', 'statusCode': 500, 'count': statusCounts[500] || 0 });
  statusTable.push({ 'Status': 'Not found', 'statusCode': 404, 'count': statusCounts[404] || 0 });
  statusTable.push({ 'Status': 'OK', 'statusCode': 200, 'count': statusCounts[200] || 0 });
  statusTable.push({ 'Status': 'Not changed', 'statusCode': 304, 'count': statusCounts[304] || 0 });

  // Create a table for API calls per minute
  const callsTable = new Table({
    head: ['API Calls Per Minute', 'Timestamp', 'Count'],
    colWidths: [25, 25, 10],
  });

  // Populate the API calls per minute table
  for (const timestamp in callsPerMinute) {
    callsTable.push(['API Calls Per Minute', timestamp, callsPerMinute[timestamp]]);
  }

  // Create a table for API calls by endpoint
  const endpointTable = new Table({
    head: ['API Calls by Endpoint', 'Endpoint', 'Count'],
    colWidths: [25, 40, 10],
  });

  // Populate the API calls by endpoint table
  for (const endpoint in endpointCounts) {
    endpointTable.push(['API Calls by Endpoint', endpoint, endpointCounts[endpoint]]);
  }

  // Display the tables in the console
  console.log(statusTable.toString());
  console.log(callsTable.toString());
  console.log(endpointTable.toString());
});
