# Script to update the schema of the GeoJSON file to include intersecting polygons with radial circles around each bus stop
import pyproj
import json

from functools import partial
from shapely.geometry import shape, Point, Polygon, mapping
from shapely.ops import transform, unary_union

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

with open('data/bus-stops-2018.json') as stops_json:
    stops = json.load(stops_json)
with open('data/ac-152-demographics-and-stops.json') as booths_json:
    booths = json.load(booths_json)

# Combined polygon of all booths for initial check
ac_poly = Polygon()
for booth in booths["features"]:
    ac_poly = [ac_poly, shape(booth['geometry'])]
    ac_poly = unary_union(ac_poly)

intersections = {'intersect_poly_union': {}}
num_stops = len(stops)

# Find booths within 500m of every bus stop
for idx, stop in enumerate(stops):
    print(str(idx) + " stops done out of " + str(num_stops) + " stops.") if idx % 10 == 0 else 0
    x = float(stop["lat"])
    y = float(stop["lon"])
    stop_name = stop['stop_name']
    circle = buffer_in_meters(y, x, 500)
    if not circle.intersects(ac_poly):
        # Stop is not near combined booth polygon
        continue
    #if 'Manyatha' not in stop_name:
    #    continue
    #if idx > 100:
    #    break
    for booth in booths["features"]:
        # TODO: Move into separate function
        polygon = shape(booth['geometry'])
        intersects = circle.intersects(polygon)
        if intersects:
            intersect_instance = {}
            booth_id = booth['id']
            intersect_poly = circle.intersection(polygon)
            intersect_instance['stop'] = stop_name
            intersect_area = transform(
                partial(
                    pyproj.transform,
                    pyproj.Proj(init='EPSG:4326'),
                    pyproj.Proj(
                        proj='aea',
                        lat_1=intersect_poly.bounds[1],
                        lat_2=intersect_poly.bounds[3])),
                intersect_poly)
            intersect_instance['intersect_area'] = intersect_area.area
            intersect_instance['percent_of_area'] = intersect_poly.area / polygon.area
            intersect_instance['people'] = float("{:.2f}".format(intersect_instance['percent_of_area'] * booth['properties']['PEOPLE']))
            intersect_instance['senior_people'] = float("{:.2f}".format(intersect_instance['percent_of_area'] * booth['properties']['SENIOR_PEOPLE']))
            intersect_instance['women'] = float("{:.2f}".format(intersect_instance['percent_of_area'] * booth['properties']['WOMEN']))
            intersect_instance['percent_of_area'] = float("{:.2f}".format(intersect_instance['percent_of_area'] * 100))
            intersect_polys = [transform(lambda x, y: (y, x), intersect_poly)]
            intersect_instance['intersect_polygon'] = mapping(intersect_polys[0])
            if booth_id in intersections:
                intersections[booth_id].append(intersect_instance)
                intersect_polys.append(intersections['intersect_poly_union'][booth_id])
                intersections['intersect_poly_union'][booth_id] = unary_union(intersect_polys)
            else:
                intersections[booth_id] = [intersect_instance]
                intersections['intersect_poly_union'][booth_id] = intersect_polys[0]
            # TODO: Proper debugging information reporting flow
            #print(circle.area)
            #print(json.dumps(mapping(circle)))
            #print(intersect_poly.area)
            #print(json.dumps(mapping(intersect_poly)))
            #print(polygon.area)
            #print(json.dumps(mapping(polygon)))
            print(booth_id)
            print(intersections[booth_id])
            print(intersections['intersect_poly_union'][booth_id])

new_booth_json = {"type": "FeatureCollection", "name": "Byataryanapura"}
features = []

# TODO: Move into separate function
for booth in booths["features"]:
    new_booth = booth
    booth_id = booth['id']
    booth_poly = transform(lambda x, y: (y, x), shape(booth['geometry']))
    if booth_id in intersections:
        new_booth['properties']['STOPS'] = intersections[booth_id]
        total_intersect_poly = intersections['intersect_poly_union'][booth_id]
        total_intersect_percentage = total_intersect_poly.area / booth_poly.area
        new_booth['properties']['ACCESS'] = float("{:.2f}".format((total_intersect_percentage) * 100))
        new_booth['properties']['NO_ACCESS'] = float("{:.2f}".format((1 - total_intersect_percentage) * 100))
        new_booth['properties']['ACCESS_POLY'] = mapping(total_intersect_poly)
        new_booth['properties']['NO_ACCESS_POLY'] = mapping(booth_poly.difference(total_intersect_poly))
    else:
        new_booth['properties']['ACCESS'] = 0
        new_booth['properties']['NO_ACCESS'] = 100
        new_booth['properties']['ACCESS_POLY'] = mapping(Polygon())
        new_booth['properties']['NO_ACCESS_POLY'] = mapping(booth_poly)
    features.append(new_booth)

new_booth_json["features"] = features

with open('data/ac-152-accessibility-gaps-2018.geojson', 'w') as ac_json:
    json.dump(new_booth_json, ac_json)
