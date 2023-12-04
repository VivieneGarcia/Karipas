<?php

session_start();
include_once 'db_connect.php';

if (isset($_POST['submit'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Sanitize and prepare data for database query
    $username = mysqli_real_escape_string($conn, $username);

    // Retrieve hashed password and userID from the database
    $sql = "SELECT id, password FROM users WHERE username=?";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s", $username);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    // Check if a user with the given username exists
    if ($row = mysqli_fetch_assoc($result)) {
        // Verify the entered password against the stored hashed password
        $password_verified = password_verify($password, $row['password']);

        if ($password_verified) {
            // Password is correct, set userID in the session
            $_SESSION['username'] = $username;
            $_SESSION['userID'] = $row['id'];

            header('Location: map.php');
            exit();
        } else {
            // Password is incorrect
            $message = "Invalid username or password. Please try again.";
            header('Location: register.php?message='.urlencode($message));
        }
    } else {
        // No user with the given username
        $message = "NO USER WITH THE SAME EMAIL OR PASSWORDS";
        header('Location: register.php?message='.urlencode($message));
    }
}
?>
