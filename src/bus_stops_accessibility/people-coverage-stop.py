# Script to update the schema of the GeoJSON file to include intersecting polygons with radial circles around each bus stop
import pyproj
import json

from functools import partial
from shapely.geometry import shape, Point, Polygon, mapping
from shapely.ops import transform, unary_union

AC_NAME = "Yeshwantpura"

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

    buffer = point_transformed.buffer(500)

    buffer_wgs84 = transform(aeqd_to_wgs84, buffer)
    return buffer_wgs84

def update_booth_with_stop(booth, booth_poly, stop, intersect_poly):
    booth_polygon = shape(booth['geometry'])
    intersect_poly = (transform(lambda x, y: (y, x), intersect_poly))
    intersect_area = transform(
        partial(
            pyproj.transform,
            pyproj.Proj('EPSG:4326'),
            pyproj.Proj(
                proj='aea',
                lat_1=intersect_poly.bounds[1],
                lat_2=intersect_poly.bounds[3])),
        intersect_poly)

    stop_near_booth = {}
    stop_near_booth['stop'] = stop['stop_name']
    stop_near_booth['intersect_area'] = intersect_area.area
    stop_near_booth['percent_of_area'] = intersect_poly.area / booth_polygon.area
    stop_near_booth['people'] = float("{:.2f}".format(stop_near_booth['percent_of_area'] * booth['properties']['PEOPLE']))
    stop_near_booth['senior_people'] = float("{:.2f}".format(stop_near_booth['percent_of_area'] * booth['properties']['SENIOR_PEOPLE']))
    stop_near_booth['women'] = float("{:.2f}".format(stop_near_booth['percent_of_area'] * booth['properties']['WOMEN']))
    stop_near_booth['percent_of_area'] = float("{:.2f}".format(stop_near_booth['percent_of_area'] * 100))
    stop_near_booth['intersect_poly'] = mapping(intersect_poly)

    if 'stops' in booth['properties']:
        booth['properties']['intersect_poly'] = [booth['properties']['intersect_poly'], intersect_poly]
        booth['properties']['intersect_poly'] = unary_union(booth['properties']['intersect_poly'])
        booth['properties']['stops'] = booth['properties']['stops'] + [stop_near_booth]
    else:
        booth['properties']['intersect_poly'] = intersect_poly
        booth['properties']['stops'] = [stop_near_booth]
    return booth

def update_booth_properties(booth):
    booth_poly = transform(lambda x, y: (y, x), shape(booth['geometry']))
    if 'stops' in booth['properties']:
        intersect_poly = booth['properties']['intersect_poly']
        intersect_percentage = intersect_poly.area / booth_poly.area
        del booth['properties']['intersect_poly']
        booth['properties']['access_percentage'] = float("{:.2f}".format((intersect_percentage) * 100))
        booth['properties']['no_access_percentage'] = float("{:.2f}".format((1 - intersect_percentage) * 100))
        booth['properties']['access_poly'] = mapping(intersect_poly)
        try:
            booth['properties']['no_access_poly'] = mapping(booth_poly.difference(intersect_poly))
        except:
            print('Geometry has self-intersection for ' + booth['properties']['PS_Name'] + ', trying to fix...')
            print(booth_poly)
            print(intersect_poly)
            booth['properties']['no_access_poly'] = mapping(booth_poly.difference(intersect_poly[0]).buffer(0))
    else:
        booth['properties']['access_percentage'] = 0
        booth['properties']['no_access_percentage'] = 100
        booth['properties']['access_poly'] = mapping(Polygon())
        booth['properties']['no_access_poly'] = mapping(booth_poly)
    return booth

# Find stops near a particular booth and update the JSON for the booth
def update_booths_near_stop(booths, stop, circle):
    for idx, booth in enumerate(booths["features"]):
        polygon = shape(booth['geometry'])
        intersects = circle.intersects(polygon)
        if intersects:
            intersect_poly = circle.intersection(polygon)
            booths["features"][idx] = update_booth_with_stop(booth, polygon, stop, intersect_poly)
    return booths

# Find stops within 500m of the combined booth polygon
def stops_near_ac(booths, stops):
    num_stops = len(stops)
    stops_to_process = []
    for idx, stop in enumerate(stops):
        print(str(idx) + " stops read out of " + str(num_stops) + " stops.") if idx % 10 == 0 else 0
        x = float(stop["lat"])
        y = float(stop["lon"])
        circle = buffer_in_meters(y, x, 500)
        if circle.intersects(ac_poly):
            stops_to_process.append(stop)
    return stops_to_process

# Go through all the booths and find which stops are near each of them
def get_booths_intersections(booths, stops):
    num_stops = len(stops)
    for idx, stop in enumerate(stops):
        print(str(idx) + " stops processed out of " + str(num_stops) + " stops.") if idx % 10 == 0 else 0
        x = float(stop["lat"])
        y = float(stop["lon"])
        circle = buffer_in_meters(y, x, 500)
        #if 'Manyatha' not in stop_name:
        #    continue
        #if idx > 100:
        #    break
        booths = update_booths_near_stop(booths, stop, circle)
    return booths

with open('data/bus-stops-2018.json') as stops_json:
    stops = json.load(stops_json)
with open('data/ac-163-demographics-and-stops.json') as booths_json:
    booths = json.load(booths_json)

# Combined polygon of all booths for initial check
ac_poly = Polygon()
for booth in booths["features"]:
    ac_poly = [ac_poly, shape(booth['geometry'])]
    ac_poly = unary_union(ac_poly)

#stops_to_process = stops_near_ac(booths, stops)
booths = get_booths_intersections(booths, stops)

for idx, booth in enumerate(booths["features"]):
    booths["features"][idx] = update_booth_properties(booth)

booths["name"] = AC_NAME

with open('data/ac-163-accessibility-gaps-2018.geojson', 'w') as ac_json:
    json.dump(booths, ac_json)
