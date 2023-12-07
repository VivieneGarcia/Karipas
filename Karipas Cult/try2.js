document.addEventListener("DOMContentLoaded", function () {
  class MapApplication {
    constructor() {
      this.map = null;
      this.markers = [];
      this.commonRouteIds = [];
    }
  
    async initializeMap() {
      // Implement map initialization, if needed
      // this.map = ...;
    }
  
    async compareAndDrawtheLines(origin, destination) {
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
  
    async drawJeepCommonRoute(route, originClosestPoint, destinationClosestPoint) {
      try {

        document.getElementById("resultsContainer").style.display = "block";

        const response = await fetch(route);
        const data = await response.json();
        const routeInfo = polylineInfo.find(info => info.url === route);


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
        const overlappingPoints = getOverlappingPointsOfCompressedCircle(polylineCoordinates);

        const { indexOrigin, indexDestination } = findOptimalOriginAndDestinationPoints(polylineCoordinates, originClosestPoint, destinationClosestPoint, overlappingPoints);

        if (indexOrigin === null || indexDestination === null) {
            console.error(`Error finding closest points on ${route} for origin or destination.`);
            return;
        }

        const subsetCoordinates = calculateSubsetCoordinates(polylineCoordinates, indexOrigin, indexDestination);

        const segments = splitRouteCoordinates(subsetCoordinates);
        let overallDistance = 0;
        let overallDuration = 0;

        for (const segment of segments) {
            const response = await fetchMatchingAPI(segment);

            if (!response || !response.matchings ||response.matchings.length === 0) {
                console.error(`Invalid matching data for segment:`, data);
                continue;
            }

            const matching = response.matchings[0];
            const distanceOfSegment = matching.distance;
            const durationOfSegment = matching.duration;
            const coordinates = matching.geometry.coordinates;

            overallDistance += distanceOfSegment;
            overallDuration += durationOfSegment; 

            if (coordinates.length > 0) {

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
  
              const routeInfo = polylineInfo.find(info => info.url === route);
              const routeColor = routeInfo.color;
              const routeWidth = routeInfo.width;
  
              map.addLayer({
                  id: layerId2,
                  type: "line",
                  source: sourceId2,
                  layout: {
                      "line-join": "round",
                      "line-cap": "round",
                  },
                  paint: {
                      "line-color": routeColor,
                      "line-width":  routeWidth,
                      "line-opacity": 0.8,
                  },
              });
          } else {
              console.error(`Subset coordinates are empty for ${route}. Skipping drawing for this pair.`);
          }
        }
        document.getElementById('jeepsAvailable').style.display = "block";
        document.getElementById('reminder').style.display = "block";
        displayResults(routeInfo, subsetCoordinates, overallDistance, overallDuration)
    } catch (error) {
        console.error(`Error drawing line connecting closest points for common route ${route}:`, error);
    }
    } 
  
    displayResults(routeInfo, subsetCoordinates, overallDistance, overallDuration) {
      const overalDistanceRounded = Math.round(overallDistance / 1000);
      const fare = calculateJeepFare(overallDistance / 1000);
    
      const resultContainer = document.getElementById("resultsContainer");
    
      const resultElement = document.createElement("div");
      resultElement.classList.add("result");
    
      const pinElement = document.createElement("img");
      pinElement.src = routeInfo ? routeInfo.pin : "";
    
      const routeInfoElement = document.createElement("x");
      routeInfoElement.textContent = `${routeInfo ? routeInfo.name : 'Unknown'}`;
    
      const distanceInfoElement = document.createElement("r");
      distanceInfoElement.textContent = `Distance:${overalDistanceRounded}km`;
    
      const durationInfoElement = document.createElement("z");
      durationInfoElement.textContent = `| Duration: ${Math.round(Number(overallDuration) / 60)}min`;
    
      const fareInfoElement = document.createElement("f");
      fareInfoElement.textContent = `Fare: PHP ${fare.toFixed(2)}`;
    
      resultElement.appendChild(pinElement);
      resultElement.appendChild(routeInfoElement);
      resultElement.appendChild(distanceInfoElement);
      resultElement.appendChild(durationInfoElement);
      resultElement.appendChild(fareInfoElement);
      resultContainer.appendChild(resultElement);
    }
  
    calculateJeepFare(distanceInKm) {
      const baseFare = 13; // Initial fare
      const initialDistance = 4; // Initial distance for base fare
      const perKm = 1     ; // Fare per kilometer

      const calculatedFare = baseFare + (distanceInKm - initialDistance) * perKm;
      if(calculatedFare < baseFare){
        return baseFare;
      } else{
        return Math.round(calculatedFare * 4.0) / 4.0; // Round to the nearest 0.25 PHP
      }
    }
  
    splitRouteCoordinates(route) {
      const segments = [];
      const numSegments = Math.ceil(route.length /99);

      for (let i = 0; i < numSegments; i++) {
          const startIdx = i * 99;
          const endIdx = (i + 1) * 99;
          const segment = route.slice(startIdx, endIdx);
          segments.push(segment);
      }

      return segments;
    }
  
    async fetchMatchingAPI(segment) {
      try {
        const coordinates = segment.map(coord => `${coord[0]},${coord[1]}`).join(';');
        const response = await fetch(
            `https://api.mapbox.com/matching/v5/mapbox/driving-traffic/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );

        if (!response.ok) {
            throw new Error(`Error fetching Map Matching API: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching Map Matching API:`, error);
        return null;
    }
    }
  
    findOptimalOriginAndDestinationPoints(route, originClosestPoint, destinationClosestPoint, overlappingPoints) {
      console.log("STOP POINT AND POINT", originClosestPoint,destinationClosestPoint)
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
  
    findPointIndex(route, point) {
      for (let i = 0; i < route.length; i++) {
        const routePoint = route[i];
        if (routePoint[0] === point.lng || routePoint[1] === point.lat) {
            return i; 
        }
      }
        return -1;
    }
    
    checkOverlappingPoints(point, overlappingPoints) {
      console.log("Point:", point);
      for (const overlappingPointObj of overlappingPoints) {
          const overlappingPoint = overlappingPointObj.coordinate;
          if (point.lng === overlappingPoint[0] && point.lat === overlappingPoint[1]) {
              return true; // It overlaps
          }
      }
      return false; // It doesn't
    }
  
    findAlternativeIndex(point, overlappingPoints, route) {
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
  
    getOverlappingPointsOfCompressedCircle(route) {
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
  
    calculateSubsetCoordinates(polylineCoordinates, indexOrigin, indexDestination) {
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
          subsetCoordinates.push(...polylineCoordinates.slice(indexOrigin), ...polylineCoordinates.slice(0, indexDestination + 1));
      }

      // Check if the subset is too long and there is more than one route
      if (subsetCoordinates.length > maxSubsetLength && polylineCoordinates.length > 2) {
          console.error("Error: Subset is too long");
          return [];
      }

      return subsetCoordinates;
    }
  
    findExactCommonRoutes(route1, route2) {
      const arrayify = (value) => (Array.isArray(value) ? value : [value]);

      const set1 = new Set(arrayify(route1));
      const set2 = new Set(arrayify(route2));

      const uniqueCommonRoutes = new Set([...set1].filter(route => set2.has(route)));

      return [...uniqueCommonRoutes];
    } 
  
    async getStopPoints() {
      try {
        const response = await fetch("http://localhost/Karipas/Karipas%20Cult/RoutesPoly/StopPoints.json");
        const data = await response.json();
        return data.features.map(feature => feature.geometry.coordinates);
      } catch (error) {
        console.error("Error during getStopPoints:", error);
        return [];
      }
    }
  }
  
  // Subclass to handle button interactions
  class ButtonHandler extends MapApplication {
    constructor() {
      super();
      // Additional properties specific to button handling
      this.originInput = document.getElementById('originInput');
      this.destinationInput = document.getElementById('destinationInput');
      this.compareButton = document.getElementById('compareButton');
      this.messagesContainer = document.getElementById('messages');
    }
  
    attachEventListeners() {
      this.compareButton.addEventListener('click', () => this.handleCompareButtonClick());
    }
  
    async handleCompareButtonClick() {
      const origin = this.originInput.value;
      const destination = this.destinationInput.value;
  
      // Validate inputs
  
      // Call the method from the parent class
      await this.compareAndDrawtheLines(origin, destination);
    }
  }
  
  const buttonHandler = new ButtonHandler();
  buttonHandler.attachEventListeners();
  
});
