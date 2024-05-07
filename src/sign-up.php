<?php

//if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // PHP code for handling form submission
//}

include 'dtbconnect.php';

$username = $_POST['username'];
$firstName = $_POST['firstname'];
$lastName = $_POST['lastname'];
$email = $_POST['email'];
$discounted = isset($_POST['discounted']) ? (bool)$_POST['discounted'] : false;  

// username more than 6 and less than 20 characters
if (strlen($_POST["username"] < 6 ) && strlen($_POST["username"] > 20 )) {
  echo("Username needs to be atleast 6-20 characters");
}

// password should consist of alphanumerical + special char
$uppercase = preg_match('@[A-Z]@', $_POST["password"]);
$lowercase = preg_match('@[a-z]@', $_POST["password"]);
$number    = preg_match('@[0-9]@', $_POST["password"]);
$specialChars = preg_match('@[^\w]@', $_POST["password"]);

// password more than 8 and less than 20 characters
if ($_POST["password"] < 8 && $_POST["password"] > 20
    && !$uppercase || !$lowercase || !$number || !$specialChars) {
  echo("Passwords needs to be atleast 8-20 characters and
  should include at least one upper case letter, one number, and one special character.");
}

// password must match 
if ($_POST["password"] !== $_POST["password_confirmation"]) {
  die("Passwords must match");
}

$password_hash = password_hash($_POST["password"], PASSWORD_DEFAULT);

$mysqli = require __DIR__ . "/dtbconnect.php";

$sql = "INSERT INTO users (username, email, first_name, last_name, discounted, password)
        VALUES (?, ?, ?, ?, ?, ?)";
        
$stmt = $mysqli->stmt_init();

if ( ! $stmt->prepare($sql)) {
    die("SQL error: " . $mysqli->error);
}

$stmt->bind_param("ssssss",
                  $_POST["username"],
                  $_POST["email"],
                  $_POST["firstname"],
                  $_POST["lastname"],
                  $_POST["discounted"],
                  $password_hash);
                  
if ($stmt->execute()) {

    header("Location: ../public/sign-up-success.html");
    exit;
    
} else {
    
    if ($mysqli->errno === 1062) {
        die("Username already taken");
    } else {
        die($mysqli->error . " " . $mysqli->errno);
    }
} 
