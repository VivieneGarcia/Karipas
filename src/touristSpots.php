<?php
// Include connection script
$mysqli = require "dtbconnect.php";

// Fetch tourist spots from the database
$touristSpots = array();

$sql = "SELECT * FROM touristspots";
$result = $mysqli->query($sql);

if ($result->num_rows > 0) {
  while($row = $result->fetch_assoc()) {
    $touristSpots[] = $row;
  }
} else {
  echo "No tourist spots found in the database.";
}

// Now $touristSpots contains an array of tourist spots retrieved from the database
// You can use this array to generate buttons dynamically in your HTML
?>
