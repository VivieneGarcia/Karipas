document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";

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

  function addPolyline(polylineData, color) {
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
          addPolyline(polylineData, info.color);
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
    geocodePin(lngLat, type);
  }

  async function geocodePin(lngLat, type) {
    try {
      const pinCoordinates = [lngLat.lng, lngLat.lat];

      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${pinCoordinates.join(
        ","
      )}.json?access_token=${mapboxgl.accessToken}`;

      const response = await fetch(geocodingUrl);
      const data = await response.json();

      // Assuming the first result is the most relevant
      const result = data.features[0];

      if (
        result &&
        result.place_name &&
        result.geometry &&
        result.geometry.coordinates
      ) {
        const pinAddress = result.place_name;
        const userPin = {
          lat: result.geometry.coordinates[1],
          lng: result.geometry.coordinates[0],
        };

        console.log(`PIN NAME ADDRESS for ${type}: ${pinAddress}`);
        document.getElementById(`popAddress-${type}`).style.display =
          "inline-block";
        document.getElementById(`addressText-${type}`).textContent = pinAddress;
        console.log(`PIN CONVERT TO MAPBOX GEOCODE for ${type}:`, userPin);

        // Additional logging to inspect latitude values
        console.log("User Pin Latitude:", userPin.lat);
        console.log("User Pin Longitude:", userPin.lng);

        // Find the closest point on the jeepney routes
        const closestPoints = await findClosestPoint(pinCoordinates);

        // Log the values before calling fetchWalkingLines
        console.log("Start:", userPin);
        console.log("Closest Point:", closestPoints);

        // Call the function to draw walking lines
        drawWalkingLines(userPin, closestPoints, type);
      } else {
        console.error(`Invalid geocoding result for ${type}:`, result);
      }
    } catch (error) {
      console.error(`Error geocoding ${type}:`, error);
    }
  }

  async function fetchWalkingLines(startCoordinates, endCoordinates) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${startCoordinates.lng},${startCoordinates.lat};${endCoordinates.lng},${endCoordinates.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching walking lines: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Walking Lines API Response:", data);

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
  }

  async function drawWalkingLines(startCoordinates, endCoordinates, type) {
    try {
      // Fetch walking lines and distances
      const { walkingLines, distances } = await fetchWalkingLines(
        startCoordinates,
        endCoordinates
      );

      walkingLines.forEach((line, index) => {
        const sourceId = `${type}-walking-line-source-${index}`;
        const layerId = `${type}-walking-line-layer-${index}`;

        // Remove existing source and layer if they exist
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }

        // Display the walking line on the map
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
              type === "start"
                ? "#469904"
                : type === "end"
                ? "#469904"
                : "#0000FF",
            "line-width": 5,
            "line-dasharray": [1, 2],
          },
        });

        // Display the duration and distance in the console
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

  async function findClosestPoint(coordinates) {
    const polylineURLs = [
      "http://localhost/Karipas%20Cult/RoutesPoly/alangilan.json",
      "http://localhost/Karipas%20Cult/RoutesPoly/balagtas.json",
      "http://localhost/Karipas%20Cult/RoutesPoly/bauanbat.json",
      "http://localhost/Karipas%20Cult/RoutesPoly/capitolio.json",
    ];

    try {

      const responses = await Promise.all(
        polylineURLs.map((url) => fetch(url))
      );
      const polylineDataArray = await Promise.all(
        responses.map((response) => response.json())
      );

      let closestPoint = null;

      polylineDataArray.forEach((data, index) => {
        console.log(`Polyline data for ${polylineURLs[index]}:`, data);

        if (!data || !data.features || data.features.length === 0) {
          console.error(
            `Invalid polyline data for ${polylineURLs[index]}:`,
            data
          );
          return;
        }

        const firstFeature = data.features[0];

        if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
          console.error(
            `Invalid geometry in polyline data for ${polylineURLs[index]}:`,
            firstFeature.geometry
          );
          return;
        }

        const polylineCoordinates = firstFeature.geometry.coordinates;

        // Find the closest point for the current route
        const currentClosestPoint = findClosestPointOnLine(
          coordinates,
          polylineCoordinates
        );

        // Update closestPoint only if it's null or the current point is closer
        if (
          !closestPoint ||
          currentClosestPoint.distance < closestPoint.distance
        ) {
          closestPoint = {
            ...currentClosestPoint,
            route: polylineURLs[index], // Include the route information
          };
        }

        console.log(
          `Closest point for ${polylineURLs[index]}:`,
          currentClosestPoint
        );
      });

      if (!closestPoint) {
        console.error("No valid closest points found.");
        return null;
      }
      document.getElementById("closestRoute").textContent = closestPoint.route;
      console.log(`Closest point overall:`, closestPoint);

      return closestPoint;
    } catch (error) {
      console.error("Error loading polyline data:", error);
      return null;
    }
  }

  function findClosestPointOnLine(point, line) {
    // Ensure point is a valid coordinate
    if (
      !point ||
      (!point.lat && point[1] === undefined) ||
      (!point.lng && point[0] === undefined)
    ) {
      console.error("Invalid coordinate for findClosestPointOnLine:", point);
      return null;
    }

    // Ensure line is a valid array with coordinates
    if (!line || !Array.isArray(line) || line.length === 0) {
      console.error("Invalid line array for findClosestPointOnLine:", line);
      return null;
    }

    // Extract lat and lng from the point if it's an array
    const pointLat = point.lat || point[1];
    const pointLng = point.lng || point[0];

    // Find the closest point on the line
    return line.reduce(
      (acc, cur) => {
        const distance = turf.distance(
          turf.point([pointLng, pointLat]),
          turf.point(cur)
        );
        return distance < acc.distance
          ? { lat: cur[1], lng: cur[0], distance }
          : acc;
      },
      {
        lat: line[0][1],
        lng: line[0][0],
        distance: turf.distance(
          turf.point([pointLng, pointLat]),
          turf.point(line[0])
        ),
      }
    );
  }

  async function drawRouteFromClosestToOriginToDestination(
    closestToOrigin,
    closestToDestination
  ) {
    try {
      // Check if the closest points are on the same route
      if (closestToOrigin.route !== closestToDestination.route) {
        console.log("The closest points are on different routes.");
        return;
      }

      // Fetch the polyline data for the route
      const response = await fetch(closestToOrigin.route);

      const data = await response.json();
      console.log("route", closestToOrigin.route);

      if (!data || !data.features || data.features.length === 0) {
        console.error(
          `Invalid polyline data for ${closestToOrigin.route}:`,
          data
        );
        return;
      }

      const firstFeature = data.features[0];

      if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
        console.error(
          `Invalid geometry in polyline data for ${closestToOrigin.route}:`,
          firstFeature.geometry
        );
        return;
      }

      const polylineCoordinates = firstFeature.geometry.coordinates;
      console.log("WHATKJBFSDKFS: ", polylineCoordinates);
      console.log("originll: ", closestToOrigin);
      console.log("originll: ", closestToDestination);
      // Find the index of the closest point to the origin
      const indexOrigin = findClosestPointIndex(
        polylineCoordinates,
        closestToOrigin
      );

      // Find the index of the closest point to the destination
      const indexDestination = findClosestPointIndex(
        polylineCoordinates,
        closestToDestination
      );

      // Create a subset of coordinates between the origin and destination
      const subsetCoordinates = polylineCoordinates.slice(
        indexOrigin,
        indexDestination + 1
      );
      console.log("Route Geometry:", indexOrigin, indexDestination);

      // Draw the line from the closest point to the origin to the closest point to the destination
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
          "line-color": "#0072c8",
          "line-width": 7,
        },
      });

      console.log("Layer added successfully");

      // Get directions using Mapbox Directions API
      const directions = await getDirections(subsetCoordinates);

      if (directions) {
        const distance = directions.distance / 1000; // Convert meters to kilometers
        const duration = directions.duration / 60; // Convert seconds to minutes

        console.log(`Drawn the route from ${closestToOrigin.route}`);
        console.log(`Distance: ${distance.toFixed(2)} km`);
        console.log(`Duration: ${duration.toFixed(2)} minutes`);
      } else {
        console.error("Error getting directions.");
      }
    } catch (error) {
      console.error("Error drawing route:", error);
    }
  }

  const DIRECTIONS_API_ENDPOINT =
    "https://api.mapbox.com/directions/v5/mapbox/driving/";

  async function getDirections(coordinates) {
    const maxCoordinatesPerRequest = 25;
    const segments = [];
    let start = 0;

    while (start < coordinates.length) {
      const end = Math.min(start + maxCoordinatesPerRequest,coordinates.length);
      const segment = coordinates.slice(start, end);
      segments.push(segment);
      start = end;
    }

    let totalDistance = 0;
    let totalDuration = 0;

    for (const segment of segments) {
      const waypoints = segment
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join(";");
      const response = await fetch(
        `${DIRECTIONS_API_ENDPOINT}${waypoints}?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (!data || !data.routes || data.routes.length === 0) {
        console.error("Error fetching directions:", data);
        return null;
      }

      const route = data.routes[0];
      totalDistance += route.distance;
      totalDuration += route.duration;
    }

    const combinedRoute = {
      distance: totalDistance,
      duration: totalDuration,
    };

    console.log("Combined Route:", combinedRoute);
    return combinedRoute;
  }

  function findClosestPointIndex(polylineCoordinates, point) {
    let closestIndex = null;
    let closestDistance = Number.MAX_VALUE;
  
    for (let i = 0; i < polylineCoordinates.length; i++) {
      const currentPoint = polylineCoordinates[i];
      const distance = calculateDistance(currentPoint, point);
  
      if (distance < closestDistance) {
        closestIndex = i;
        closestDistance = distance;
      }
    }
  
    if (closestIndex === null) {
      console.error("No closest point found for given point.");
      return null;
    }
  
    return closestIndex;
  }
  
  

  function calculateDistance(coord1, coord2) {
    // Sample implementation:
    const lat1 = Array.isArray(coord1) ? coord1[1] : coord1.lat;
    const lng1 = Array.isArray(coord1) ? coord1[0] : coord1.lng;
    const lat2 = Array.isArray(coord2) ? coord2[1] : coord2.lat;
    const lng2 = Array.isArray(coord2) ? coord2[0] : coord2.lng;
    console.log(lat1, lng1, lat2, lng2);

    const R = 6371; // Earth's radius in km
    const dLat = degToRad(lat2 - lat1);
    const dLng = degToRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(degToRad(lat1)) *
        Math.cos(degToRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }

  function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

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

  document.getElementById("final").addEventListener("click", async function () {
    try {
      document.getElementById("popupstart").style.display = "none";
      if (!startMarker || !endMarker) {
        alert("Pin both origin and destination before finalizing.");
        return;
      }

      const startClosestPoint = await findClosestPoint(startMarker.getLngLat());
      const endClosestPoint = await findClosestPoint(endMarker.getLngLat());

      await drawRouteFromClosestToOriginToDestination(
        startClosestPoint,
        endClosestPoint
      );

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
      // Handle the error as needed, e.g., display an alert or log it
    }
  });
});
