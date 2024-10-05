// api.js

/**
 * Fetches the latest data from the server.
 * If the request fails, returns default fallback data with preset values.
 *
 * @async
 * @function fetchLatestData
 * @returns {Promise<Object>} A promise that resolves to the latest data from the server
 * or a default object if an error occurs.
 * @throws {Error} If the network request fails and an error response is returned.
 */
export async function fetchLatest() {
    try {
        // Attempt to fetch the latest data from the '/api/latest' endpoint
        const response = await fetch('/api/latest');

        // Check if the response status is not OK (i.e., outside the 200-299 range)
        if (!response.ok) {
            // If the response is not OK, throw an error with status and statusText
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
        }

        // If the response is OK, parse and return the JSON data
        return await response.json();

    } catch (error) {
        // If there was an error (either in the fetch or the response handling), log the error
        console.error('Error fetching latest data:', error);

        // Return default data with preset values as a fallback
        return {
            battery     : 0.00,
            humidity    : 0.00,
            pressure    : 0.00,
            temperature : 0.00,
            time        : "2000-01-01T00:00:00Z"
        };
    }
}


/**
 * Fetches extremal weather data for multiple time periods and merges the results.
 *
 * This function fetches data for the periods 'today', 'yesterday', 'thismonth', 'lastmonth', 
 * 'thisyear', and 'lastyear', appends the period to each key in the response, and combines 
 * all results into a single object.
 *
 * @returns {Object} data - An object containing extremal weather data for each period, 
 * with the period name appended to the keys.
 */
export async function fetchExtrema(quantity) {
    const data = {};  // Object to store combined results

    // Loop through each period and fetch the extremal data
    for (const period of ['today', 'yesterday', 'thismonth', 'lastmonth', 'thisyear', 'lastyear']) {
        try {
            // Attempt to fetch extremal data for the current period
            const response = await fetch(`/api/extrema?period=${period}`);

            // Check if the response status is not OK (i.e., outside the 200-299 range)
            if (!response.ok) {
                // Throw an error if the response is not successful
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
            }

            // If the response is OK, parse the JSON data
            const local = await response.json();

            // Append the period name to each key in the fetched data
            for (const key in local) {
                data[`${key}_${period}`] = local[key];  // Add each key-value pair with the period suffix
            }

        } catch (error) {
            // Log any errors encountered during the fetch or response handling
            console.error(`Error fetching extrema data for period ${period}:`, error);
        }
    }

    // Return the combined data
    return data;
}


/**
 * Fetches time series data for a specific quantity and time period.
 *
 * @async
 * @function fetchTimeSeries
 * @param {string} quantity - The type of data to fetch (e.g., 'temperature', 'humidity', 'pressure', 'battery').
 * @param {string} period - The time period to fetch data for (e.g., 'day', 'week', 'month').
 * @returns {Promise<Object[]>} A promise that resolves to an array of time series data.
 * @throws {Error} If the network request fails.
 */
export async function fetchTimeSeries(quantity, period) {
    try {
        // Make the fetch request to the API with the given parameters
        const response = await fetch(`/api/timeseries?quantity=${quantity}&period=${period}`);

        // Check if the response is not OK and throw an error
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
        }

        // Parse the response as JSON
        const data = await response.json();

        // Process the data (convert time to Date and ensure value is numeric)
        data.forEach(d => {
            d.time = new Date(d.time);
            d.value = d.value !== null ? +d.value : null;  // Convert value to number if not null
        });

        // Return the processed data
        return data;
    } catch (error) {
        // Log the error and rethrow it for higher-level handling
        console.log("Error fetching data:", error);
        throw error;
    }
}

