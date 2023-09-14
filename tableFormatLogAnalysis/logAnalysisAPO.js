const fs = require('fs');
const Table = require('cli-table');

// Read the log file
fs.readFile('../logData/api-prod-out.log', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the log file:', err);
    return;
  }

  // Split the log file into individual log entries
  const logEntries = data.split(/\n\s*\n/);

  // Initialize an array to store combined data
  const combinedData = [];

  // Process each log entry
  for (const logEntry of logEntries) {
    // Remove backticks within the log entry
    const cleanedLog = logEntry.replace(/`/g, '');

    // Split the cleaned log entry into lines
    const logLines = cleanedLog.split('\n');
    let timestamp = null;
    let endpoint = null;
    let status = null;

    for (const line of logLines) {
      const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
      if (timestampMatch) {
        timestamp = timestampMatch[1];
      }

      // Use a regular expression to match only "api/" endpoints
      const endpointMatch = line.match(/"GET (\/api\/[^? ]+)/);
      if (endpointMatch) {
        endpoint = endpointMatch[1];
      }

      // Extract the status code using a more flexible regex
      const statusMatch = line.match(/ (\d{3}) /);
      if (statusMatch) {
        status = parseInt(statusMatch[1], 10);
      }
    }

    // Add data to the combined array
    if (timestamp && endpoint && status) {
      combinedData.push({ Timestamp: timestamp, Endpoint: endpoint, Status: status });
    }
  }

  // Create an object to store status code counts
  const statusCounts = {};

  // Calculate status code counts
  combinedData.forEach((row) => {
    const statusCode = row.Status;
    if (statusCode in statusCounts) {
      statusCounts[statusCode]++;
    } else {
      statusCounts[statusCode] = 1;
    }
  });

  // Create a table to display the combined data with status code counts
  const combinedTable = new Table({
    head: ['Timestamp', 'Endpoint', 'Status', 'Count'],
    colWidths: [25, 40, 10, 10],
  });

  // Populate the combined table
  combinedData.forEach((row) => {
    const statusCode = row.Status;
    combinedTable.push([row.Timestamp, row.Endpoint, statusCode, statusCounts[statusCode]]);
  });

  // Display the combined table in the console
  console.log(combinedTable.toString());
});