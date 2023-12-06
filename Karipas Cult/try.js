document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";

  const walkingThresholdinMeters = 1000; // willing ka ba maglakad ng 1km para makatry ng ibang route?
  const numberOfClosestRoutes = 2; // ilang route na within sa walking threshold ang gusto mo tingnan
  const walkingLineIds = [];
  const commonRouteIds = [];
  
  const mapBounds = new mapboxgl.LngLatBounds([
    [120.919581,13.670207], // Southwest corner
    [121.201734,13.900609] // Northeast corner
  ]);

  const map = new mapboxgl.Map({ // default for showning map
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [121.05235981732966, 13.773815015863619],
    zoom: 13,
    maxBounds: mapBounds,
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

  function handleMarkerSetting(e, type) {
    const marker = type === "start" ? startMarker : endMarker;
    const markerImage = type === "start"
  ? "http://localhost/Karipas/Karipas%20Cult/images/mapbox-marker-icon-20px-green.png"
  : "http://localhost/Karipas/Karipas%20Cult/images/mapbox-marker-icon-20px-red.png";


    if (marker) {
        marker.remove();
    }

    const lngLat = e.lngLat;

    const newMarker = new mapboxgl.Marker({
        element: createCustomMarker(markerImage),
    }).setLngLat(lngLat).addTo(map);

    if (type === "start") {
        startMarker = newMarker;
    } else {
        endMarker = newMarker;
    }

    showAddress(lngLat, type);
  }

  function createCustomMarker(markerImage) {
      const markerElement = document.createElement('img');
      markerElement.src = markerImage;
      markerElement.style.width = '26px';
      markerElement.style.height = '62.4px';
      return markerElement;
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
    walkingLineIds.length = 0;
  }

  function clearCommonRoutes() { 
    commonRouteIds.forEach(({ sourceId, layerId }) => {
      map.removeLayer(layerId);
      map.removeSource(sourceId);
    });
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
    ];

    console.log("STOP POINT:", coordinates)

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

      for (const commonRoute of commonRoutes2) {
        const originPoint = originClosestPoints.find(point => point.route === commonRoute);
        const destinationPoint = destinationClosestPoints.find(point => point.route === commonRoute);
        await drawJeepCommonRoute(commonRoute, originPoint, destinationPoint);
      }
    } else {

      console.log("Origin and destination do not have common routes. You have to go to STOP POINTS");
      const stopPoints = await getStopPoints();
      console.log(stopPoints)
      if (stopPoints.length === 0) {
        console.error("No stop points found.");
        return;
    }
    for (const stopPointArray of stopPoints) {
      console.log(stopPointArray)
        const stopPoint = {
            lat: stopPointArray[1],
            lng: stopPointArray[0],
        };

        const closestRoutePoints = await findClosestPointOnRoutes(stopPoint);
        console.log("STOPPOINT:", closestRoutePoints)

        console.log(stopPoint)
      }
    

      for (const stopPoint of closestRoutePoints) {
        const originPoint = originClosestPoints.find(point => point.route === stopPoint);
        const destinationPoint = destinationClosestPoints.find(point => point.route === stopPoint);
        const sameStopPointOrigin = stopPoint.find(point => point.route == originClosestPoints)
        const sameStopPointDestination = stopPoint.find(point => point.route == destinationClosestPoints)
        await drawJeepCommonRoute(stopPoint, originPoint, sameStopPointOrigin );
        await drawJeepCommonRoute(stopPoint, destinationPoint, sameStopPointDestination);

      }
    }
  }

  async function drawJeepCommonRoute(route, originClosestPoint, destinationClosestPoint) {
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

      console.log("FINDING OPTIMAL ROUTE")
      const overlappingPoints = getOverlappingPointsOfCompressedCircle(polylineCoordinates);

      const {indexOrigin, indexDestination} = findOptimalOriginAndDestinationPoints (polylineCoordinates, originClosestPoint, destinationClosestPoint, overlappingPoints)
      console.log ("THIS IS THE INDEXES", indexOrigin,indexDestination)


      if (indexOrigin === null || indexDestination === null) {
        console.error(`Error finding closest points on ${route} for origin or destination.`);
        return;
      }
        const subsetCoordinates = calculateSubsetCoordinates(polylineCoordinates, indexOrigin, indexDestination);
  
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
              "line-width": getRandomWidth(),
              "line-opacity": getRandomOpacity(),
            },
          });
  
          console.log("THERE SHOULD BE A DRAWING OF JEEP");
          commonRoutes += `${route}, `;
        } else {
          console.error(`Subset coordinates are empty for ${route}. Skipping drawing for this pair.`);
        }
  
      document.getElementById(`closestRoute`).textContent = commonRoutes.slice(0, -2);
    } catch (error) {
      console.error(`Error drawing line connecting closest points for common route ${route}:`, error);
    }
  }

  function getRandomWidth() {
    return Math.floor(Math.random() * (12 - 5 + 1)) + 4;
  }

  function getRandomOpacity() {
    const randomValue = Math.random();
    const adjustedValue = 0.5 + 0.4 * randomValue;
    return Math.min(adjustedValue, 1);
  }

  function findOptimalOriginAndDestinationPoints(route, originClosestPoint, destinationClosestPoint, overlappingPoints) {
    const originDontOverlap = !checkOverlappingPoints(originClosestPoint, overlappingPoints);
    const destinationDontOverlap = !checkOverlappingPoints(destinationClosestPoint, overlappingPoints);
    const originIndex = findPointIndex(route, originClosestPoint);
    const destinationIndex = findPointIndex(route, destinationClosestPoint);
    const alternativeDestination = findAlternativeIndex(destinationClosestPoint, overlappingPoints, route);
    const alternativeOrigin = findAlternativeIndex(originClosestPoint, overlappingPoints, route);
  
    if (originDontOverlap && destinationDontOverlap) {
        console.log("They don't overlap.");
        return { indexOrigin: originIndex, indexDestination: destinationIndex };

    } else if (originDontOverlap && !destinationDontOverlap) {
        console.log("Destination overlaps, finding alternative...");
        
        const findClosesRouteA = calculateSubsetCoordinates(route, originIndex,  destinationIndex)
        const findClosestRouteB = calculateSubsetCoordinates(route, originIndex, alternativeDestination)

        if (findClosesRouteA.length > findClosestRouteB.length){
          return {indexOrigin: originIndex, indexDestination: alternativeDestination}
        } else {
          return {indexOrigin: originIndex, indexDestination:  destinationIndex}
        }

    } else if (!originDontOverlap && destinationDontOverlap) {
      console.log("Origin overlaps, finding alternative...");
      
      const findClosesRouteA = calculateSubsetCoordinates(route, originIndex,  destinationIndex)
      const findClosestRouteB = calculateSubsetCoordinates(route, alternativeOrigin, destinationIndex)

        if (findClosesRouteA.length > findClosestRouteB.length){
          return { indexOrigin:  alternativeOrigin , indexDestination: destinationIndex};
        } else {
          return {indexOrigin: originIndex, indexDestination:  destinationIndex}
        }

  } else {
      console.log("Both origin and destination overlap with points on the route.");
  
      const findClosestRouteA = calculateSubsetCoordinates(route, originIndex, destinationIndex);
      const findClosestRouteB = calculateSubsetCoordinates(route, alternativeOrigin, destinationIndex);
      const findClosestRouteC = calculateSubsetCoordinates(route, originIndex, alternativeDestination);
      const findClosestRouteD = calculateSubsetCoordinates(route, alternativeOrigin, alternativeDestination);
  
      const lengths = {
          routeA: findClosestRouteA.length,
          routeB: findClosestRouteB.length,
          routeC: findClosestRouteC.length,
          routeD: findClosestRouteD.length
      };
  
      const shortestRouteLength = Math.min(...Object.values(lengths));
      const shortestRoute = Object.keys(lengths).find(key => lengths[key] === shortestRouteLength);
  
      if (shortestRoute === 'routeA') {
          return { indexOrigin: originIndex, indexDestination: destinationIndex };
      } else if (shortestRoute === 'routeB') {
          return { indexOrigin: alternativeOrigin, indexDestination: destinationIndex };
      } else if (shortestRoute === 'routeC') {
          return { indexOrigin: originIndex, indexDestination: alternativeDestination };
      } else {
          return { indexOrigin: alternativeOrigin, indexDestination: alternativeDestination };
      }
    }
  }

  function findPointIndex(route, point) {
    for (let i = 0; i < route.length; i++) {
        const routePoint = route[i];
        if (routePoint[0] === point.lng || routePoint[1] === point.lat) {
            return i; // Return the index if the point is found
        }
    }
    return -1; // Return -1 if the point is not found
  }

  function checkOverlappingPoints(point, overlappingPoints) {
      for (const overlappingPointObj of overlappingPoints) {
          const overlappingPoint = overlappingPointObj.coordinate;
          if (point.lng === overlappingPoint[0] && point.lat === overlappingPoint[1]) {
              return true; // It overlaps
          }
      }
      return false; // It doesn't
  }

  function findAlternativeIndex(point, overlappingPoints, route) {
    for (const overlappingPointObj of overlappingPoints) {
        const overlappingPoint = overlappingPointObj.coordinate;
        if (point.lng === overlappingPoint[0] && point.lat === overlappingPoint[1]) {
            console.log("Matching point found.");
            console.log("similarCoordinateIndex:", overlappingPointObj.similarCoordinateIndex);
            return overlappingPointObj.similarCoordinateIndex;
        }
    }
    console.log("No matching point found.");
    return -1;
  }

  function getOverlappingPointsOfCompressedCircle(route) {
    const overlappingPoints = [];
  
    for (let i = 0; i < route.length; i++) {
      const currentCoordinate = route[i];
      for (let j = i + 1; j < route.length; j++) {
        const otherCoordinate = route[j];
  
        if (currentCoordinate[0] === otherCoordinate[0] && currentCoordinate[1] === otherCoordinate[1]) {
          overlappingPoints.push({
            coordinate: currentCoordinate,
            index: i,
            similarCoordinateIndex: j,
          });
        }
      }
    }
    return overlappingPoints;
  }

  function calculateSubsetCoordinates(polylineCoordinates, indexOrigin, indexDestination) {
    const subsetCoordinates = [];
    const maxSubsetLength = Infinity;

    // Validate indices
    if (indexOrigin < 0 || indexDestination < 0 || indexOrigin >= polylineCoordinates.length || indexDestination >= polylineCoordinates.length) {
        console.error("Error: Invalid indices");
        return subsetCoordinates;
    }

    if (indexDestination >= indexOrigin) {
        subsetCoordinates.push(...polylineCoordinates.slice(indexOrigin, indexDestination + 1));
    } else {
        // Circular route handling
        subsetCoordinates.push(...polylineCoordinates.slice(indexOrigin), ...polylineCoordinates.slice(0, indexDestination + 1));
    }

    // Check if the subset is too long and there is more than one route
    if (subsetCoordinates.length > maxSubsetLength && polylineCoordinates.length > 2) {
        console.error("Error: Subset is too long");
        return [];
    }

    return subsetCoordinates;
  }

  function findExactCommonRoutes(route1, route2) { //
    const arrayify = (value) => (Array.isArray(value) ? value : [value]);

    const set1 = new Set(arrayify(route1));
    const set2 = new Set(arrayify(route2));

    const uniqueCommonRoutes = new Set([...set1].filter(route => set2.has(route)));

    return [...uniqueCommonRoutes];
  }

  function getRandomColor() {
    const colorsForRoutesRandom = [
      '#9a1115', // Crimson
      '#1975b5', // Royal Blue
      '#009999', // Teal
      '#c2c2f0', // Lavender
      '#006600', // Emerald
      '#c299f0', // Violet
      '#009933', // Jade
      '#e15d44', // Tomato
      '#993333', // Indian Red
    ];
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

});
