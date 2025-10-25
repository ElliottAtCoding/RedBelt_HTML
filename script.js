const Login = document.getElementById("LoginButton");
const apiKey = "68ea8f1c7f34ed3b0c200aaa";
const signupButton = document.getElementById("SignUpButton");
const logoutButton = document.getElementById("logoutButton");

Login.addEventListener("click", () => {
  let loginusername = prompt("What is your username?");
  let loginpassword = prompt("What is your password?");
  const query = encodeURIComponent(`{"username":"${loginusername}","password":"${loginpassword}"}`);
  const usernameToCheck = loginusername;
  let userExists = false;
  const url = `https://hiscoretracker-67e9.restdb.io/rest/accounts?q=${query}`;
    fetch(url, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "x-apikey": apiKey,
                "cache-control": "no-cache",
            }
        })
        .then((res) => {
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        })
        .then((data) => {
            userExists = data.length > 0;
            if (userExists) {
                alert("user exists");
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', usernameToCheck);
                updateUserBadge();
            } else {
                alert("Incorrect username or password");
            }
        });
});
const SignUp = document.getElementById("SignUpButton");
SignUp.addEventListener("click", () => {
  let signUpusername = prompt("What is your desired username?");
  let signUppassword = prompt("What is your desired password?");
  let userExists = false;
    fetch(
        'https://hiscoretracker-67e9.restdb.io/rest/accounts?q={"username":"' + signUpusername + '"}', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-apikey": apiKey,
                "cache-control": "no-cache",
            },
        }
    )
        .then((res) => {
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        })
        .then((data) => {
            userExists = data.length > 0;
            if (userExists) {
                console.log("User exists:", data);
                // Here you would typically check the password as well
            } else {
                console.log("User does not exist.");
            }
});
});
const updateUserBadge = () => {
  if (!userBadge) return;
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    const storedUsername = localStorage.getItem("username");
    userBadge.textContent = `Hello, ${storedUsername}`;
  } else {
    userBadge.textContent = "Not logged in";
  }
};
const whenLoggedIn = () => {
    signupButton.style.display = "none";
    Login.style.display = "none";
    logoutButton.style.display = "inline-block";

}
document.addEventListener('DOMContentLoaded', () => {
  updateUserBadge();

  if (localStorage.getItem('isLoggedIn') === 'true') {
    whenLoggedIn();
  }
});
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    alert("You have been logged out.");
    location.reload();
    });