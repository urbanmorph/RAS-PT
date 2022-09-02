# Script to update the schema of the GeoJSON file to include intersecting polygons with radial circles around each bus office
import pyproj
import json

from functools import partial
from shapely.geometry import Point
from shapely.ops import transform

# From: https://gis.stackexchange.com/questions/268250/generating-polygon-representing-rough-100km-circle-around-latitude-longitude-poi
def buffer_in_meters(lng, lat, radius):
    point = Point(lng, lat)
    local_azimuthal_projection = f"+proj=aeqd +R=6371000 +units=m +lat_0={lat} +lon_0={lng}"

    wgs84_to_aeqd = partial(
        pyproj.transform,
        pyproj.Proj('+proj=longlat +datum=WGS84 +no_defs'),
        pyproj.Proj(local_azimuthal_projection),
    )

    aeqd_to_wgs84 = partial(
        pyproj.transform,
        pyproj.Proj(local_azimuthal_projection),
        pyproj.Proj('+proj=longlat +datum=WGS84 +no_defs'),
    )

    point_transformed = transform(wgs84_to_aeqd, point)

    buffer = point_transformed.buffer(radius)

    buffer_wgs84 = transform(aeqd_to_wgs84, buffer)
    return buffer_wgs84

with open('data/bangalore_companies.json') as offices_json:
    offices = json.load(offices_json)

with open('data/bmtc-api-2018-stops.json') as stops_json:
    stops = json.load(stops_json)

offices_with_access = []
max_stops = 0

for office in offices:
    # construct point based on lon/lat of office
    office_region = buffer_in_meters(float(office['lon']), float(office['lat']), 500)
    office["stops"] = []

    for stop in stops:
        point = Point(float(stop['StopLong']), float(stop['StopLat']))
        if office_region.contains(point):
            office["stops"] = office["stops"] + [stop['StopName']]
    if len(office["stops"]) > max_stops:
        max_stops = len(office["stops"])

    print(office)
    offices_with_access.append(office)

with open('data/bangalore_offices_access.json', 'w') as offices_json:
    json.dump(offices_with_access, offices_json)

print(max_stops)
