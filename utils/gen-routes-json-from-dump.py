# A script to convert scrape dump from myBMTC API to JSON
# Scrape dump example:
#
#KIAS-4
#[{"busStopName":"HAL Main Gate (Towards Marathahalli Bridge)","lat":"12.95844606","lng":"77.66603425","routeorder":"1"},{"busStopName":"Jeevanbheema Nagara Cross","lat":"12.96675632","lng":"77.66143341","routeorder":"2"},{"busStopName":"Thippasandra","lat":"12.97417566","lng":"77.64683428","routeorder":"3"},{"busStopName":"Police Station Indiranagara","lat":"12.97828671","lng":"77.64041860","routeorder":"4"},{"busStopName":"Halasuru","lat":"12.97773420","lng":"77.62809777","routeorder":"5"},{"busStopName":"MEG Centre","lat":"12.98753794","lng":"77.62211099","routeorder":"6"},{"busStopName":"Coles Park (Towards Thomas Cafe)","lat":"12.99338253","lng":"77.60898829","routeorder":"7"},{"busStopName":"Millers Road","lat":"12.99508393","lng":"77.60296270","routeorder":"8"},{"busStopName":"JC Nagara","lat":"13.00498111","lng":"77.59392500","routeorder":"9"},{"busStopName":"Mekhri Circle","lat":"13.01699119","lng":"77.58381260","routeorder":"10"},{"busStopName":"Hebbala (Towards Yalahanka)","lat":"13.03829465","lng":"77.58910239","routeorder":"11"},{"busStopName":"Military Dairy Farm","lat":"13.04964238","lng":"77.59263379","routeorder":"12"},{"busStopName":"Navayuga Devanahalli Toll Plaza (KIAS Service)","lat":"13.04974743","lng":"77.59265631","routeorder":"13"},{"busStopName":"Byatarayanapura (Towards Yalahanka)","lat":"13.06550968","lng":"77.59298681","routeorder":"14"},{"busStopName":"Allalasandra Gate (Towards Kogilu Cross)","lat":"13.08540755","lng":"77.59421468","routeorder":"15"},{"busStopName":"Kogilu Cross","lat":"13.10388385","lng":"77.60025157","routeorder":"16"},{"busStopName":"Venkatala","lat":"13.11138610","lng":"77.60455583","routeorder":"17"},{"busStopName":"Indian Air Force","lat":"13.13107889","lng":"77.61502881","routeorder":"18"},{"busStopName":"Hunasamaranahalli","lat":"13.14526659","lng":"77.61740028","routeorder":"19"},{"busStopName":"Bettahalasuru Cross (Towards Devanahalli)","lat":"13.15710267","lng":"77.62336153","routeorder":"20"},{"busStopName":"Chikkajala","lat":"13.17280999","lng":"77.63318024","routeorder":"21"},{"busStopName":"Sadahalli Gate","lat":"13.19074621","lng":"77.64577860","routeorder":"22"},{"busStopName":"Trumpet","lat":"13.19409875","lng":"77.64996171","routeorder":"23"},{"busStopName":"Kempegowda International Airport","lat":"13.19911324","lng":"77.70918354","routeorder":"24"}]
#
# a file with an array of above such bus routes is converted to JSON

import json

routes = []

with open('finalstopscombined') as route_dump:
    for route_name in route_dump:
        route_dump_json = next(route_dump)
        try:
            route = json.loads(route_dump_json)
        except json.decoder.JSONDecodeError:
            continue

        route_json_element = {}
        route_json_element['id'] = route_name.strip()

        route_path = []

        for stop in route:
            stop_name = {"type": "stop", "name": stop['busStopName']}
            stop_location = {"type": "point", "location": [stop['lat'], stop['lng']]}
            route_path.append(stop_name)
            route_path.append(stop_location)

        route_json_element['routes'] = []
        route_json_element['routes'].append({"id": "forward", "route": route_path, "time": {}})

        routes.append(route_json_element)


with open('routes.myBMTCapp.2018.json', 'w') as routes_json:
    json.dump(routes, routes_json)
