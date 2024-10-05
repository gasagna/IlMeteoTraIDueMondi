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
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the plot
    initializePlot("plot");

    // Fetch the temperature data for the past day and update the plot
    fetchTimeSeries(selectedQuantity, selectedPeriod).then(data => {
        updatePlot(data, selectedQuantity, selectedPeriod);
    });

    fetchExtrema(selectedQuantity).then(data => {
        updateExtrema(data, selectedQuantity);
    });

    // You can add more event listeners for buttons or dropdowns to change the period dynamically
    for (let period of ['oneday', 'oneweek', 'onemonth']) {
        document.getElementById(`button-${period}`).addEventListener('click', () => {
            selectedPeriod = `${period}`;
            fetchTimeSeries(selectedQuantity, selectedPeriod).then(data => {
                updatePlot(data, selectedQuantity, selectedPeriod);
            });
        });
    }

    for (let quantity of ['temperature', 'pressure', 'humidity', 'battery']) {
        document.getElementById(`button-${quantity}`).addEventListener('click', () => {
            selectedQuantity = `${quantity}`;
            fetchTimeSeries(selectedQuantity, selectedPeriod).then(data => {
                updatePlot(data, selectedQuantity, selectedPeriod);
            });
            fetchExtrema(selectedQuantity).then(data => {
                updateExtrema(data, selectedQuantity);
            });
        });
    }
});