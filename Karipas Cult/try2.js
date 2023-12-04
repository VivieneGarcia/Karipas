document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";

  const walkingThresholdinMeters = 1000;
  const numberOfClosestRoutes = 2;

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v10",
    center: [121.05235981732966, 13.773815015863619],
    zoom: 13,
  });
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
  });
  map.addControl(geocoder, "top-left");
  map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

  var startMarker, endMarker;
  var settingStart = false;
  var settingEnd = false;

  const polylines = [];

  function displayAllRoutes(polylineData, color) {
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

  map.on("load", function () {
    const polylineInfo = [
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/alangilan.json",
        color: "#ff0000",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/balagtas.json",
        color: "#00ff00",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/capitolio.json",
        color: "#7F00FF",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/bauanbat.json",
        color: "#0000FF",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/libjo.geojson",
        color: "#0000FF",
      },
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

  map.on("click", function (e) {
    if (settingStart) {
      handleMarkerSetting(e, "start");
    } else if (settingEnd) {
      handleMarkerSetting(e, "end");
    }
  });

  function setMode(mode) {
    settingStart = mode === "start";
    settingEnd = mode === "end";
    document.getElementById("popupstart").textContent =
      "Pin on the map to set " + (settingStart ? "Origin" : "Destination");
  }

  document.getElementById("setStart").addEventListener("click", function () {
    setMode("start");
  });

  document.getElementById("setEnd").addEventListener("click", function () {
    setMode("end");
  });

  function handleMarkerSetting(e, type) {
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
    console.log("pincord:", lngLat);
    showAddress(lngLat, type);
  }

  async function showAddress(lngLat, type) {
    try {
      const pinCoordinates = [lngLat.lng, lngLat.lat];
      const result = await getGeocodeResult(pinCoordinates);

      if (result) {
        const pinAddress = result.place_name;
        const userPin = {
          lat: result.geometry.coordinates[1],
          lng: result.geometry.coordinates[0],
        };

        document.getElementById(`popAddress-${type}`).style.display ="inline-block";
        document.getElementById(`addressText-${type}`).textContent = pinAddress;
        console.log(`PIN CONVERT TO MAPBOX GEOCODE for ${type}:`, userPin);
      } else {
        console.error(`Invalid geocoding result for ${type}`);
      }
    } catch (error) {
      console.error(`Error geocoding ${type}:`, error);
    }
  }

  async function getGeocodeResult(pinCoordinates) {
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

  function haversineDistance(coord1, coord2) {
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
  
  async function findClosestPointOnRoutes(coordinates) {
    const polylineURLs = [
      "http://localhost/Karipas%20Cult/RoutesPoly/alangilan.geojson",
      "http://localhost/Karipas%20Cult/RoutesPoly/balagtas.geojson",
      // Add other URLs as needed
    ];
  
    try {
      const responses = await Promise.all(polylineURLs.map((url) => fetch(url)));
      const polylineDataArray = await Promise.all(responses.map((response) => response.json()));
  
      let closestPointsArray = [];
  
      polylineDataArray.forEach((data, index) => {
        if (!data || !data.features || data.features.length === 0) {
          console.error(`Invalid GeoJSON data for ${polylineURLs[index]}:`, data);
          return;
        }
  
        data.features.forEach((feature) => {
          if (!feature.geometry || !feature.geometry.coordinates) {
            console.error(`Invalid geometry in GeoJSON data for ${polylineURLs[index]}:`, feature.geometry);
            return;
          }
  
          const polylineCoordinates = feature.geometry.coordinates;
          const currentClosestPoint = findClosestPointOnLine(coordinates, polylineCoordinates);
  
          if (currentClosestPoint) {
            currentClosestPoint.route = polylineURLs[index];
            closestPointsArray.push(currentClosestPoint);
            console.log(`Valid closest point found for route ${index + 1}:`, currentClosestPoint);
          } else {
            console.log(`No closest point found for route ${index + 1}.`);
          }
        });
      });
  
      if (closestPointsArray.length === 0) {
        console.error("No valid closest points found.");
        return null;
      }
  
      closestPointsArray.sort((a, b) => a.distance - b.distance);
  
      const top3ClosestPoints = closestPointsArray.slice(0, numberOfClosestRoutes);
      console.log("CLOSE ROUTES: ", top3ClosestPoints);
      return top3ClosestPoints;
    } catch (error) {
      console.error("Error loading GeoJSON data:", error);
      return null;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";

  const walkingThresholdinMeters = 1000;
  const numberOfClosestRoutes = 2;

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v10",
    center: [121.05235981732966, 13.773815015863619],
    zoom: 13,
  });
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
  });
  map.addControl(geocoder, "top-left");
  map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

  var startMarker, endMarker;
  var settingStart = false;
  var settingEnd = false;

  const polylines = [];

  function displayAllRoutes(polylineData, color) {
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

  map.on("load", function () {
    const polylineInfo = [
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/alangilan.json",
        color: "#ff0000",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/balagtas.json",
        color: "#00ff00",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/capitolio.json",
        color: "#7F00FF",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/bauanbat.json",
        color: "#0000FF",
      },
      {
        url: "http://localhost/Karipas%20Cult/RoutesPoly/libjo.geojson",
        color: "#0000FF",
      },
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

  map.on("click", function (e) {
    if (settingStart) {
      handleMarkerSetting(e, "start");
    } else if (settingEnd) {
      handleMarkerSetting(e, "end");
    }
  });

  function setMode(mode) {
    settingStart = mode === "start";
    settingEnd = mode === "end";
    document.getElementById("popupstart").textContent =
      "Pin on the map to set " + (settingStart ? "Origin" : "Destination");
  }

  document.getElementById("setStart").addEventListener("click", function () {
    setMode("start");
  });

  document.getElementById("setEnd").addEventListener("click", function () {
    setMode("end");
  });

  function handleMarkerSetting(e, type) {
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
    console.log("pincord:", lngLat);
    showAddress(lngLat, type);
  }

  async function showAddress(lngLat, type) {
    try {
      const pinCoordinates = [lngLat.lng, lngLat.lat];
      const result = await getGeocodeResult(pinCoordinates);

      if (result) {
        const pinAddress = result.place_name;
        const userPin = {
          lat: result.geometry.coordinates[1],
          lng: result.geometry.coordinates[0],
        };

        document.getElementById(`popAddress-${type}`).style.display ="inline-block";
        document.getElementById(`addressText-${type}`).textContent = pinAddress;
        console.log(`PIN CONVERT TO MAPBOX GEOCODE for ${type}:`, userPin);
      } else {
        console.error(`Invalid geocoding result for ${type}`);
      }
    } catch (error) {
      console.error(`Error geocoding ${type}:`, error);
    }
  }

  async function getGeocodeResult(pinCoordinates) {
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

  function haversineDistance(coord1, coord2) {
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
  
  async function findClosestPointOnRoutes(coordinates) {
    const polylineURLs = [
      "http://localhost/Karipas%20Cult/RoutesPoly/alangilan.geojson",
      "http://localhost/Karipas%20Cult/RoutesPoly/balagtas.geojson",
      // Add other URLs as needed
    ];
  
    try {
      const responses = await Promise.all(polylineURLs.map((url) => fetch(url)));
      const polylineDataArray = await Promise.all(responses.map((response) => response.json()));
  
      let closestPointsArray = [];
  
      polylineDataArray.forEach((data, index) => {
        if (!data || !data.features || data.features.length === 0) {
          console.error(`Invalid GeoJSON data for ${polylineURLs[index]}:`, data);
          return;
        }
  
        data.features.forEach((feature) => {
          if (!feature.geometry || !feature.geometry.coordinates) {
            console.error(`Invalid geometry in GeoJSON data for ${polylineURLs[index]}:`, feature.geometry);
            return;
          }
  
          const polylineCoordinates = feature.geometry.coordinates;
          const currentClosestPoint = findClosestPointOnLine(coordinates, polylineCoordinates);
  
          if (currentClosestPoint) {
            currentClosestPoint.route = polylineURLs[index];
            closestPointsArray.push(currentClosestPoint);
            console.log(`Valid closest point found for route ${index + 1}:`, currentClosestPoint);
          } else {
            console.log(`No closest point found for route ${index + 1}.`);
          }
        });
      });
  
      if (closestPointsArray.length === 0) {
        console.error("No valid closest points found.");
        return null;
      }
  
      closestPointsArray.sort((a, b) => a.distance - b.distance);
  
      const top3ClosestPoints = closestPointsArray.slice(0, numberOfClosestRoutes);
      console.log("CLOSE ROUTES: ", top3ClosestPoints);
      return top3ClosestPoints;
    } catch (error) {
      console.error("Error loading GeoJSON data:", error);
      return null;
    }
  }

  function findClosestPointOnLine(point, line) {
  if (!point || (!point.lat && point[1] === undefined) || (!point.lng && point[0] === undefined) || !Array.isArray(line) || line.length === 0) {
    console.error("Invalid coordinate or line array for findClosestPointOnLine:", point, line);
    return null;
  }

  console.log(point,line)

  const closestPoint = line.reduce(
    (acc, cur) => {
      const lat = Array.isArray(cur) ? cur[1] : cur.lat;
      const lng = Array.isArray(cur) ? cur[0] : cur.lng;

      const distance = haversineDistance(point, { lat, lng });

      if (distance < walkingThresholdinMeters) {
        const currentPoint = { lat, lng, distance };
        return acc.distance < distance ? acc : currentPoint;
      }

      return acc;
    },
    { lat: line[0][1], lng: line[0][0], distance: Infinity }
  );

  console.log('closestPoint:', closestPoint);

  return closestPoint.distance === Infinity ? null : closestPoint;
}
  

  const fetchWalkingLines = async (startCoordinates, endCoordinates) => {
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

  async function drawWalkingLines(startCoordinates, endCoordinates, marker) {
    try {
      const { walkingLines, distances } = await fetchWalkingLines(
        startCoordinates,
        endCoordinates
      );

      walkingLines.forEach((line, index) => {
        console.log("Current walking line:", line);
        const sourceId = `${marker}-walking-line-source-${index}-${Math.random()}`;
        const layerId = `${marker}-walking-line-layer-${index}-${Math.random()}`;

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
            "line-color":
              marker === "start"
                ? "#469904"
                : marker === "end"
                ? "#0000FF"
                : "#0000FF",
            "line-width": 5,
            "line-dasharray": [1, 2],
          },
        });

        console.log(
          `Duration for route ${index + 1}: ${
            distances[index].duration
          } minutes`
        );
        console.log(
          `Distance for route ${index + 1}: ${distances[index].distance} meters`
        );
      });
    } catch (error) {
      console.error("Error drawing walking lines:", error);
    }
  }

  async function compareOriginDestinationRoutes(origin, destination) {
    const originClosestPoints = await findClosestPointOnRoutes(origin);
    const destinationClosestPoints = await findClosestPointOnRoutes(destination);

    if (!originClosestPoints || !destinationClosestPoints) {
      console.error("Error finding closest points.");
      return;
    }

    for (const endClosestPoint of destinationClosestPoints) {
      await drawWalkingLines(destination, endClosestPoint, "end");
    }

    for (const startClosestPoint of originClosestPoints) {
      await drawWalkingLines(origin, startClosestPoint, "start");
    }

    const originRoutes = originClosestPoints.map((point) => point.route);
    const destinationRoutes = destinationClosestPoints.map(
      (point) => point.route
    );

    const commonRoutes = findCommonRoutes(originRoutes, destinationRoutes);
    const commonRoutes2 = findExactCommonRoutes(
      originRoutes,
      destinationRoutes
    );

    if (commonRoutes.length > 0) {
      console.log(
        `Origin and destination share common routes: ${commonRoutes.join(", ")}`
      );

      // Draw walking lines for common routes
      for (const commonRoute of commonRoutes2) {
        await drawJeepCommonRoute(
          commonRoute,
          originClosestPoints,
          destinationClosestPoints
        );
      }
    } else {
      console.log("Origin and destination do not have common routes.");
    }
  }

  async function drawJeepCommonRoute(route,originClosestPoints,destinationClosestPoints) {
    try {
      const response = await fetch(route);
      const data = await response.json();
      console.log("route", route);

      if (!data || !data.features || data.features.length === 0) {
        console.error(`Invalid polyline data for ${route}:`, data);
        return;
      }

      const firstFeature = data.features[0];

      if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
        console.error(
          `Invalid geometry in polyline data for ${route}:`,
          firstFeature.geometry
        );
        return;
      }

      const polylineCoordinates = firstFeature.geometry.coordinates;
      for (let i = 0; i < originClosestPoints.length; i++) {
        const originPoint = originClosestPoints[i];
        const destinationPoint = destinationClosestPoints[i];
        console.log("ORIGIN: ", originPoint);
        console.log("DESTINATION: ", destinationPoint);
        console.log("WHATKJBFSDKFS: ", polylineCoordinates);

        // Find the indices of the closest points on the route
        const indexOrigin = findClosestPointIndex(polylineCoordinates,originPoint);

        const indexDestination = findClosestPointIndex(polylineCoordinates,destinationPoint);

        const subsetCoordinates = polylineCoordinates.slice(indexOrigin,indexDestination + 1);

        console.log("Route Geometry:", indexOrigin, indexDestination);

        if (indexOrigin === null || indexDestination === null) {
          console.error(
            `Error finding closest points on ${route} for origin or destination.`
          );
          return;
        }

        // Draw a line connecting the closest points of origin and destination
        const sourceId2 = "used-route-source-" + Date.now(); // Ensure a unique source ID
        const layerId2 = "used-route-layer-" + Date.now(); // Ensure a unique layer ID

        if (map.getSource(sourceId2)) {
          map.removeSource(sourceId2);
        }

        if (map.getLayer(layerId2)) {
          map.removeLayer(layerId2);
        }

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
            "line-color": '#dc851f',
            "line-width": 7,
            "line-opacity": 0.45,
          },
        });

        console.log(
          `Drawn line connecting closest points for common route: ${route}`
        );
      }
    } catch (error) {
      console.error(
        `Error drawing line connecting closest points for common route ${route}:`,
        error
      );
    }
  }

  function findClosestPointIndex(polylineCoordinates, point) {
    let closestIndex = 0;
    let closestDistance = Number.MAX_VALUE;
    console.log("point", point);

    for (let i = 0; i < polylineCoordinates.length; i++) {
      const distance = calculateDistance(polylineCoordinates[i], point);

      if (distance < closestDistance) {
        closestIndex = i;
        closestDistance = distance;
      }
    }
    return closestIndex;
  }

  function calculateDistance(coord1, coord2) {
    // Sample implementation:
    const lat1 = Array.isArray(coord1) ? coord1[1] : coord1[0];
    const lng1 = Array.isArray(coord1) ? coord1[0] : coord1[1];
    const lat2 = Array.isArray(coord2) ? coord2.lat : coord2.lat;
    const lng2 = Array.isArray(coord2) ? coord2.lng : coord2.lng;
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

  function findExactCommonRoutes(route1, route2) {
    const arrayify = (value) => (Array.isArray(value) ? value : [value]);

    const set1 = new Set(arrayify(route1));
    const set2 = new Set(arrayify(route2));

    const commonRoutes = [...set1].filter((route) => set2.has(route));

    return commonRoutes;
  }

  function findCommonRoutes(route1, route2) {
    const arrayify = (value) => (Array.isArray(value) ? value : [value]);

    const extractRouteName = (url) => url.substring(url.lastIndexOf("/") + 1);

    const set1 = new Set(arrayify(route1).map(extractRouteName));
    const set2 = new Set(arrayify(route2).map(extractRouteName));

    const commonRoutes = [...set1].filter((route) => set2.has(route));

    return commonRoutes;
  }

  document.getElementById("final").addEventListener("click", async function () {
    try {
      document.getElementById("popupstart").style.display = "none";
      if (!startMarker || !endMarker) {
        alert("Pin both origin and destination before finalizing.");
        return;
      }
      const startPinCoordinates = [
        startMarker.getLngLat().lng,
        startMarker.getLngLat().lat,
      ];
      const endPinCoordinates = [
        endMarker.getLngLat().lng,
        endMarker.getLngLat().lat,
      ];
      const startResult = await getGeocodeResult(startPinCoordinates);
      const startuserPin = {
        lat: startResult.geometry.coordinates[1],
        lng: startResult.geometry.coordinates[0],
      };
      const endResult = await getGeocodeResult(endPinCoordinates);
      const enduserPin = {
        lat: endResult.geometry.coordinates[1],
        lng: endResult.geometry.coordinates[0],
      };
      await compareOriginDestinationRoutes(startuserPin, enduserPin);
      const startGeocode = startMarker.getLngLat();
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
        document.getElementById("saveGeocodeForm").submit();
      }
    } catch (error) {
      console.error("Error during final click:", error);
    }
  });
});

  

  const fetchWalkingLines = async (startCoordinates, endCoordinates) => {
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

  async function drawWalkingLines(startCoordinates, endCoordinates, marker) {
    try {
      const { walkingLines, distances } = await fetchWalkingLines(
        startCoordinates,
        endCoordinates
      );

      walkingLines.forEach((line, index) => {
        console.log("Current walking line:", line);
        const sourceId = `${marker}-walking-line-source-${index}-${Math.random()}`;
        const layerId = `${marker}-walking-line-layer-${index}-${Math.random()}`;

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
            "line-color":
              marker === "start"
                ? "#469904"
                : marker === "end"
                ? "#0000FF"
                : "#0000FF",
            "line-width": 5,
            "line-dasharray": [1, 2],
          },
        });

        console.log(
          `Duration for route ${index + 1}: ${
            distances[index].duration
          } minutes`
        );
        console.log(
          `Distance for route ${index + 1}: ${distances[index].distance} meters`
        );
      });
    } catch (error) {
      console.error("Error drawing walking lines:", error);
    }
  }

  async function compareOriginDestinationRoutes(origin, destination) {
    const originClosestPoints = await findClosestPointOnRoutes(origin);
    const destinationClosestPoints = await findClosestPointOnRoutes(destination);

    if (!originClosestPoints || !destinationClosestPoints) {
      console.error("Error finding closest points.");
      return;
    }

    for (const endClosestPoint of destinationClosestPoints) {
      await drawWalkingLines(destination, endClosestPoint, "end");
    }

    for (const startClosestPoint of originClosestPoints) {
      await drawWalkingLines(origin, startClosestPoint, "start");
    }

    const originRoutes = originClosestPoints.map((point) => point.route);
    const destinationRoutes = destinationClosestPoints.map(
      (point) => point.route
    );

    const commonRoutes = findCommonRoutes(originRoutes, destinationRoutes);
    const commonRoutes2 = findExactCommonRoutes(
      originRoutes,
      destinationRoutes
    );

    if (commonRoutes.length > 0) {
      console.log(
        `Origin and destination share common routes: ${commonRoutes.join(", ")}`
      );

      // Draw walking lines for common routes
      for (const commonRoute of commonRoutes2) {
        await drawJeepCommonRoute(
          commonRoute,
          originClosestPoints,
          destinationClosestPoints
        );
      }
    } else {
      console.log("Origin and destination do not have common routes.");
    }
  }

  async function drawJeepCommonRoute(route,originClosestPoints,destinationClosestPoints) {
    try {
      const response = await fetch(route);
      const data = await response.json();
      console.log("route", route);

      if (!data || !data.features || data.features.length === 0) {
        console.error(`Invalid polyline data for ${route}:`, data);
        return;
      }

      const firstFeature = data.features[0];

      if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
        console.error(
          `Invalid geometry in polyline data for ${route}:`,
          firstFeature.geometry
        );
        return;
      }

      const polylineCoordinates = firstFeature.geometry.coordinates;
      for (let i = 0; i < originClosestPoints.length; i++) {
        const originPoint = originClosestPoints[i];
        const destinationPoint = destinationClosestPoints[i];
        console.log("ORIGIN: ", originPoint);
        console.log("DESTINATION: ", destinationPoint);
        console.log("WHATKJBFSDKFS: ", polylineCoordinates);

        // Find the indices of the closest points on the route
        const indexOrigin = findClosestPointIndex(polylineCoordinates,originPoint);

        const indexDestination = findClosestPointIndex(polylineCoordinates,destinationPoint);

        const subsetCoordinates = polylineCoordinates.slice(indexOrigin,indexDestination + 1);

        console.log("Route Geometry:", indexOrigin, indexDestination);

        if (indexOrigin === null || indexDestination === null) {
          console.error(
            `Error finding closest points on ${route} for origin or destination.`
          );
          return;
        }

        // Draw a line connecting the closest points of origin and destination
        const sourceId2 = "used-route-source-" + Date.now(); // Ensure a unique source ID
        const layerId2 = "used-route-layer-" + Date.now(); // Ensure a unique layer ID

        if (map.getSource(sourceId2)) {
          map.removeSource(sourceId2);
        }

        if (map.getLayer(layerId2)) {
          map.removeLayer(layerId2);
        }

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
            "line-color": '#dc851f',
            "line-width": 7,
            "line-opacity": 0.45,
          },
        });

        console.log(
          `Drawn line connecting closest points for common route: ${route}`
        );
      }
    } catch (error) {
      console.error(
        `Error drawing line connecting closest points for common route ${route}:`,
        error
      );
    }
  }

  function findClosestPointIndex(polylineCoordinates, point) {
    let closestIndex = 0;
    let closestDistance = Number.MAX_VALUE;
    console.log("point", point);

    for (let i = 0; i < polylineCoordinates.length; i++) {
      const distance = calculateDistance(polylineCoordinates[i], point);

      if (distance < closestDistance) {
        closestIndex = i;
        closestDistance = distance;
      }
    }
    return closestIndex;
  }

  function calculateDistance(coord1, coord2) {
    // Sample implementation:
    const lat1 = Array.isArray(coord1) ? coord1[1] : coord1[0];
    const lng1 = Array.isArray(coord1) ? coord1[0] : coord1[1];
    const lat2 = Array.isArray(coord2) ? coord2.lat : coord2.lat;
    const lng2 = Array.isArray(coord2) ? coord2.lng : coord2.lng;
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

  function findExactCommonRoutes(route1, route2) {
    const arrayify = (value) => (Array.isArray(value) ? value : [value]);

    const set1 = new Set(arrayify(route1));
    const set2 = new Set(arrayify(route2));

    const commonRoutes = [...set1].filter((route) => set2.has(route));

    return commonRoutes;
  }

  function findCommonRoutes(route1, route2) {
    const arrayify = (value) => (Array.isArray(value) ? value : [value]);

    const extractRouteName = (url) => url.substring(url.lastIndexOf("/") + 1);

    const set1 = new Set(arrayify(route1).map(extractRouteName));
    const set2 = new Set(arrayify(route2).map(extractRouteName));

    const commonRoutes = [...set1].filter((route) => set2.has(route));

    return commonRoutes;
  }

  document.getElementById("final").addEventListener("click", async function () {
    try {
      document.getElementById("popupstart").style.display = "none";
      if (!startMarker || !endMarker) {
        alert("Pin both origin and destination before finalizing.");
        return;
      }
      const startPinCoordinates = [
        startMarker.getLngLat().lng,
        startMarker.getLngLat().lat,
      ];
      const endPinCoordinates = [
        endMarker.getLngLat().lng,
        endMarker.getLngLat().lat,
      ];
      const startResult = await getGeocodeResult(startPinCoordinates);
      const startuserPin = {
        lat: startResult.geometry.coordinates[1],
        lng: startResult.geometry.coordinates[0],
      };
      const endResult = await getGeocodeResult(endPinCoordinates);
      const enduserPin = {
        lat: endResult.geometry.coordinates[1],
        lng: endResult.geometry.coordinates[0],
      };
      await compareOriginDestinationRoutes(startuserPin, enduserPin);
      const startGeocode = startMarker.getLngLat();
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
        document.getElementById("saveGeocodeForm").submit();
      }
    } catch (error) {
      console.error("Error during final click:", error);
    }
  });
});
