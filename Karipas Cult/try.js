document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";
    //first commit github yeye

  const walkingThresholdinMeters = 400; // willing ka ba maglakad ng 1km para makatry ng ibang route?
  const numberOfClosestRoutes = 2; // ilang route na within sa walking threshold ang gusto mo tingnan
  const walkingLineIds = [];
  const commonRouteIds = [];
 
  const map = new mapboxgl.Map({ // default for showning map
    container: "map",
    style: "mapbox://styles/mapbox/light-v10",
    center: [121.05235981732966, 13.773815015863619],
    zoom: 14,
  });
  const geocoder = new MapboxGeocoder({ // for search bar sa gilid. extra thingz
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
  });

  map.addControl(geocoder, "top-left"); // search bar
  map.addControl(new mapboxgl.NavigationControl(), "bottom-right"); // button for zooming

  var startMarker, endMarker;
  var settingStart = false;
  var settingEnd = false;

  const polylines = [];

  function displayAllRoutes(polylineData, color) { // for showing routes on map. pede tanggalin
    map.addSource(polylineData.id, {
      type: "geojson",
      data: polylineData.data,
    });

    map.addLayer({
      id: polylineData.id,
      type: "line",
      source: polylineData.id,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 8,  
        "line-opacity": 0.1,
      },
    });
  }

  map.on("load", function () { // for showing routes. pede tanggalin
    const polylineInfo = [
      {url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/alangilan.json",color: "#ff0000",},
      {url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/balagtas.json",color: "#00ff00",},
      {url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/bauanbat.json",color: "#0000FF",},
      {url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/libjo.geojson",color: "#0000FF",},
      {url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/capitolio.json",color: "#0000FF",},
    ];

    polylineInfo.forEach((info) => {
      fetch(info.url)
        .then((response) => response.json())
        .then((data) => {
          const polylineData = {
            id: `custom-polyline-${polylines.length + 1}`,
            data: data,
          };
          displayAllRoutes(polylineData, info.color);
          polylines.push(polylineData);
        })
        .catch((error) =>
          console.error(`Error loading polyline: ${info.url}`, error)
        );
    });
  });

  map.on("click", function (e) { // interaction sa map. default halos 
    if (settingStart) {
      handleMarkerSetting(e, "start");
    } else if (settingEnd) {
      handleMarkerSetting(e, "end");
    }
  });

  function setMode(mode) { // for buttons lang
    settingStart = mode === "start";
    settingEnd = mode === "end";
  }

  document.getElementById("setStart").addEventListener("click", function () { // pag clinick mo yung origin button
    setMode("start");
    document.getElementById("popupstart").style.display = "block";
    document.getElementById("popupstart").textContent ="Pin on the map to set " + (settingStart ? "Origin" : "Destination");
  });

  document.getElementById("setEnd").addEventListener("click", function () { // for detination button
    setMode("end");
    document.getElementById("popupstart").style.display = "block";
    document.getElementById("popupstart").textContent ="Pin on the map to set " + (settingStart ? "Origin" : "Destination");
  });

  function clearWalkingLines() {
    walkingLineIds.forEach(({ sourceId, layerId }) => {
      map.removeLayer(layerId);
      map.removeSource(sourceId);
    });
  
    // Clear the array
    walkingLineIds.length = 0;
  }

  function clearCommonRoutes() { 
    commonRouteIds.forEach(({ sourceId, layerId }) => {
      map.removeLayer(layerId);
      map.removeSource(sourceId);
    });
  
    // Clear the array
    commonRouteIds.length = 0;
  }

  document.getElementById("final").addEventListener("click", async function () { // for doing everything
    try {
      clearWalkingLines();
      clearCommonRoutes();
      document.getElementById("popupstart").style.display = "none";
      if (!startMarker || !endMarker) {
        alert("Pin both origin and destination before finalizing.");
        return;
      }

      const startPinCoordinates = [ startMarker.getLngLat().lng, startMarker.getLngLat().lat,] // get coordinates
      const endPinCoordinates = [endMarker.getLngLat().lng,endMarker.getLngLat().lat,];
      console.log("ORIGINAL USER PIN:", startPinCoordinates, endPinCoordinates);

      const startResult = await getGeocodeResult(startPinCoordinates); // gives geocoded stuff 

      const startuserPin = { // geocoded results things
        lat: startResult.geometry.coordinates[1],
        lng: startResult.geometry.coordinates[0],
      };

      const endResult = await getGeocodeResult(endPinCoordinates);
      const enduserPin = {
        lat: endResult.geometry.coordinates[1],
        lng: endResult.geometry.coordinates[0],
      };

      console.log("GEOCODED USER PIN:", startuserPin, enduserPin);
      await compareAndDrawtheLines(startuserPin, enduserPin); // will check if the 2 pins have common nearest route 

      const startGeocode = startMarker.getLngLat(); // for DBMS ...
      const endGeocode = endMarker.getLngLat();
      var geocodes = {
        start: {
          lat: startGeocode.lat,
          lng: startGeocode.lng,
        },
        end: {
          lat: endGeocode.lat,
          lng: endGeocode.lng,
        },
      };
      // Set geocodes to hidden form fields
      document.getElementById("startLatitude").value = geocodes.start.lat; 
      document.getElementById("startLongitude").value = geocodes.start.lng;
      document.getElementById("endLatitude").value = geocodes.end.lat;
      document.getElementById("endLongitude").value = geocodes.end.lng;

      var loggedInUser = "<?php echo $loggedInUser; ?>";
      if (loggedInUser) {
        document.getElementById("saveGeocodesButton").style.display =
          "inline-block";
        document.getElementById("saveGeocodeForm").submit(); // ... for DBMS 
      }
    } catch (error) {
      console.error("Error during final click:", error);
    }
  });

  function handleMarkerSetting(e, type) { // create pin/marker sa map
    const marker = type === "start" ? startMarker : endMarker;

    if (marker) {
      marker.remove();
    }

    const lngLat = e.lngLat;
    const newMarker = new mapboxgl.Marker().setLngLat(lngLat).addTo(map);

    if (type === "start") {
      startMarker = newMarker;
    } else {
      endMarker = newMarker;
    }
    
    showAddress(lngLat, type);
  }

  async function showAddress(lngLat, type) { // show address of pins 
    try {
      const pinCoordinates = [lngLat.lng, lngLat.lat];
      const result = await getGeocodeResult(pinCoordinates);

      if (result) {
        const pinAddress = result.place_name;

        document.getElementById(`popAddress-${type}`).style.display ="inline-block";
        document.getElementById(`addressText-${type}`).textContent = pinAddress;
      } else {
        console.error(`Invalid geocoding result for ${type}`);
      }
    } catch (error) {
      console.error(`Error geocoding ${type}:`, error);
    }
  }

  async function getGeocodeResult(pinCoordinates) { // gives geocoded results like address, geocoded na pin n stuff 
    try {
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${pinCoordinates.join(",")}.json?access_token=${mapboxgl.accessToken}`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      return data.features ? data.features[0] : null;
    } catch (error) {
      console.error("Error fetching geocode result:", error);
      return null;
    }
  }

  function haversineDistance(coord1, coord2) { // use to calculate walking distance? idk chatgpt
    const R = 6371;
    const dLat = toRadians(coord2.lat - coord1.lat);
    const dLng = toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(coord1.lat)) *
        Math.cos(toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers

    return distance * 1000; // Convert to meters
  }

  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async function findClosestPointOnRoutes(coordinates) { // find the closest point on each route. Returns an array of sorted closest points 
    const polylineURLs = [
      "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/alangilan.json", 
      "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/balagtas.json",
      "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/bauanbat.json",
      "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/libjo.json",
      "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/capitolio.json",
    ];

    try {
      const responses = await Promise.all(polylineURLs.map((url) => fetch(url)));
      const polylineDataArray = await Promise.all(responses.map((response) => response.json()));
  
      let closestPointsArray = [];
  
      polylineDataArray.forEach((data, index) => {

        const firstFeature = data.features[0];
  
        const polylineCoordinates = firstFeature.geometry.coordinates;
        const currentClosestPoint = findClosestPointOnLine(coordinates, polylineCoordinates); // finds the closespoint of each route from the pin
  
        if (currentClosestPoint) {
          currentClosestPoint.route = polylineURLs[index];
          closestPointsArray.push(currentClosestPoint); // puts the closespoint of each route on an array
        }

      });

      console.log("NEAREST JEEPNEY ROUTES OF PIN:", closestPointsArray);  
      if (closestPointsArray.length === 0) {
        console.error("No valid closest points found. boom");
        
        return null;
      }
  
      closestPointsArray.sort((a, b) => a.distance - b.distance); // sort points from nearest to farthest 
      
      const top3ClosestPoints = closestPointsArray.slice(0, numberOfClosestRoutes ); 

      return top3ClosestPoints;
    } catch (error) {
      console.error("Error loading polyline data:", error);
      return null;
    }
  }

  function findClosestPointOnLine(point, line) { // returns the closest points of each route 
    if (!point ||(!point.lat && point[1] === undefined) ||(!point.lng && point[0] === undefined) ||!Array.isArray(line) ||line.length === 0) {
      console.error(
        "Invalid coordinate or line array for findClosestPointOnLine:",point,line); return null;
    } 

    const closestPoint = line.reduce((acc, cur) => {
        const distance = haversineDistance(point, { lat: cur[1], lng: cur[0] }); // get distance

        if (distance < walkingThresholdinMeters) { // check if the distance is still within the walking threshold
          const currentPoint = { lat: cur[1], lng: cur[0], distance };
          return acc.distance < distance ? acc : currentPoint;
        }
        return acc;
      },
      { lat: line[0][1], lng: line[0][0], distance: Infinity }
    );

    return closestPoint.distance === Infinity ? null : closestPoint;
  }

  const fetchWalkingLines = async (startCoordinates, endCoordinates) => {  // to get walking lines
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${startCoordinates.lng},${startCoordinates.lat};${endCoordinates.lng},${endCoordinates.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching walking lines: ${response.statusText}`);
      }
      const data = await response.json();

      if (data && data.code === "Ok" && data.routes && data.routes.length > 0) {
        const walkingLines = data.routes.map((route) => {
          return route.geometry.coordinates;
        });

        const distances = data.routes.map((route) => {
          return {
            duration: route.duration / 60, // Convert seconds to minutes
            distance: route.distance,
          };
        });

        return { walkingLines, distances };
      } else {
        console.error(
          "No routes found in the Walking Lines API response:",
          data
        );
        return null;
      }
    } catch (error) {
      console.error("Error fetching walking lines:", error);
      return null;
    }
  };

  async function drawWalkingLines(startCoordinates, endCoordinates, marker) { // walking lines from pin to closest points on routes
    try {

      const { walkingLines, distances } = await fetchWalkingLines(startCoordinates,endCoordinates);
        
      walkingLines.forEach((line, index) => {
        const sourceId = `${marker}-walking-line-source-${index}-${Math.random()}`;
        const layerId = `${marker}-walking-line-layer-${index}-${Math.random()}`;

        walkingLineIds.push({ sourceId, layerId });

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              duration: distances[index].duration,
              distance: distances[index].distance,
            },
            geometry: {
              type: "LineString",
              coordinates: line,
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": marker === "start"? "#469904": marker === "end"? "#0000FF": "#0000FF",
            "line-width": 5,
            "line-dasharray": [1, 2],
          },
        });

        console.log(`Duration for route ${index + 1}: ${distances[index].duration} minutes`);
        console.log(`Distance for route ${index + 1}: ${distances[index].distance} meters`);
    
      });
    } catch (error) {
      console.error("Error drawing walking lines:", error);
    }
  }

  async function compareAndDrawtheLines(origin, destination) { 
    
    const originClosestPoints = await findClosestPointOnRoutes(origin); // gets the closest points of origin 
    const destinationClosestPoints = await findClosestPointOnRoutes(destination);

    if (!originClosestPoints || !destinationClosestPoints) {
      console.error("Error finding closest points.");
      return;
    }

    for (const startClosestPoint of originClosestPoints) { // draw walking lines for each closest point
      await drawWalkingLines(origin, startClosestPoint, "start");
    }

    for (const endClosestPoint of destinationClosestPoints) {
      await drawWalkingLines(destination, endClosestPoint, "end");
    }

    const originRoutes = originClosestPoints.map((point) => point.route); // extract the routes
    const destinationRoutes = destinationClosestPoints.map((point) => point.route); // extract the routes

    const commonRoutes2 = findExactCommonRoutes(originRoutes,destinationRoutes);

    if (commonRoutes2.length > 0) {
      console.log(`Origin and destination share common routes: ${commonRoutes2.join(", ")}`);
      // Draw walking lines for common routes
      for (const commonRoute of commonRoutes2) {
        await drawJeepCommonRoute(commonRoute,originClosestPoints,destinationClosestPoints);
      }
    } else {
      console.log("Origin and destination do not have common routes. You have to go to STOP POINTS");
      await findAlternativeRoute(originClosestPoints, destinationClosestPoints);

    }
  }

  async function drawJeepCommonRoute(route, originClosestPoints, destinationClosestPoints) {
    try {
      let commonRoutes = "";
      const response = await fetch(route);
      const data = await response.json();
  
      if (!data || !data.features || data.features.length === 0) {
        console.error(`Invalid polyline data for ${route}:`, data);
        return;
      }
  
      const firstFeature = data.features[0];
  
      if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
        console.error(`Invalid geometry in polyline data for ${route}:`, firstFeature.geometry);
        return;
      }
  
      const polylineCoordinates = firstFeature.geometry.coordinates;
      for (let i = 0; i < originClosestPoints.length; i++) {
        const originPoint = originClosestPoints[i];
        const destinationPoint = destinationClosestPoints[i];
  
        const indexOrigin = findClosestPointIndex(polylineCoordinates, originPoint);
        const indexDestination = findClosestPointIndex(polylineCoordinates, destinationPoint);
  
        if (indexOrigin === null || indexDestination === null) {
          console.error(`Error finding closest points on ${route} for origin or destination.`);
          return;
        }
  
        const subsetCoordinates = calculateSubsetCoordinates(polylineCoordinates, indexOrigin, indexDestination);
  
        // Check if subsetCoordinates is not empty before attempting to draw the line
        if (subsetCoordinates.length > 0) {
          const sourceId2 = "used-route-source-" + Date.now();
          const layerId2 = "used-route-layer-" + Date.now();
  
          commonRouteIds.push({ sourceId: sourceId2, layerId: layerId2 });
  
          map.addSource(sourceId2, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: subsetCoordinates,
              },
            },
          });
  
          map.addLayer({
            id: layerId2,
            type: "line",
            source: sourceId2,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": getRandomColor(),
              "line-width": 6,
              "line-opacity": 1,
            },
          });
  
          console.log("THERE SHOULD BE A DRAWING OF JEEP");
          commonRoutes += `${route}, `;
        } else {
          console.error(`Subset coordinates are empty for ${route}. Skipping drawing for this pair.`);
        }
      }
  
      document.getElementById(`closestRoute`).textContent = commonRoutes.slice(0, -2);
    } catch (error) {
      console.error(`Error drawing line connecting closest points for common route ${route}:`, error);
    }
  }
  function calculateSubsetCoordinates(polylineCoordinates, indexOrigin, indexDestination, isOneWay) {
    const subsetCoordinates = [];
  
    if (isOneWay) {
      // Only consider traversal if the road segment is one-way
      if (indexDestination < indexOrigin) {
        console.error("Error: Incorrect order for one-way street");
        return subsetCoordinates; // or handle the error in an appropriate way
      }
    }
  
    subsetCoordinates.push(...polylineCoordinates.slice(indexOrigin, indexDestination + 1));
  
    return subsetCoordinates;
  }
  
  function findClosestPointIndex(polylineCoordinates, point) {
  let closestIndex = null;
  let closestDistance = Number.MAX_VALUE;
  let visitedIndices = new Set();

  for (let i = 0; i < polylineCoordinates.length; i++) {
    const currentPoint = polylineCoordinates[i];
    const distance = calculateDistance(currentPoint, point);

    if (distance < closestDistance && !visitedIndices.has(i)) {
      closestIndex = i;
      closestDistance = distance;
      visitedIndices.add(i);
    }
  }
  return closestIndex;
}

function calculateDistance(coord1, coord2) {
  const lat1 = Array.isArray(coord1) ? coord1[1] : coord1.lat;
  const lng1 = Array.isArray(coord1) ? coord1[0] : coord1.lng;
  const lat2 = Array.isArray(coord2) ? coord2[1] : coord2.lat;
  const lng2 = Array.isArray(coord2) ? coord2[0] : coord2.lng;

  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) {
    console.error("Invalid coordinates:", coord1, coord2);
    return;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

  function findExactCommonRoutes(route1, route2) { //
    const arrayify = (value) => (Array.isArray(value) ? value : [value]);

    const set1 = new Set(arrayify(route1));
    const set2 = new Set(arrayify(route2));

    const uniqueCommonRoutes = new Set([...set1].filter(route => set2.has(route)));

    return [...uniqueCommonRoutes];
  }

  function getRandomColor() {
    const colorsForRoutesRandom = ['#9a1115','#e1ad01','#1975b5']
    const randomIndex = Math.floor(Math.random() * colorsForRoutesRandom.length);
    const randomColor = colorsForRoutesRandom[randomIndex];

    return randomColor;
    }

  async function getStopPoints() {
    try {
      const response = await fetch("http://localhost/Karipas/Karipas%20Cult/RoutesPoly/StopPoints.json");
      const data = await response.json();
      return data.features.map(feature => feature.geometry.coordinates);
    } catch (error) {
      console.error("Error during getStopPoints:", error);
      return [];
    }
  }

  async function findAlternativeRoute(originClosestPoints, destinationClosestPoints) {
    try {
        const stopPoints = await getStopPoints();
        if (stopPoints.length === 0) {
            console.error("No stop points found.");
            return;
        }

        for (const stopPointArray of stopPoints) {
            const stopPoint = {
                lat: stopPointArray[1],
                lng: stopPointArray[0],
            };

            const connectionRoutes = await findConnectionPointsAtStop(stopPoint, originClosestPoints, destinationClosestPoints);

            if (connectionRoutes.length > 0) {
                console.log(`We have a connection at stop point:`, stopPoint);
                await drawAlternativeRoutes(originClosestPoints, destinationClosestPoints, stopPoint, connectionRoutes);
            }
        }
    } catch (error) {
        console.error("Error during findAlternativeRoute:", error);
    }
}

async function findConnectionPointsAtStop(stopPoint, originClosestPoints, destinationClosestPoints) {
    try {
        const closestRoutePoints = await findClosestPointOnRoutes(stopPoint);

        if (!closestRoutePoints || closestRoutePoints.length === 0) {
            console.error("No closest route points found for the stop point.");
            return [];
        }

        const stopRoutes = closestRoutePoints.map((point) => point.route);

        // Find the common route at the stop point that matches the destination's closest route
        const connectionRoutes = originClosestPoints.filter((originRoute) =>
            destinationClosestPoints.some((destinationRoute) => stopRoutes.includes(originRoute.route))
        );

        return connectionRoutes;
    } catch (error) {
        console.error("Error finding connection points at stop:", error);
        return [];
    }
}

async function drawAlternativeRoutes(originClosestPoints, destinationClosestPoints, stopPoint, connectionRoutes) {
    try {
        // Draw jeepney lines from origin to the stop point
        await drawJeepCommonRoute(originClosestPoints[0].route, originClosestPoints, [stopPoint]);

        for (const connectionRoute of connectionRoutes) {
          await drawJeepCommonRoute(connectionRoute.route, [stopPoint], destinationClosestPoints);
      }
        // Draw walking lines from the stop point to the destination
        const stopPointLatLng = { lat: stopPoint.lat, lng: stopPoint.lng };
        await drawWalkingLines(stopPointLatLng, destinationClosestPoints, "stop");

        // Draw jeepney lines from the stop point to the destination with dynamic connections
        
    } catch (error) {
        console.error("Error drawing alternative routes:", error);
    }
}

});
