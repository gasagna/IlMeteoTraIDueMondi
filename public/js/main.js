// main.js

import { fetchExtrema, fetchLatest, fetchTimeSeries } from './api.js';
import { updateLatest, initializePlot, updatePlot, updateExtrema } from './dom.js';

// -------------------
// VARIABLES
// -------------------//
let selectedPeriod = 'oneday';
let selectedQuantity = 'temperature';

// -------------------
// UPDATE STUFF
// -------------------

// functions to fetch and update 
function refreshLatest() {
    fetchLatest().then(data => {
        updateLatest(data);
    });
}

// Call the update function immediately to populate the data
refreshLatest();

// Set interval to refresh page
setInterval(refreshLatest,  30000);


// -------------------
// PLOT STUFF
// -------------------

// Initialize the plot when the page loads
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize the plot
    initializePlot("plot");

    // Fetch data and update page
    try {
        // these are sequential, but the influxdb server is single-core, so i do not care
        const timeseries = await fetchTimeSeries(selectedQuantity, selectedPeriod);
        updatePlot(timeseries, selectedQuantity, selectedPeriod);
        
        const extrema = await fetchExtrema(selectedQuantity);
        updateExtrema(extrema, selectedQuantity);
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    // You can add more event listeners for buttons or dropdowns to change the period dynamically
    for (let period of ['oneday', 'oneweek', 'onemonth']) {
        document.getElementById(`button-${period}`).addEventListener('click', async () => {
            selectedPeriod = `${period}`;
            try {
                const timeseris = await fetchTimeSeries(selectedQuantity, selectedPeriod);
                updatePlot(timeseries, selectedQuantity, selectedPeriod);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        })
    }

    for (let quantity of ['temperature', 'pressure', 'humidity', 'battery']) {
        document.getElementById(`button-${quantity}`).addEventListener('click', async () => {
            selectedQuantity = `${quantity}`;
            try {
                const timeseries = await fetchTimeSeries(selectedQuantity, selectedPeriod);
                updatePlot(timeseries, selectedQuantity, selectedPeriod);

                const extrema = await fetchExtrema(selectedQuantity);
                updateExtrema(data, selectedQuantity);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        })
    }
});
