<?php

$servername = "localhost";
$username = "Vivs";
$password = "password2!";
$dbname = "karipas3";

// connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if (!$conn) {
    echo 'hello world';
    echo 'Connection error: ' - mysqli_connect_error();
}




