class MapInitializer {
  constructor() {
    mapboxgl.accessToken = "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";
    this.mapBounds = new mapboxgl.LngLatBounds([
      [120.821471, 13.583923], // Southwest corner
      [121.217243, 13.905142] // Northeast corner
    ]);
  }

  initializeMap() {
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [121.05235981732966, 13.773815015863619],
      zoom: 13,
      maxBounds: this.mapBounds,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });

    this.map.addControl(geocoder, 'top-left');
    this.map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
  }

  displayRoutes(polylineInfo) {
    polylineInfo.forEach((info) => {
      fetch(info.url)
        .then((response) => response.json())
        .then((data) => {
          const polylineData = {
            id: `custom-polyline-${polylines.length + 1}`,
            data: data,
          };
          this.map.addSource(polylineData.id, {
            type: "geojson",
            data: polylineData.data,
          });

          this.map.addLayer({
            id: polylineData.id,
            type: "line",
            source: polylineData.id,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": info.color,
              "line-width": info.width,
              "line-opacity": 0.18,
            },
          });

          polylines.push(polylineData);
        })
        .catch((error) =>
          console.error(`Error loading polyline: ${info.url}`, error)
        );
    });
  }
}


document.addEventListener("DOMContentLoaded", function () {
  const mapInitializer = new MapInitializer();
  mapInitializer.initializeMap();

  const routeManager = new RouteManager();
  const markerManager = new MarkerManager(mapInitializer.map);

  document.getElementById("setStart").addEventListener("click", function () {
    markerManager.setMode("start");
    markerManager.displayPopup("Origin");
  });

  document.getElementById("setEnd").addEventListener("click", function () {
    markerManager.setMode("end");
    markerManager.displayPopup("Destination");
  });

  document.getElementById("final").addEventListener("click", async function () {
    try {
      const resultContainer = document.getElementById("resultsContainer");
      resultContainer.innerHTML = "";

      markerManager.clearMarkers();
      routeManager.clearRoutes();

      if (!markerManager.hasBothMarkers()) {
        alert("Pin both origin and destination before finalizing.");
        return;
      }

      const startUserPin = await markerManager.getGeocodedPin("start", markerManager.getGeocodes()[0]);
      const endUserPin = await markerManager.getGeocodedPin("end", markerManager.getGeocodes()[1]);

      console.log("GEOCODED USER PIN:", startUserPin, endUserPin);

      routeManager.compareAndDrawRoutes(startUserPin, endUserPin);

      const [startGeocode, endGeocode] = markerManager.getGeocodes();

      const loggedInUser = "<?php echo $loggedInUser; ?>";
      if (loggedInUser) {
        document.getElementById("saveGeocodesButton").style.display = "inline-block";
        document.getElementById("saveGeocodeForm").submit();
      }
    } catch (error) {
      console.error("Error during final click:", error);
    }
  });
});


class MapInitializer {
  constructor() {
    mapboxgl.accessToken = "pk.eyJ1IjoiY3p5bm9uam9obiIsImEiOiJjbG9xZWVzcnIwaDBpMmttenpza2I1ajZqIn0.SXmiSmtjjBMSmMA_rmVwiw";
    this.mapBounds = new mapboxgl.LngLatBounds([
      [120.821471, 13.583923], // Southwest corner
      [121.217243, 13.905142] // Northeast corner
    ]);
  }

  initializeMap() {
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [121.05235981732966, 13.773815015863619],
      zoom: 13,
      maxBounds: this.mapBounds,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });

    this.map.addControl(geocoder, 'top-left');
    this.map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
  }
}

class RouteManager {
  constructor() {
    this.polylineInfo = [
      { url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/alangilan.json", color: "#ff0000", width: 9, name: "Alangilan", pin: "http://localhost/Karipas/Karipas%20Cult/images/alangilanpin.png" },
      { url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/balagtas.json", color: "#00ff00", width: 4, name: "Balagtas", pin: "http://localhost/Karipas/Karipas%20Cult/images/balagtas.pin.png" },
      { url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/bauanbat.json", color: "#113c82", width: 5, name: "Bauan", pin: "http://localhost/Karipas/Karipas%20Cult/images/bauanpin.png" },
      { url: "http://localhost/Karipas/Karipas%20Cult/RoutesPoly/libjo.json", color: "#5a2476", width: 5, name: "Libjo", pin: "http://localhost/Karipas/Karipas%20Cult/images/libjopin.png" },
    ];
    this.polylines = [];
  }

  async compareAndDrawRoutes(origin, destination) {
      try {
        const originClosestPoints = await findClosestPointOnRoutes(origin, numberOfClosestRoutes );
        const destinationClosestPoints = await findClosestPointOnRoutes(destination,numberOfClosestRoutes);
    
        if (!originClosestPoints || !destinationClosestPoints) {
          document.getElementById("messages").style.display = "inline-block";
          document.getElementById(`message`).textContent ="PINS ARE TOO FAR FROM AVAILABLE ROUTES ";
          return;
        }
    
        const originRoutes = originClosestPoints.map((point) => point.route);
        const destinationRoutes = destinationClosestPoints.map((point) => point.route);
        const commonRoutes1= findExactCommonRoutes(originRoutes, destinationRoutes);
    
        if (commonRoutes1.length > 0) {
          console.log(`Origin and destination share common routes: ${commonRoutes1.join(", ")}`);
    
          for (const commonRoute of commonRoutes1) {
            const originPoint = originClosestPoints.find((point) => point.route === commonRoute);
            const destinationPoint = destinationClosestPoints.find((point) => point.route === commonRoute);
            await drawWalkingLines(origin,originPoint , "start");
            await drawWalkingLines(destination,destinationPoint , "end");
            await drawJeepCommonRoute(commonRoute, originPoint, destinationPoint);
          }
        } else {
  
          console.log("Origin and destination do not have common routes. Checking stop points...");
    
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
          
            console.log("STOP POINT:", stopPoint);
          
            const closestRoutePoints = await findClosestPointOnRoutes(stopPoint, howManyRoutes);
          
            const stopPointRoutes = closestRoutePoints.map((point) => point.route);
            const commonRoutes2 = findExactCommonRoutes(originRoutes,stopPointRoutes);
            const commonRoutes3 = findExactCommonRoutes(destinationRoutes,stopPointRoutes);
  
            console.log("Common Routes:", commonRoutes2, "3", commonRoutes3);
            
            if (commonRoutes2.length > 0) {
              console.log(`Stop point has common routes: ${commonRoutes2.join(", ")}`);
          
              for (const stopRoute of commonRoutes2) {
                const originPoint = originClosestPoints.find((point) => point.route === stopRoute);
                const StopPoint1 = closestRoutePoints.find((point) => point.route === stopRoute);
                console.log("this is everything: ",stopRoute, originPoint, StopPoint1)
                await drawWalkingLines(origin,originPoint , "start");
                
                await drawJeepCommonRoute(stopRoute, originPoint, StopPoint1 );
                const marker = createMarker({ lng: stopPoint.lng, lat: stopPoint.lat });
                markers.push(marker);
              }
            } else {
              console.log("Stop point does not have common routes.");
            }
  
            if (commonRoutes3.length > 0) {
            for (const stopRoute of commonRoutes3) {
              const destinationPoint = destinationClosestPoints.find((point) => point.route === stopRoute);
              const StopPoint2 = closestRoutePoints.find((point) => point.route === stopRoute);
              await drawWalkingLines(destination,destinationPoint , "end");
              console.log("this is everything: ",stopRoute, destinationPoint, StopPoint2)
              await drawJeepCommonRoute(stopRoute, StopPoint2, destinationPoint );
            }
          } else {
            console.log("Stop point does not have common routes.");
            }
          }
        }
      } catch (error) {
        console.error("Error during final click:", error);
      }
    
  }

  clearRoutes() {
    // Your existing code for clearEveryLayer function goes here
    // ...
  }
}

class MarkerManager {
  constructor(map) {
    this.map = map;
    this.startMarker = null;
    this.endMarker = null;
    this.settingStart = false;
    this.settingEnd = false;
  }

  setMode(mode) {
    this.settingStart = mode === "start";
    this.settingEnd = mode === "end";
  }

  displayPopup(type) {
    const popupElement = document.getElementById("popupstart");
    popupElement.style.display = "block";
    popupElement.textContent = `Pin on the map to set ${type}`;
    document.getElementById("successMessage").style.display = "none";
  }

  async getGeocodedPin(type, pinCoordinates) {
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

  hasBothMarkers() {
    return this.startMarker && this.endMarker;
  }

  getGeocodes() {
    const startGeocode = this.startMarker.getLngLat();
    const endGeocode = this.endMarker.getLngLat();
    return [startGeocode, endGeocode];
  }

  clearMarkers() {
    if (this.startMarker) {
      this.startMarker.remove();
      this.startMarker = null;
    }

    if (this.endMarker) {
      this.endMarker.remove();
      this.endMarker = null;
    }
  }

  handleMarkerSetting(e, type) {
    const marker = type === "start" ? this.startMarker : this.endMarker;
    const markerImage =
      type === "start"
        ? "http://localhost/Karipas/Karipas%20Cult/images/mapbox-marker-icon-20px-green.png"
        : "http://localhost/Karipas/Karipas%20Cult/images/mapbox-marker-icon-20px-red.png";

    if (marker) {
      marker.remove();
    }

    const lngLat = e.lngLat;

    const newMarker = new mapboxgl.Marker({
      element: this.createCustomMarker(markerImage),
    })
      .setLngLat(lngLat)
      .addTo(this.map);

    if (type === "start") {
      this.startMarker = newMarker;
    } else {
      this.endMarker = newMarker;
    }

    this.showAddress(lngLat, type);
  }

  createCustomMarker(markerImage) {
    const markerElement = document.createElement("img");
    markerElement.src = markerImage;
    markerElement.style.width = "26px";
    markerElement.style.height = "62.4px";
    return markerElement;
  }
}
