                <tr><th>Ward number</th><td>${s.feature.properties.Ward_Number}</td></tr>
                <tr><th>Ward name</th><td>${s.feature.properties.Ward_Name}</td></tr>
            </table>`},{className:"foliumtooltip",sticky:!0});o.forEach(function(s){var a=L.circleMarker([s.lat,s.lon],{bubblingMouseEvents:!0,color:"green",dashArray:null,dashOffset:null,fill:!0,fillColor:"#3186cc",fillOpacity:.2,fillRule:"evenodd",lineCap:"round",lineJoin:"round",opacity:1,radius:5,stroke:!0,weight:3}).addTo(e);a.bindTooltip(`<div>
                 ${s.stop_name}
             </div>`,{sticky:!0})});