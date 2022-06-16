#!/usr/bin/env python
# coding: utf-8

import pandas as pd
import folium

df=pd.read_excel('bus_stops_2016.xlsx')
bbmpwards=f'bengaluru-wards-joined.json'

m = folium.Map(location=[12.9796734, 77.5912443], zoom_start=11)

folium.GeoJson(
    bbmpwards,
    name='BBMP Wards',
    style_function = lambda x: {
        'color': 'gray',
        'weight': 1,
        'fillOpacity': 0.2},
        tooltip=folium.features.GeoJsonTooltip(fields=['Ward_Number', 'Ward_Name'], 
                                           aliases=['Ward Number', 'Ward Name'])
).add_to(m)

for i in range(len(df)):
    folium.CircleMarker(
    location=[df.loc[i].lat,df.loc[i].lon],
    radius=5,
    tooltip=f"{df.loc[i].stop_name}",
    color='green',
    fill=True,
    fill_color='#3186cc'
).add_to(m)

m.save('bus_stops.html')





