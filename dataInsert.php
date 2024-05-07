<?php
// Include connection details (optional)
include 'variables.php';

// Create a connection
$conn = new mysqli($servername, $username, $password);

// Check the connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Select the database
$conn->select_db($databaseName);

// Sample data for tourist spots
$touristSpots = array(
  array("name" => "Lion Marker", "latitude" => 121.0656749169155, "longitude" => 13.771474777915884, "image_path" => "http://localhost/Karipas/elements/images/LionMarker.jpg"),
  array("name" => "Bsu Alangilan", "latitude" => 121.07393104562806, "longitude" => 13.78408473796219, "image_path" => "http://localhost/Karipas/elements/images/BSUAlangilan.png"),
 // array("name" => "UB Overpass", "latitude" => 121.0588876075854, "longitude" =>  13.764070814021593, "image_path" => "http://localhost/Karipas/elements/images/UBOverpass.png"),
  array("name" => "Basilica ", "latitude" => 121.05928198259005, "longitude" =>  13.753852134264179, "image_path" => "http://localhost/Karipas/elements/images/Basilica.jpg"),
  array("name" => "Plaza Mabini", "latitude" => 121.05919206741612, "longitude" => 13.755214701704332, "image_path" => "http://localhost/Karipas/elements/images/PlazaMabini.jpg"),
  array("name" => "Batangas City Hall", "latitude" =>  121.05805254121242, "longitude" => 13.755753517167136, "image_path" => "http://localhost/Karipas/elements/images/CityHall.jpg"),
  // Add more tourist spots here following the same format
);

// Check for existing tourist spots before inserting (optional)
$existingSpots = array();
$sqlCheck = "SELECT name FROM touristspots";
$result = $conn->query($sqlCheck);

if ($result->num_rows > 0) {
  while($row = $result->fetch_assoc()) {
    $existingSpots[] = $row["name"];
  }
}

// Loop through data and insert only non-existent spots
foreach ($touristSpots as $spot) {
  $name = $spot["name"];
  $latitude = $spot["latitude"];
  $longitude = $spot["longitude"];
  $imagePath = $spot["image_path"]; // Add this line to fetch image_path

  if (!in_array($name, $existingSpots)) {
    // Prepare and execute the SQL statement (if name doesn't exist)
    $sql = "INSERT INTO touristspots (name, latitude, longitude, image_path) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $name, $latitude, $longitude, $imagePath); // Bind image_path

    if ($stmt->execute()) {
      echo "Record inserted successfully for " . $name . "<br>";
    } else {
      echo "Error inserting record: " . $conn->error . "<br>";
    }

    $stmt->close();
  } else {
    echo "Skipping duplicate record for " . $name . "<br>";
  }
}


// Close the connection
$conn->close();
?>
