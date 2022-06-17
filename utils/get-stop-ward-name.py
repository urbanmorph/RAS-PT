# Script to add ward_name and ward_number attributes to Bus Stop GeoJSON

import json
from shapely.geometry import shape, Point

# load ward boundaries json
with open('bengaluru-wards-joined.json') as wards_json:
    wards = json.load(wards_json)

# load bus stop json
with open('bus-stops.json') as  stops_json:
    stops = json.load(stops_json)

stops_with_wards = []

for stop in stops:

    # construct point based on lon/lat of stop
    point = Point(float(stop['lon']), float(stop['lat']))

    # check each polygon to see if it contains the point
    for feature in wards['features']:
        polygon = shape(feature['geometry'])
        if polygon.contains(point):
            stop['ward_name'] = feature['properties']['Ward_Name']
            stop['ward_number'] = feature['properties']['Ward_Number']
            break
        stop['ward_name'] = 'Outside BBMP Limits'
        stop['ward_number'] = 'Outside BBMP Limits'

    stops_with_wards.append(stop)

# dump the bus stop json with ward attributes
with open('bus-stops-with-wards.json', 'w') as stops_json:
    json.dump(stops_with_wards, stops_json)
