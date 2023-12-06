
KARIPAS: 
---
## + About the Project
This program aims to assist users in finding Jeepney routes between specified origin and destination points within Batangas City.

## + Usage 
1. Set the origin and destination points on the map by clicking on the desired locations.

2. Explore the suggested Jeepney routes, including walking lines for the initial and final parts of the journey.

3. View common routes, stop points, and visual representations on the map.

4. Obtain distance and fare estimations for the Jeepney routes.

## +SDG
1. kaboom


### + Prerequisites

- [XAMPP](https://www.apachefriends.org/index.html) installed on your machine.


### Setup
1. Clone or download the repository into the `htdocs` folder of your XAMPP installation.

    ```bash
    git clone https://github.com/<your-username>/Karipas.git
    ```

2. Start XAMPP and ensure that Apache and MySQL are running.

3. Configure the database connection:
   - Open `db_connect.php` and  ` index.php` located in the `Karipas Cult` folder.
   - Update the database connection details if necessary.
   ```
   $servername = "YOUR_SERVER_NAME";
   $username = "YOUR_USERNAME";
   $password = "YOUR_PASSWORD";
   ```
    
4. Open your browser and navigate to
   ```
   http://localhost/Karipas/Karipas%20Cult/index.php
   ```
## Usage 
1. Set the origin and destination points on the map by clicking on the desired locations.

2. Explore the suggested Jeepney routes, including walking lines for the initial and final parts of the journey.

3. View common routes, stop points, and visual representations on the map.

4. Obtain distance and fare estimations for the Jeepney routes.


## + Built With

* [Mapbox](https://www.mapbox.com/)) - Mapping Features
* [OpenStreetMap](https://www.openstreetmap.org/) - Jeepney Routes
* [Xampp](http://www.facweb.iitkgp.ac.in/dashboard/) - Database and Server


## + Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

## Acknowledgments

* Hat tip to anyone whose code was used
