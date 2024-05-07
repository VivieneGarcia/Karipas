<?php

$is_invalid = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mysqli = require __DIR__ . "/dtbconnect.php";
    
    // Sanitize user input to prevent SQL injection
    $username = $mysqli->real_escape_string($_POST["username"]);
    
    $sql = "SELECT * FROM users WHERE username = ?";
    
    // Use prepared statement to avoid SQL injection
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        $password = $_POST["password"];

        // Verify password
        if ($user && password_verify($password, $user["password"])) {
            session_start();

            session_regenerate_id();
            $_SESSION["user_id"] = $user["id"];
            header("Location: logverify.php");
            exit;
        }
        else 
        echo('showInvalidPopup()');
    }  $is_invalid = true;
}

?>