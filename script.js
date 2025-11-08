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
  const query = encodeURIComponent(JSON.stringify({ username: loginusername, password: loginpassword }));
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
                location.reload();
            } else {
                alert("Incorrect username or password");
            }
        });
});
signupButton.addEventListener("click", () => {
  let signUpusername = prompt("What is your desired username?");
  let signUppassword = prompt("What is your desired password?");
  let userExists = false;
  const query = encodeURIComponent(JSON.stringify({ username: signUpusername }));
    fetch(
        `https://hiscoretracker-67e9.restdb.io/rest/accounts?q=${query}`, {
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
                return;
            } else {
            const newUser = {
                username: signUpusername,
                password: signUppassword,
                highScore: 0,
            };
            return fetch(`https://hiscoretracker-67e9.restdb.io/rest/accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-apikey": apiKey,
                    "cache-control": "no-cache",
                },
                body: JSON.stringify(newUser),
        })
        .then((res) => {
            if (!res) return;
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        })
        .then((data) => {
            alert("Account created successfully!");
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', signUpusername);
            whenLoggedIn();
        })
        .catch((error) => {
            console.error("Error creating account:", error);
            alert("There was an error creating your account. Please try again later.");
        });
    }
})
    .catch((error) => {
        console.error("Error checking username:", error);
        alert("There was an error checking the username. Please try again later.");
    });
});
const updateUserBadge = () => {
  if (!userBadge) return;
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    const storedUsername = localStorage.getItem("username");
    userBadge.textContent = `Hello, ${storedUsername}! Your current high score is ${localStorage.getItem("highScore") || 0}.`;
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
    submitScoreButton.style.display = "none";
    scoreInput.style.display = "none";
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
    const score = parseInt(scoreInput.value, 10);
    const username = localStorage.getItem("username");
    if (!username) {
        alert("You must be logged in to submit a score.");
        return;
    }
    if (Number.isNaN(score)) {
        alert("Please enter a valid score.");
        return;
    }
    const query = encodeURIComponent(JSON.stringify({ username }));
    fetch(`https://hiscoretracker-67e9.restdb.io/rest/accounts?q=${query}`,
        {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "x-apikey": apiKey,
            "cache-control": "no-cache",
        },
    })
    .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
    })
    .then((data) => {
        if (data.length === 0) {
            throw new Error("User not found");
        }
        const user = data[0];
        const id = user._id;
        const currentHighScore = typeof user.highScore === "number" ? user.highScore : 0;
        if (score > currentHighScore) {
            return fetch(`https://hiscoretracker-67e9.restdb.io/rest/accounts/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-apikey": apiKey,
                    "cache-control": "no-cache",
                },
                body: JSON.stringify({ highScore: score }),
            });
        } else {
            alert("Score is not higher than current high score.");
            scoreInput.value = "";
            return null;
        }
    }).then((res) => {
        if (!res) return;
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
    })
    .then((updated) => {
        if (updated) {
            alert(`Your new high score of ${updated.highScore} has been set!`);
            scoreInput.value = "";
        }
    })
    .catch((error) => {
        console.error("Error updating score:", error);
        alert("There was an error submitting your score. Please try again later.");
    });
});
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    alert("You have been logged out.");
    location.reload();
    });