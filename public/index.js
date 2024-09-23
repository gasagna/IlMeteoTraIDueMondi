// imports
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


// LAST MEASUREMENT 
fetch("data/last_measurement_introd.json")
	.then(response => response.json())
	.then(data => {
		document.getElementById("temperatura_corrente").innerHTML    = data["temperature"] + " °C";
		document.getElementById("umidità_corrente").innerHTML        = data["humidity"] + " %";
		document.getElementById("pressione_corrente").innerHTML      = data["pressure"] + " hPa";
		document.getElementById("data_ultima_rilevazione").innerHTML = make_ultima_misurazione(data["_time"]);
	})

// EXTREMA TODAY
fetch("data/extrema_today_introd.json")
	.then(response => response.json())
	.then(data => {
		document.getElementById("min_temperature_today").innerHTML = data["min_temperature"] + " °C alle " + make_time(data["min_temperature_time"]);
		document.getElementById("max_temperature_today").innerHTML = data["max_temperature"] + " °C alle " + make_time(data["max_temperature_time"]);
		document.getElementById("min_humidity_today").innerHTML = data["min_humidity"] + " % alle " + make_time(data["min_humidity_time"]);
		document.getElementById("max_humidity_today").innerHTML = data["max_humidity"] + " % alle " + make_time(data["max_humidity_time"]);
		document.getElementById("min_pressure_today").innerHTML = data["min_pressure"] + " hPa alle " + make_time(data["min_pressure_time"]);
		document.getElementById("max_pressure_today").innerHTML = data["max_pressure"] + " hPa alle " + make_time(data["max_pressure_time"]);
	})

// EXTREMA YESTERDAY
fetch("data/extrema_yesterday_introd.json")
	.then(response => response.json())
	.then(data => {
		document.getElementById("min_temperature_yesterday").innerHTML = data["min_temperature"] + " °C alle " + make_time(data["min_temperature_time"]);
		document.getElementById("max_temperature_yesterday").innerHTML = data["max_temperature"] + " °C alle " + make_time(data["max_temperature_time"]);
		document.getElementById("min_humidity_yesterday").innerHTML = data["min_humidity"] + " % alle " + make_time(data["min_humidity_time"]);
		document.getElementById("max_humidity_yesterday").innerHTML = data["max_humidity"] + " % alle " + make_time(data["max_humidity_time"]);
        document.getElementById("min_pressure_yesterday").innerHTML = data["min_pressure"] + " hPa alle " + make_time(data["min_pressure_time"]);
		document.getElementById("max_pressure_yesterday").innerHTML = data["max_pressure"] + " hPa alle " + make_time(data["max_pressure_time"]);
	})

// EXTREMA THIS MONTH
fetch("data/extrema_this_month_introd.json")
	.then(response => response.json())
	.then(data => {
		document.getElementById("min_temperature_this_month").innerHTML = data["min_temperature"] + " °C il " + make_short_date(data["min_temperature_time"]);
		document.getElementById("max_temperature_this_month").innerHTML = data["max_temperature"] + " °C il " + make_short_date(data["max_temperature_time"]);
		document.getElementById("min_humidity_this_month").innerHTML = data["min_humidity"] + " % il " + make_short_date(data["min_humidity_time"]);
		document.getElementById("max_humidity_this_month").innerHTML = data["max_humidity"] + " % il " + make_short_date(data["max_humidity_time"]);
        document.getElementById("min_pressure_this_month").innerHTML = data["min_pressure"] + " hPa il " + make_short_date(data["min_pressure_time"]);
		document.getElementById("max_pressure_this_month").innerHTML = data["max_pressure"] + " hPa il " + make_short_date(data["max_pressure_time"]);
	})

// EXTREMA LAST MONTH
fetch("data/extrema_last_month_introd.json")
	.then(response => response.json())
	.then(data => {
		document.getElementById("min_temperature_last_month").innerHTML = data["min_temperature"] + " °C il " + make_short_date(data["min_temperature_time"]);
		document.getElementById("max_temperature_last_month").innerHTML = data["max_temperature"] + " °C il " + make_short_date(data["max_temperature_time"]);
		document.getElementById("min_humidity_last_month").innerHTML = data["min_humidity"] + " % il " + make_short_date(data["min_humidity_time"]);
		document.getElementById("max_humidity_last_month").innerHTML = data["max_humidity"] + " % il " + make_short_date(data["max_humidity_time"]);
        document.getElementById("min_pressure_last_month").innerHTML = data["min_pressure"] + " hPa il " + make_short_date(data["min_pressure_time"]);
		document.getElementById("max_pressure_last_month").innerHTML = data["max_pressure"] + " hPa il " + make_short_date(data["max_pressure_time"]);
	})