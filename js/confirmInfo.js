var sessionId;
var isLoggedIn;
var greetElement = document.getElementById('greet');
var hoverCount = 0;

function checkSession() {
  var callName = document.getElementById("callName");
  if (callName && callName.textContent.trim().length > 0) {
    isLoggedIn = true;
  } else {
    isLoggedIn = false;
  }
}

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
  var logInLink = document.getElementById("logInLink");

    if (isLoggedIn) {
      logInLink.innerHTML = '<a href="viewaccount.php"> VIEW ACCOUNT </a>';
    } else {
      logInLink.innerHTML = '<a> LOG IN </a>';
      logInLink.addEventListener("click", openLogInForm);
    }
  } 

/* trippings */
function changeGreet() {
  hoverCount++;

  if (hoverCount == 1) {
    greetElement.innerHTML = '<a id= "greet">San ka punta? To the moon? </a>';}
  else if (hoverCount == 2) {
    greetElement.innerHTML = '<a id= "greet">Roadtrip broom broom~</a>';
  }
  else if (hoverCount == 3) {
    greetElement.innerHTML = '<a id= "greet">Skrrr skrr zoom zoom~</a>';
  }
  else {
  greetElement.innerHTML = '<a id= "greet">Where are you going?</a>';
  hoverCount = 0;
}
}

greetElement.addEventListener('mouseover', changeGreet);


checkSession();
loggedLink();
window.onload = loggedLink;

/* view account php */

function openChangeForm(formId) {
  document.getElementById(formId).style.display = "block";
}

function closeChangeForm(formId) {
  document.getElementById(formId).style.display = "none";
}

function openConfirmation() {
  document.getElementById("confirmationPopup").style.display = "block";
}

function closeConfirmation() {
  document.getElementById("confirmationPopup").style.display = "none";
}

function confirmDelete() {
  closeConfirmation();
  return false; 
}

/* tab effect */
$(document).ready(function () {
  $("#content").on("click", ".tabs a", function (e) {
    e.preventDefault();
    $(this)
      .parents(".tab-container")
      .find(".tab-content > div")
      .each(function () {
        $(this).hide();
      });

    $(this)
      .parents(".tabs")
      .find("a")
      .removeClass("active"),
      $(this).toggleClass("active"), $("#" + $(this).attr("src")).show();
  });
});