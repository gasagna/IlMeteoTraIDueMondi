from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from influxdb_client import InfluxDBClient
from datetime import datetime, timezone
import json

# create app
app = Flask(__name__)

# load config file and variables
with open('config.json') as f:
    config = json.load(f)

INFLUXDB_URL    = config["INFLUXDB_URL"]
INFLUXDB_ORG    = config["INFLUXDB_ORG"]
INFLUXDB_TOKEN  = config["INFLUXDB_TOKEN"]
INFLUXDB_BUCKET = config["INFLUXDB_BUCKET"]
CA_CERT_FILE    = config["CA_CERT_FILE"]

# make client
client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG, ssl_ca_cert=CA_CERT_FILE)
query_api = client.query_api()

@app.route('/api/extrema', methods=['GET'])
def get_extrema():
    """
    API endpoint to retrieve the extremal (maximum and minimum) measurements for
    temperature, humidity, pressure, and battery over a specified time period.

    This function queries an InfluxDB database to fetch the maximum and minimum
    values of specific measurements (temperature, humidity, pressure, and battery)
    for a given period (e.g., today, yesterday, this month). The period is passed
    as a query parameter.

    Query Parameters:
        - period (str, optional): The time period for which the extremal values
          should be fetched. Valid options are: "today", "yesterday", "thismonth",
          "lastmonth", "thisyear", "lastyear".

        - JSON response containing the minimum and maximum values for each
          measurement (temperature, humidity, pressure, and battery) with their
          corresponding timestamps. For example:
          {
              "min_temperature_time": "2024-09-27T00:00:00+00:00",
              "min_temperature_value": 10.5,
              "max_temperature_time": "2024-09-27T12:00:00+00:00",
              "max_temperature_value": 30.1,
              "min_humidity_time": "2024-09-27T00:00:00+00:00",
              "min_humidity_value": 40.2,
              ...
          }

        - If the period is invalid, a JSON response with an error message
          and a 400 status code is returned:
          {
              "error": "Invalid period <period>"
          }

        - If an exception occurs during the query execution, a JSON response
          with an error message and a 500 status code is returned:
          {
              "error": "<exception_message>"
          }

    Raises:
        - 400 Bad Request: If the period provided is not in the valid set of periods.
        - 500 Internal Server Error: If there is an issue querying the database
          or processing the results.
    """
    # form date ranges in python and use them in the query
    now       = datetime.now(timezone.utc)
    today     = now.replace(                hour=0, minute=0, second=0, microsecond=0)
    thismonth = now.replace(         day=1, hour=0, minute=0, second=0, microsecond=0)
    thisyear  = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    lastmonth = (thismonth - timedelta(days=1)).replace(day=1)
    lastyear  = (thisyear  - timedelta(days=1)).replace(month=1, day=1)

    # the keys are the allowed periods
    query_data = {
                    "today"        : (today,                          now),
                    "yesterday"    : (today - timedelta(days=1),      today),
                    "thismonth"    : (thismonth,                      now),
                    "lastmonth"    : (lastmonth,                      thismonth),
                    "thisyear"     : (thisyear,                       now),
                    "lastyear"     : (lastyear,                       thisyear),
                 }

    period = request.args.get('period')
    if period not in query_data:
        return jsonify({"error": "Invalid period %s" % period}), 400

    query = f'''from(bucket: "{INFLUXDB_BUCKET}")
                |> range(start: {query_data[period][0].isoformat()}, stop: {query_data[period][1].isoformat()})
                |> filter(fn: (r) => r._measurement == "{INFLUXDB_BUCKET}" and r.sensor == "B")
                |> %s()
             '''

    # get data
    tables_max = client.query_api().query(query=query % "max")
    tables_min = client.query_api().query(query=query % "min")
    if not tables_max or not tables_min:
        return jsonify({'error': 'No data found'}), 404

    # fill a dict with all the quantities
    data = {}
    try:
        for (tables, spec) in [(tables_max, "max"), (tables_min, "min")]:
            for table in tables:
                field = table.records[0].get_field()
                data['%s_%s_time'  % (spec, field)] = table.records[0].get_time().isoformat()
                data['%s_%s_value' % (spec, field)] = table.records[0].get_value()

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/latest', methods=['GET'])
def get_latest_measurement():
    """
    API endpoint to retrieve the latest measurements.

    This function queries the time-series database, attempting to retrieve the most 
    recent data over multiple increasing time ranges until data if found (up to a week).
    
    Returns:
        - A JSON object containing the most recent data for the specified 
          measurements, including their values and the timestamp:
          {
              "time": "2024-09-27T12:00:00Z",
              "temperature": 25.5,
              "humidity": 60.0,
              "pressure": 1013.25,
              "battery": 4.12
          }
        
        - If no data is found within a week, the function returns a 404 error response:
          {
              "error": "No data found"
          }

        - If an error occurs during processing (e.g., accessing data from the 
          query result), the function returns a 500 error response with the 
          exception message:
          {
              "error": "<exception_message>"
          }

    Raises:
        - 500 Internal Server Error: If there is an issue processing the query 
          results or extracting the latest data.
        - 404 Not Found: If no data is found after querying all time intervals.
    """
    for interval in ["-15m", "-1h", "-1d", "-1w"]:
        query = f'''from(bucket: "{INFLUXDB_BUCKET}")
                    |> range(start: {interval})
                    |> filter(fn: (r) => r._measurement == "{INFLUXDB_BUCKET}" and r.sensor == "B")
                    |> last()
                 '''
        tables = client.query_api().query(query=query)
        if tables:
            try:
                latest_data = {'time' : tables[0].records[0].get_time().isoformat()}
                for table in tables:
                    latest_data[table.records[0].get_field()] = table.records[0].get_value()
                return jsonify(latest_data)
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        else:
            continue

    return jsonify({'error': 'No data found'}), 404

@app.route('/api/timeseries', methods=['GET'])
def get_timeseries():
    """
    API endpoint to retrieve time-series data for a specified quantity (e.g., 
    temperature, humidity, pressure, battery) over a given time period.

    This function queries the time-series database to return aggregated time-series 
    data based on the selected period and quantity. The data is aggregated and 
    averaged over predefined intervals for each period.

    Query Parameters:
        - quantity (str, required): The measurement to retrieve. 
          Valid options are:
              - "temperature"
              - "humidity"
              - "pressure"
              - "battery"
        - period (str, required): The time range over which the data should be 
          fetched. Valid options are:
              - "oneday": Last 24 hours with 1-minute aggregation.
              - "oneweek": Last 7 days with 5-minute aggregation.
              - "onemonth": Last 30 days with 15-minute aggregation.

    Returns:
        - A JSON array of time-series data points, where each data point 
          contains a timestamp and the corresponding aggregated value for the 
          selected quantity. Example:
          [
              {"time": "2024-09-27T12:00:00+00:00", "value": 25.5},
              {"time": "2024-09-27T12:01:00+00:00", "value": 25.6},
              ...
          ]

        - If the quantity or period is invalid, a 400 error response is 
          returned:
          {
              "error": "Invalid quantity <quantity>"
          }
          or
          {
              "error": "Invalid period <period>"
          }

        - If no data is found for the query, a 404 error response is returned:
          {
              "error": "No data found"
          }

        - If an error occurs while processing the data, a 500 error response 
          is returned:
          {
              "error": "<exception_message>"
          }

    Raises:
        - 400 Bad Request: If an invalid quantity or period is provided in the 
          query parameters.
        - 404 Not Found: If no data is found for the given query.
        - 500 Internal Server Error: If an exception occurs during data 
          processing.

    """
    quantity = request.args.get('quantity')
    if quantity not in ("temperature", "humidity", "pressure", "battery"):
        return jsonify({"error": "Invalid quantity %s" % quantity}), 400

    # query parameters -> period: (start, aggregate_period)
    query_data = {
                   'oneday'   : (  '-1d',  '1m'),
                   'oneweek'  : (  '-7d',  '5m'),
                   'onemonth' : ( '-30d', '15m')
                 }

    period = request.args.get('period')
    if period not in query_data:
        return jsonify({"error": "Invalid period %s" % period}), 400

    # make query
    query = f'''from(bucket: "{INFLUXDB_BUCKET}")
                |> range(start: {query_data[period][0]})
                |> filter(fn: (r) => r._measurement == "{INFLUXDB_BUCKET}" and r._field == "{quantity}" and r.sensor == "B")
                |> aggregateWindow(every: {query_data[period][1]}, fn: mean)
                |> keep(columns: ["_time", "_value"])
                |> sort(columns: ["_time"], desc: false)
             '''
 
    # get the data
    tables = query_api.query(query)

    if not tables:
        return jsonify({'error': 'No data found'}), 404

    try:
        # Parse the result into a list of dictionaries
        data = [{"time": record["_time"].isoformat(), "value": record["_value"]} for table in tables for record in table.records]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/average_timeseries', methods=['GET'])
def get_average_timeseries():
    quantity = request.args.get('quantity')
    if quantity not in ("temperature", "humidity", "pressure", "battery"):
        return jsonify({"error": "Invalid quantity %s" % quantity}), 400

    # query parameters -> period: (start, aggregate_period)
    query_data = {
                   'lastsevendays'  : (  '-8d', '15m'),
                   'lastthirtydays' : ( '-31d', '15m')
                 }

    period = request.args.get('period')
    if period not in query_data:
        return jsonify({"error": "Invalid period %s" % period}), 400

    # make query
    query = f'''from(bucket: "{INFLUXDB_BUCKET}")
                |> range(start: {query_data[period][0]}, stop: today())
                |> filter(fn: (r) => r._measurement == "{INFLUXDB_BUCKET}" and r._field == "{quantity}" and r.sensor == "B")
                |> aggregateWindow(every: {query_data[period][1]}, fn: mean)
                |> map(fn: (r) => ({{
                         _time: time(v: (uint(v: r._time) % uint(v: 86400000000000)) + uint(v: today())),
                         _value: r._value
                     }}))
                |> group(columns: ["_time"])
                |> mean(column: "_value")
             '''

    # get the data
    tables = query_api.query(query)

    if not tables:
        return jsonify({'error': 'No data found'}), 404

    try:
        # Parse the result into a list of dictionaries
        data = [{"time": record["_time"].isoformat(), "value": record["_value"]} for table in tables for record in table.records]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)