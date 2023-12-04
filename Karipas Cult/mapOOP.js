class MapManager {
  constructor() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw';

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [121.05235981732966, 13.773815015863619],
      zoom: 13,
    });

    this.geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });

    this.map.addControl(this.geocoder, 'top-left');
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    this.startMarker = null;
    this.endMarker = null;
    this.settingStart = false;
    this.settingEnd = false;
    this.polylines = [];

    document.getElementById('setStart').addEventListener('click', () => this.setMode('start'));
    document.getElementById('setEnd').addEventListener('click', () => this.setMode('end'));
    document.getElementById('final').addEventListener('click', () => this.finalize());

    this.initializeMapEvents();
    this.loadPolylines();
  }

  setMode(mode) {
    this.settingStart = mode === 'start';
    this.settingEnd = mode === 'end';
    document.getElementById('popupstart').textContent = 'Pin on the map to set ' + (this.settingStart ? 'Origin' : 'Destination');
  }

  initializeMapEvents() {
    this.map.on('click', (e) => {
      if (this.settingStart) {
        this.handleMarkerSetting(e, 'start');
      } else if (this.settingEnd) {
        this.handleMarkerSetting(e, 'end');
      }
    });
  }

  loadPolylines() {
    const polylineInfo = [
      { url: 'http://localhost/Karipas%20Cult/RoutesPoly/alangilan.json', color: '#ff0000' },
      { url: 'http://localhost/Karipas%20Cult/RoutesPoly/balagtas.json', color: '#00ff00' },
      { url: 'http://localhost/Karipas%20Cult/RoutesPoly/capitolio.json', color: '#7F00FF' },
      { url: 'http://localhost/Karipas%20Cult/RoutesPoly/bauanbat.json', color: '#0000FF' },
      { url: 'http://localhost/Karipas%20Cult/RoutesPoly/libjo.geojson', color: '#0000FF' },
    ];

    polylineInfo.forEach((info) => {
      this.fetchPolyline(info.url, info.color);
    });
  }

  async fetchPolyline(url, color) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      const polylineData = {
        id: `custom-polyline-${this.polylines.length + 1}`,
        data: data,
      };

      this.addPolyline(polylineData, color);
      this.polylines.push(polylineData);
    } catch (error) {
      console.error(`Error loading polyline: ${url}`, error);
    }
  }

  addPolyline(polylineData, color) {
    this.map.addSource(polylineData.id, {
      type: 'geojson',
      data: polylineData.data,
    });

    this.map.addLayer({
      id: polylineData.id,
      type: 'line',
      source: polylineData.id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': color,
        'line-width': 8,
        'line-opacity': 0.10,
      },
    });
  }

  handleMarkerSetting(e, type) {
    const marker = type === 'start' ? this.startMarker : this.endMarker;

    if (marker) {
      marker.remove();
    }

    const lngLat = e.lngLat;
    const newMarker = new mapboxgl.Marker().setLngLat(lngLat).addTo(this.map);

    if (type === 'start') {
      this.startMarker = newMarker;
    } else {
      this.endMarker = newMarker;
    }

    this.geocodePin(lngLat, type);
  }

  async geocodePin(lngLat, type) {
    try {
      const pinCoordinates = [lngLat.lng, lngLat.lat];
  
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${pinCoordinates.join(
        ','
      )}.json?access_token=${mapboxgl.accessToken}`;
  
      const response = await fetch(geocodingUrl);
      const data = await response.json();
  
      // Assuming the first result is the most relevant
      const result = data.features[0];
  
      if (result && result.place_name && result.geometry && result.geometry.coordinates) {
        const pinAddress = result.place_name;
        const userPin = {
          lat: result.geometry.coordinates[1],
          lng: result.geometry.coordinates[0],
        };
  
        console.log(`PIN NAME ADDRESS for ${type}: ${pinAddress}`);
        document.getElementById(`popAddress-${type}`).style.display = 'inline-block';
        document.getElementById(`addressText-${type}`).textContent = pinAddress;
        console.log(`PIN CONVERT TO MAPBOX GEOCODE for ${type}:`, userPin);
  
        // Additional logging to inspect latitude values
        console.log('User Pin Latitude:', userPin.lat);
        console.log('User Pin Longitude:', userPin.lng);
  
        // Find the closest point on the jeepney routes
        const closestPoints = await this.findClosestPoint(pinCoordinates);
  
        // Log the values before calling fetchWalkingLines
        console.log('Start:', userPin);
        console.log('Closest Point:', closestPoints);
  
        // Call the function to draw walking lines
        this.drawWalkingLines(userPin, closestPoints, type);
  
        // Fetch polyline data for the top 3 nearest routes
        const topRoutes = [closestPoints.route, /* next two routes */];
        for (const route of topRoutes) {
          const response = await fetch(route);
          const data = await response.json();
  
          if (!data || !data.features || data.features.length === 0) {
            console.error(`Invalid polyline data for ${route}:`, data);
            continue;
          }
  
          const firstFeature = data.features[0];
  
          if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
            console.error(`Invalid geometry in polyline data for ${route}:`, firstFeature.geometry);
            continue;
          }
  
          const polylineCoordinates = firstFeature.geometry.coordinates;
  
          // Find the top 3 nearest points on the route
          for (let i = 0; i < 3; i++) {
            const nearestPoint = this.findClosestPointOnLine(userPin.lat, userPin.lng, polylineCoordinates);

  
            // Draw a line from origin to the nearest point
            await this.drawWalkingLines(userPin, nearestPoint, type);
          }
        }
      } else {
        console.error(`Invalid geocoding result for ${type}:`, result);
      }
    } catch (error) {
      console.error(`Error geocoding ${type}:`, error);
    }
  }

  findClosestPointOnLine(lat, lng, line) {
    // Ensure lat and lng are valid coordinates
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates for findClosestPointOnLine:', lat, lng);
      return null;
    }
  
    // Ensure line is a valid array with coordinates
    if (!line || !Array.isArray(line) || line.length === 0) {
      console.error('Invalid line array for findClosestPointOnLine:', line);
      return null;
    }
  
    // Find the closest point on the line
    return line.reduce((acc, cur) => {
      const distance = turf.distance(turf.point([lng, lat]), turf.point(cur));
      return distance < acc.distance ? { lat: cur[1], lng: cur[0], distance } : acc;
    }, { lat: line[0][1], lng: line[0][0], distance: turf.distance(turf.point([lng, lat]), turf.point(line[0])) });
  }
  
  async findClosestPoint(coordinates) {
    const polylineURLs = [
      'http://localhost/Karipas%20Cult/RoutesPoly/alangilan.json',
      'http://localhost/Karipas%20Cult/RoutesPoly/balagtas.json',
      'http://localhost/Karipas%20Cult/RoutesPoly/bauanbat.json',
      'http://localhost/Karipas%20Cult/RoutesPoly/capitolio.json',
    ];
  
    try {
      const responses = await Promise.all(polylineURLs.map(url => fetch(url)));
      const polylineDataArray = await Promise.all(responses.map(response => response.json()));
  
      let closestPoint = null;
  
      polylineDataArray.forEach((data, index) => {
        console.log(`Polyline data for ${polylineURLs[index]}:`, data);
  
        if (!data || !data.features || data.features.length === 0) {
          console.error(`Invalid polyline data for ${polylineURLs[index]}:`, data);
          return;
        }
  
        const firstFeature = data.features[0];
  
        if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
          console.error(`Invalid geometry in polyline data for ${polylineURLs[index]}:`, firstFeature.geometry);
          return;
        }
  
        const polylineCoordinates = firstFeature.geometry.coordinates;
  
        // Find the closest point for the current route
        const currentClosestPoint = this.findClosestPointOnLine(coordinates, polylineCoordinates);
  
        // Update closestPoint only if it's null or the current point is closer
        if (!closestPoint || currentClosestPoint.distance < closestPoint.distance) {
          closestPoint = {
            ...currentClosestPoint,
            route: polylineURLs[index], // Include the route information
          };
        }
  
        console.log(`Closest point for ${polylineURLs[index]}:`, currentClosestPoint);
      });
  
      if (!closestPoint) {
        console.error('No valid closest points found.');
        return null;
      }
      document.getElementById('closestRoute').textContent = closestPoint.route;
      console.log(`Closest point overall:`, closestPoint);
  
      return closestPoint;
    } catch (error) {
      console.error('Error loading polyline data:', error);
      return null;
    }
  
  }

  async fetchWalkingLines(startCoordinates, endCoordinates) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${startCoordinates.lng},${startCoordinates.lat};${endCoordinates.lng},${endCoordinates.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
  
      if (!response.ok) {
        throw new Error(`Error fetching walking lines: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      console.log('Walking Lines API Response:', data);
  
      if (data && data.routes && data.routes.length > 0) {
        const walkingLines = data.routes[0].geometry.coordinates;
  
        const distance = data.routes[0].distance;
        const duration = data.routes[0].duration / 60; // Convert seconds to minutes
  
        return { walkingLines, distance, duration };
      } else {
        console.error('No routes found in the Walking Lines API response:', data);
        return { walkingLines: null, distance: null, duration: null }; // Return null values
      }
    } catch (error) {
      console.error('Error fetching walking lines:', error);
      return { walkingLines: null, distance: null, duration: null }; // Return null values
    }
  }
  
  async drawWalkingLines(startCoordinates, endCoordinates, type) {
    try {
      // Fetch walking lines and distances
      const { walkingLines, distance, duration } = await this.fetchWalkingLines(startCoordinates, endCoordinates);

      
      // Check if walkingLines is defined before attempting to iterate over it
      if (!walkingLines) {
        console.error('No walking lines available.');
        return;
      }
  
      walkingLines.forEach((line, index) => {
        const sourceId = `${type}-walking-line-${index}`;
        const layerId = `${type}-walking-line-layer-${index}`;
  
        // Remove existing source and layer if they exist
        if (this.map.getSource(sourceId)) {
          this.map.removeSource(sourceId);
        }
  
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
  
        // Display the walking line on the map
        this.map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              duration: distances[index].duration,
              distance: distances[index].distance,
            },
            geometry: {
              type: 'LineString',
              coordinates: line,
            },
          },
        });
  
        this.map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': type === 'start' ? '#469904' : (type === 'end' ? '#469904' : '#0000FF'), 
            'line-width': 5,
            'line-dasharray': [1, 2], 
          },
        });
  
        // Display the duration and distance in the console
        console.log(`Duration for route ${index + 1}: ${duration} minutes`);
console.log(`Distance for route ${index + 1}: ${distance} meters`);

      });
    } catch (error) {
      console.error('Error drawing walking lines:', error);
    }
  }

  drawRouteFromClosestToOriginToDestination(closestToOrigin, closestToDestination) {
    try {
      // Check if the closest points are on the same route
      if (closestToOrigin.route !== closestToDestination.route) {
        console.log('The closest points are on different routes.');
        return;
      }
  
      // Fetch the polyline data for the route
      const response = fetch(closestToOrigin.route);
      const data = response.json();
  
      if (!data || !data.features || data.features.length === 0) {
        console.error(`Invalid polyline data for ${closestToOrigin.route}:`, data);
        return;
      }
  
      const firstFeature = data.features[0];
  
      if (!firstFeature.geometry || !firstFeature.geometry.coordinates) {
        console.error(`Invalid geometry in polyline data for ${closestToOrigin.route}:`, firstFeature.geometry);
        return;
      }
  
      const polylineCoordinates = firstFeature.geometry.coordinates;
  
      // Find the index of the closest point to the origin
      const indexOrigin = findClosestPointIndex(polylineCoordinates, closestToOrigin);
  
      // Find the index of the closest point to the destination
      const indexDestination = findClosestPointIndex(polylineCoordinates, closestToDestination);
  
      // Create a subset of coordinates between the origin and destination
      const subsetCoordinates = polylineCoordinates.slice(indexOrigin, indexDestination + 1);
      console.log('Route Geometry:', indexOrigin, indexDestination);
  
      // Draw the line from the closest point to the origin to the closest point to the destination
      const sourceId = 'used-route-' + Date.now(); // Ensure a unique source ID
      const layerId = 'used-route-layer-' + Date.now(); // Ensure a unique layer ID
  
  
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
  
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
  
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: subsetCoordinates,
          },
        },
      });
  
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0072c8',
          'line-width': 7,
        },
      });
  
      console.log('Layer added successfully');
  
      // Get directions using Mapbox Directions API
      const directions = getDirections(subsetCoordinates);
  
      if (directions) {
        const distance = directions.distance / 1000; // Convert meters to kilometers
        const duration = directions.duration / 60; // Convert seconds to minutes
  
        console.log(`Drawn the route from ${closestToOrigin.route}`);
        console.log(`Distance: ${distance.toFixed(2)} km`);
        console.log(`Duration: ${duration.toFixed(2)} minutes`);
      } else {
        console.error('Error getting directions.');
      }
    } catch (error) {
      console.error('Error drawing route:', error);
    }
  }

  finalize() {
    try {
      document.getElementById('popupstart').style.display = 'none';
      if (!this.startMarker || !this.endMarker) {
        alert("Pin both origin and destination before finalizing.");
        return;
      }

      const startClosestPoint = this.findClosestPoint(this.startMarker.getLngLat());
      const endClosestPoint = this.findClosestPoint(this.endMarker.getLngLat());
  
      this.drawRouteFromClosestToOriginToDestination(startClosestPoint, endClosestPoint);
  
      const startGeocode = this.startMarker.getLngLat();
      const endGeocode = this.endMarker.getLngLat();

  
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
  
      document.getElementById('geocodess').style.display = 'block';
  
      document.getElementById('startLatitudes').textContent = geocodes.start.lat;
      document.getElementById('startLongitudes').textContent = geocodes.start.lng;
      document.getElementById('endLatitudes').textContent = geocodes.end.lat;
      document.getElementById('endLongitudes').textContent = geocodes.end.lng;
  
      // Set geocodes to hidden form fields
      document.getElementById('startLatitude').value = geocodes.start.lat;
      document.getElementById('startLongitude').value = geocodes.start.lng;
      document.getElementById('endLatitude').value = geocodes.end.lat;
      document.getElementById('endLongitude').value = geocodes.end.lng;
  
      var loggedInUser = '<?php echo $loggedInUser; ?>';
      if (loggedInUser) {
        document.getElementById('saveGeocodesButton').style.display = 'inline-block';
        document.getElementById('saveGeocodeForm').submit();
      }
    } catch (error) {
      console.error('Error during final click:', error);
      // Handle the error as needed, e.g., display an alert or log it
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const mapManager = new MapManager();
});