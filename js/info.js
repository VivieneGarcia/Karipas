let isLoggedIn = false;

/* log in pop-up functions */
function openLogInForm() {
  document.getElementById("logForm").style.display = "block";
}

function closeLogInForm() {
  document.getElementById("logForm").style.display = "none";
}

/* sign up pop-up functions */
function openSignUpForm() {
  document.getElementById("logForm").style.display = "none";
  document.getElementById("signForm").style.display = "block";
}

function closeSignUpForm() {
  document.getElementById("signForm").style.display = "none";
}

/* header: to change "log in" to "view account" if user = logged in */

function loggedLink() {
  document.getElementById("logInLink");

  if (isLoggedIn) {
    logInLink.innerHTML = '<a href="#account"> View Account </a>';
  }
  else {
    logInLink.innerHTML = '<a href="#"> Log In </a>';
    logInLink.addEventListener("click", openLogInForm);
  }
}

window.onload = loggedLink;

/* retrieve log in information */

function logInUser() {
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;
}