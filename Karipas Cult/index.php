<?php
$servername = "localhost";
$username = "Vivs";
$password = "password2!";

// Create a connection
$conn = new mysqli($servername, $username, $password);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create the database if it doesn't exist
$databaseName = "karipas2";
$sqlCreateDB = "CREATE DATABASE IF NOT EXISTS $databaseName";
if ($conn->query($sqlCreateDB) === TRUE) {
    echo "Database created successfully<br>";

    // Select the database
    $conn->select_db($databaseName);

    // Create the 'users' table
    $sqlCreateUsersTable = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
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

    // Redirect to home.html
    header("Location: home.html");
    exit();
} else {
    echo "Database already exists. Redirecting to home.html...<script>console.log('Database already exists.');</script>";
    $conn->close();

    // Redirect to home.html
    header("Location: home.html");
    exit();
}
?>

