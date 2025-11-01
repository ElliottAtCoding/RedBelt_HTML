const Login = document.getElementById("LoginButton");
const apiKey = "68ea8f1c7f34ed3b0c200aaa";
const signupButton = document.getElementById("SignUpButton");
const logoutButton = document.getElementById("logoutButton");
const userBadge = document.getElementById('userBadge');
const submitScoreButton = document.getElementById("submitScoreButton");
const scoreInput = document.getElementById("scoreInput");
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
signupButton.addEventListener("click", () => {
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
                alert("Username already taken. Please choose another one.");
            } else {
                const newUser = {
                    username: signUpusername,
                    password: signUppassword,
                };
                fetch('https://hiscoretracker-67e9.restdb.io/rest/accounts', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-apikey": apiKey,
                        "cache-control": "no-cache",
                    },
                    body: JSON.stringify(newUser),
                })
                    .then((res) => {
                        if (!res.ok) throw new Error("Network response was not ok");
                        return res.json();
                    })
                    .then((data) => {
                        alert("Account created successfully!");
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('username', signUpusername);
                        whenLoggedIn();
                    });
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
    updateUserBadge();
    signupButton.style.display = "none";
    Login.style.display = "none";
    logoutButton.style.display = "inline-block";

}
const whenLoggedOut = () => {
    signupButton.style.display = "inline-block";
    Login.style.display = "inline-block";
    logoutButton.style.display = "none";
}
document.addEventListener('DOMContentLoaded', () => {
  updateUserBadge();

  if (localStorage.getItem('isLoggedIn') === 'true') {
    whenLoggedIn();
  }
  else{
    whenLoggedOut();
  }
});
submitScoreButton.addEventListener("click", () => {
    const score = scoreInput.value;
    const username = localStorage.getItem("username");
    if (!username) {
        alert("You must be logged in to submit a score.");
        return;
    }
    const newScore = {
        username: username,
        score: parseInt(score, 10),
    };
    fetch('https://hiscoretracker-67e9.restdb.io/rest/accounts', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-apikey": apiKey,
            "cache-control": "no-cache",
        },
        body: JSON.stringify(newScore),
    })
    .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
    })
    .then((data) => {
        alert("Score submitted successfully!");
        scoreInput.value = "";
    });
});
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    alert("You have been logged out.");
    location.reload();
    });