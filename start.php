<?php
include 'variables.php';

// Create a connection
$conn = new mysqli($servername, $username, $password);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create the database if it doesn't exist
$databaseName = "karipas";
$sqlCreateDB = "CREATE DATABASE IF NOT EXISTS $databaseName";
if ($conn->query($sqlCreateDB) === TRUE) {
    echo "Database created successfully<br>";

    // Select the database
    $conn->select_db($databaseName);
    $sqlCreateTouristSpots = "CREATE TABLE IF NOT EXISTS touristspots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        image_path VARCHAR(1000) NOT NULL
    )";
  
    // Create the 'touristspots' table
    if ($conn->query($sqlCreateTouristSpots) === TRUE) {
      echo "Table 'touristspots' created successfully<br>";
    } else {
      echo "Error creating 'touristspots' table: " . $conn->error . "<br>";
    }

    
    // Create the 'users' table
    $sqlCreateUsersTable = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL, 
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(35) NOT NULL,
        last_name VARCHAR(35) NOT NULL,
        discounted TINYINT(1) NOT NULL default 0
    )";
    if ($conn->query($sqlCreateUsersTable) === TRUE) {
        echo "Table 'users' created successfully<br>";
    } else {
        echo "Error creating 'users' table: " . $conn->error . "<br>";
    }

    // Create the 'geocodes' table
    $sqlCreateGeocodesTable = "CREATE TABLE IF NOT EXISTS geocodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        start_latitude DOUBLE NOT NULL,
        start_longitude DOUBLE NOT NULL,
        end_latitude DOUBLE NOT NULL,
        end_longitude DOUBLE NOT NULL,
        origin_address varchar(100),
        destination_address varchar(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )";
    if ($conn->query($sqlCreateGeocodesTable) === TRUE) {
        echo "Table 'geocodes' created successfully<br>";
    } else {
        echo "Error creating 'geocodes' table: " . $conn->error . "<br>";
    }
    
    // Close the database connection
    $conn->close();
    require 'dataInsert.php';

    // Redirect to index.php
    header("Location: public/index.php");
    exit();
} else {
    echo "Database already exists. Redirecting to home.html...<script>console.log('Database already exists.');</script>";
    $conn->close();

    // Redirect to index.php
    header("Location: public/index.php");
    exit();
}
?>

