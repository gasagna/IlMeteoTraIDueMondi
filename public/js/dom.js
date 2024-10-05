// dom.js

// external code
import {format, parseISO, setDefaultOptions, formatDistanceToNow} from 'https://cdn.jsdelivr.net/npm/date-fns/+esm';
import {it} from 'https://cdn.jsdelivr.net/npm/date-fns/locale/+esm';

// set locale to italian
setDefaultOptions({ locale: it })

// Date/time formatting functions
function make_short_date(date) {
    return format(parseISO(date), "d MMMM");
}

function make_date(date) {
    return format(parseISO(date), "d MMMM u");
}

function make_time(date) {
    return format(parseISO(date), "HH:mm");
}

function make_ultima_misurazione(date) {
    return make_date(date) + " alle " + make_time(date) + " (" + formatDistanceToNow(parseISO(date)) + " fa)";
}

export function updateLatest(data) {
    if (data) {
        document.getElementById('data_ultima_rilevazione_introd').textContent = make_ultima_misurazione(data.time);
        document.getElementById('temperatura_corrente_introd').textContent = data.temperature + ' °C';
        document.getElementById('pressione_corrente_introd').textContent = data.pressure + ' hPa';
        document.getElementById('umidita_corrente_introd').textContent = data.humidity + ' %';
    } else {
        console.warn('No data available to update DOM.');
    }
}

export function updateExtrema(data, selectedQuantity) {
    const symbols = {'temperature' : ' °C', 'pressure' : ' hPa', 'humidity' : ' %', 'battery' : ' V'};
    if (data) {
        document.getElementById(`min_today_introd`).textContent     = data[`min_${selectedQuantity}_value_today`]     + ` ${symbols[selectedQuantity]} alle ` + make_time(data[`min_${selectedQuantity}_time_today`]);
        document.getElementById(`max_today_introd`).textContent     = data[`max_${selectedQuantity}_value_today`]     + ` ${symbols[selectedQuantity]} alle ` + make_time(data[`max_${selectedQuantity}_time_today`]);
        document.getElementById(`min_yesterday_introd`).textContent = data[`min_${selectedQuantity}_value_yesterday`] + ` ${symbols[selectedQuantity]} alle ` + make_time(data[`min_${selectedQuantity}_time_yesterday`]);
        document.getElementById(`max_yesterday_introd`).textContent = data[`max_${selectedQuantity}_value_yesterday`] + ` ${symbols[selectedQuantity]} alle ` + make_time(data[`max_${selectedQuantity}_time_yesterday`]);
        document.getElementById(`min_thismonth_introd`).textContent = data[`min_${selectedQuantity}_value_thismonth`] + ` ${symbols[selectedQuantity]} il ` + make_short_date(data[`min_${selectedQuantity}_time_thismonth`]);
        document.getElementById(`max_thismonth_introd`).textContent = data[`max_${selectedQuantity}_value_thismonth`] + ` ${symbols[selectedQuantity]} il ` + make_short_date(data[`max_${selectedQuantity}_time_thismonth`]);
        document.getElementById(`min_lastmonth_introd`).textContent = data[`min_${selectedQuantity}_value_lastmonth`] + ` ${symbols[selectedQuantity]} il ` + make_short_date(data[`min_${selectedQuantity}_time_lastmonth`]);
        document.getElementById(`max_lastmonth_introd`).textContent = data[`max_${selectedQuantity}_value_lastmonth`] + ` ${symbols[selectedQuantity]} il ` + make_short_date(data[`max_${selectedQuantity}_time_lastmonth`]);
        document.getElementById(`min_thisyear_introd`).textContent  = data[`min_${selectedQuantity}_value_thisyear`]  + ` ${symbols[selectedQuantity]} il ` + make_short_date(data[`min_${selectedQuantity}_time_thisyear`]);
        document.getElementById(`max_thisyear_introd`).textContent  = data[`max_${selectedQuantity}_value_thisyear`]  + ` ${symbols[selectedQuantity]} il ` + make_short_date(data[`max_${selectedQuantity}_time_thisyear`]);
    } else {
        console.warn('No data available to update DOM.');
    }
}

let svg;
let margin = {top: 20, right: 30, bottom: 50, left: 60};
let width, height;

// Initialize the plot
export function initializePlot(containerId) {
    // Get container width
    const containerWidth = document.getElementById(containerId).clientWidth;
    
    // Define width and height
    width = containerWidth - margin.left - margin.right;
    height = 400 - margin.top - margin.bottom;

    // Create the SVG element
    svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

// Update the plot with new data
export function updatePlot(data, selectedQuantity, selectedPeriod) {
    // Clear existing plot before redrawing
    svg.selectAll("*").remove();

    // Define scales
    const x = d3.scaleTime()
                .domain(d3.extent(data, d => d.time))
                .range([0, width]);

    const deltas = {'temperature' : 1, 'pressure' : 1, 'humidity' : 2, 'battery' : 0.01};
    const y = d3.scaleLinear()
                .domain([d3.min(data, d => d.value) - deltas[selectedQuantity], d3.max(data, d => d.value) + deltas[selectedQuantity]])
                .range([height, 0]);

    let xAxis;

    // Add custom x-axis with dynamic tick formatting
    if (selectedPeriod == 'oneday') {
        xAxis = d3.axisBottom(x)
        .tickFormat(d => {
            return d3.timeFormat("%H:%M")(d);
        });
    } else if (selectedPeriod == 'oneweek') {
        xAxis = d3.axisBottom(x)
        .ticks(d3.timeDay.every(1))  // One tick per day
        .tickFormat(d => {
            const hours = d3.timeFormat("%H:%M")(d);
            const date = d3.timeFormat("%d/%m")(d);
            return hours === "00:00" ? `${hours}\n${date}` : hours;
        });
    } else {
        xAxis = d3.axisBottom(x)
        .ticks(d3.timeDay.every(1))  // One tick per day
        .tickFormat(d => {
            const hours = d3.timeFormat("%H:%M")(d);
            const date = d3.timeFormat("%d/%m")(d);
            return hours === "00:00" ? `${hours}\n${date}` : hours;
        });
    }

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .call(function (sel) {
             sel.each(function () {
                 const text = d3.select(this);
                 const lines = text.text().split("\n");  // Split the text by newline
                 text.text(null);  // Clear the existing text
                 lines.forEach(function (line, i) {
                     text.append("tspan")
                         .attr("x", 0)
                         .attr("dy", i === 0 ? "0.85em" : "1.2em")  // Position the next line below the previous
                         .text(line);
                 });
             });
         });

    // Add y-axis
    svg.append("g")
       .call(d3.axisLeft(y));

    // add grid lines
    addGridlines(svg, x, y);

    // Add the line path
    svg.append("path")
       .datum(data)
       .attr("class", "path")
       .attr("fill", "none")
       .attr("stroke-width", 1.5)
       .attr("d", d3.line()
                    .defined(d => d.value !== null && !isNaN(d.value))
                    .x(d => x(d.time))
                    .y(d => y(d.value))
       );

    // Add y-axis label
    const ylabels = {'temperature' : 'Temperatura', 'pressure' : 'Pressione', 'humidity' : 'Umidità', 'battery' : 'Batteria'};
    svg.append("text")
       .attr("text-anchor", "middle")
       .attr("transform", `translate(${-margin.left * 0.7}, ${height / 2}) rotate(-90)`) // Rotate to make it vertical
       .attr("font-size", "12px")
       .attr("fill", "black")
       .text(ylabels[selectedQuantity]);  // Label text based on the selected quantity

    // Add tooltip and crosshair functionalities
    addTooltipAndCrosshair(svg, data, x, y);
}

// Function to add gridlines
function addGridlines(svg, x, y) {
    // Create horizontal gridlines (y-axis)
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)  // Gridline length
            .tickFormat("")    // No labels for gridlines
        );

    // Create vertical gridlines (x-axis)
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .tickSize(-height)  // Gridline length
            .tickFormat("")     // No labels for gridlines
        );
}

// Function to add tooltip and crosshair
function addTooltipAndCrosshair(svg, data, x, y) {
    // Tooltip div element
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("display", "none")
        .style("pointer-events", "none");

    // Vertical crosshair line
    const vcrosshair = svg.append("line")
        .attr("class", "crosshair")
        .attr("stroke", "#2980b9")
        .attr("stroke-width", 1)
        .attr("y1", 0)
        .attr("y2", height)
        .style("display", "none");

    const hcrosshair = svg.append("line")
        .attr("class", "crosshair")
        .attr("stroke", "#2980b9")
        .attr("stroke-width", 1)
        .attr("x1", 0)
        .attr("x2", width)
        .style("display", "none");

    // Transparent overlay for mouse interaction
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", event => mousemove(event, data, x, y, tooltip, vcrosshair, hcrosshair))
        .on("mouseout", () => {
            tooltip.style("display", "none");
            vcrosshair.style("display", "none");
            hcrosshair.style("display", "none");
        });
}

// Function to handle mouse movements for crosshair and tooltip
function mousemove(event, data, x, y, tooltip, vcrosshair, hcrosshair) {
    const [mouseX] = d3.pointer(event);
    const xDate = x.invert(mouseX);  // Get the date corresponding to mouse X position

    // Find the closest data point
    const closest = data.reduce((a, b) => {
        return Math.abs(a.time - xDate) < Math.abs(b.time - xDate) ? a : b;
    });

    // Update tooltip position and content
    tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .html(`<strong>Data:</strong> ${d3.timeFormat("%d/%m alle %H:%M")(closest.time)}<br><strong>Valore:</strong> ${closest.value.toFixed(2)}`)
        .style("display", "block");

    // Update crosshair position
    vcrosshair
        .attr("x1", x(closest.time))
        .attr("x2", x(closest.time))
        .style("display", "block");

    hcrosshair
        .attr("y1", y(closest.value))
        .attr("y2", y(closest.value))
        .style("display", "block");
}
