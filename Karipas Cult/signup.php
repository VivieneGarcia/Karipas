<?php
include_once 'db_connect.php';

if (isset($_POST['submit'])) {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // Validate and sanitize user inputs
    if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
        $message = "All fields are required!";
        header('Location: register.php?message='.urlencode($message));
        exit(); // Stop further execution
    }

    if ($password != $confirm_password) {
        $message = "Passwords do not match!";
        header('Location: register.php?message='.urlencode($message));
        exit(); // Stop further execution
    }

    // Sanitize and prepare data for database insertion
    $username = mysqli_real_escape_string($conn, $username);
    $email = mysqli_real_escape_string($conn, $email);

    // Hash the password for secure storage
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Check if username or email already exists
    $sql = "SELECT * FROM users WHERE username='$username' OR email='$email'";
    $result = mysqli_query($conn, $sql);

    if (mysqli_num_rows($result) > 0) {
        if (mysqli_fetch_assoc($result)['username'] === $username) {
            $message = "Username already exists!";
            header('Location: register.php?message='.urlencode($message));
        } else {
            $message = "Email already registered!";
            header('Location: register.php?message='.urlencode($message));
        }
        exit(); // Stop further execution
    }

    // Insert user information into the database
    $sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);

    // Bind parameters
    mysqli_stmt_bind_param($stmt, "sss", $username, $email, $hashed_password);

    // Execute the statement
    if (mysqli_stmt_execute($stmt)) {
        $message = "Signup Successful! Try to login";


        // Redirect to login page with message
        header('Location: register.php?message='.urlencode($message));
        exit();
    } else {
        $error = mysqli_error($conn);
        if (strpos($error, "Duplicate entry") !== false) {
            $message = "Username or email already exists!";
            header('Location: register.php?message='.urlencode($message));
        } else {
            $message ="Error: " . $sql . "<br>" . $error;
            header('Location: register.php?message='.urlencode($message));
        }
    }

    header('Location: register.php');
    exit();
}
