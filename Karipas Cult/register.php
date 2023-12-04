<?php
include_once 'db_connect.php';

$message = filter_input(INPUT_GET, 'message');

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Login System</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

<nav id='menu'>
  <input type='checkbox' id='responsive-menu'>
  <label for='responsive-menu'></label>
  <ul>
  <li><a href='home.html'>Home</a></li>
      <li><a href='register.php'>Login</a></li> 
      <li><a href='map.php'>Map</a></li>
      <li><A href='jeeps.html'>Jeeps</a><li> <!-- FOR EXRTA LANG TO-->
  </ul>
</nav> 

<div class="login-container">
  <h1>Karipas: Smart Transportation System</h1>
  <h2>Sign Up or Login to Save History!</h2>
  <p><?php echo $message; ?></p>

  <button id="loginButton" onclick="showLoginForm()">Login</button>
  <button id="signupButton" onclick="showSignupForm()">Signup</button>
  <button id="deleteAcc" onclick="showDeletAccForm()">Delete Account</button>


  
  <form id="deleteAccountForm" action="delete_account.php" method="post"style="display: none;">
    <h2>Delete Account</h2>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required><br>

    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required><br>

    <div id="confirmationDialog" style="display: none;">
        <p>Are you sure you want to delete your account with its history?</p>
        <input type="submit" name="submit" value="Yes, Delete my Account">
        <button type="button" onclick="hideConfirmationDialog()">No, cancel</button>
    </div>

    <button type="button" id="deleteAcc" onclick="showDeleteAccForm()">Delete Account</button>
</form>

</div>
  <div id="loginForm" style="display: none;">
    <h2>Login</h2>
    <form action="login.php" method="post">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required><br>

      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required><br>

      <input type="submit" name="submit" value="Submit">
    </form>
  </div>

  <div id="signupForm" style="display: none;">
    <h2>Signup</h2>
    <form action="signup.php" method="post">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required><br>

      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required><br>

      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required><br>

      <label for="confirm_password">Confirm Password:</label>
      <input type="password" id="confirm_password" name="confirm_password" required><br>

      <input type="submit" name="submit" value="Submit">
    </form>
  </div>

  <div class="map-buttons">
    <button id="goToMap" onclick="redirectToMap()">Go to Map</button>
  </div>
</div>

<script>
  function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('deleteAccountForm').style.display = 'none';
  }

  function showSignupForm() {
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('deleteAccountForm').style.display = 'none';
  }

  function redirectToMap() {
    window.location.href = 'map.php';
  }

  function showDeletAccForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('deleteAccountForm').style.display = 'block';
  }

  function showDeleteAccForm() {
        document.getElementById('confirmationDialog').style.display = 'block';
        document.getElementById('deleteAcc').disabled = true; 
    }

  function hideConfirmationDialog() {
      document.getElementById('confirmationDialog').style.display = 'none';
  }

  function deleteAccount() {
      document.getElementById('deleteAccountForm').submit();
  }
</script>

</body>
</html>

<style>
   button {
      padding: 10px 15px;
      font-size: 16px;
      background-color:  #175f84;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
      margin-right: 5px;
    }

  button:hover {
      background-color: #00008B;
    }

  input[type="submit"] {
      padding: 10px 15px;
      font-size: 16px;
      background-color:  #175f84;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

  input[type="submit"]:hover {
      background-color: #00008B;
    }

</style>