// --- Configuration ---
const apiKey = "68ea8f1c7f34ed3b0c200aaa";
const dbUrl = "https://hiscoretracker-67e9.restdb.io/rest/accounts";

// --- DOM Elements ---
const loginButton = document.getElementById("LoginButton");
const signupButton = document.getElementById("SignUpButton");
const logoutButton = document.getElementById("logoutButton");
const userBadge = document.getElementById('userBadge');
const submitScoreButton = document.getElementById("submitScoreButton");
const scoreInput = document.getElementById("scoreInput");
const addFriendButton = document.getElementById("addFriend");
const friendInput = document.getElementById("friendInput");

// --- Helper Function for API Calls ---
async function dbFetch(endpoint = "", method = "GET", body = null) {
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "x-apikey": apiKey,
            "cache-control": "no-cache",
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${dbUrl}${endpoint}`, options);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
}

// --- UI Helper Functions ---
const updateUserBadge = async () => {
    if (!userBadge) return;
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (isLoggedIn) {
        const storedUsername = localStorage.getItem("username");
        const query = encodeURIComponent(JSON.stringify({ username: storedUsername }));

        try {
            const data = await dbFetch(`?q=${query}`);
            if (data.length === 0) throw new Error("User not found");

            const user = data[0];
            const currentHighScore = user.highScore || 0;
            localStorage.setItem("highScore", currentHighScore);
            userBadge.textContent = `Hello, ${storedUsername}! Your current high score is ${currentHighScore}.`;
        } catch (err) {
            console.error("Error updating badge:", err);
            userBadge.textContent = "Error loading profile";
        }
    } else {
        userBadge.textContent = "Not logged in";
    }
};

const updateUIState = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Use optional chaining (?.) in case elements don't exist on the page
    if (isLoggedIn) {
        if (signupButton) signupButton.style.display = "none";
        if (loginButton) loginButton.style.display = "none";
        if (logoutButton) logoutButton.style.display = "inline-block";
        if (submitScoreButton) submitScoreButton.style.display = "inline-block";
        if (scoreInput) scoreInput.style.display = "inline-block";
        updateUserBadge();
        loadFriends();
    } else {
        if (signupButton) signupButton.style.display = "inline-block";
        if (loginButton) loginButton.style.display = "inline-block";
        if (logoutButton) logoutButton.style.display = "none";
        if (submitScoreButton) submitScoreButton.style.display = "none";
        if (scoreInput) scoreInput.style.display = "none";
        if (userBadge) userBadge.textContent = "Not logged in";
    }
};

const loadFriends = async () => {
    const friendTableBody = document.getElementById("friendTableBody");
    if (!friendTableBody) return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
        friendTableBody.innerHTML = "";
        return;
    }

    const username = localStorage.getItem("username");
    if (!username) return;

    try {
        const query = encodeURIComponent(JSON.stringify({ username: username }));
        const data = await dbFetch(`?q=${query}`);
        
        if (data.length === 0) {
            friendTableBody.innerHTML = "";
            return;
        }

        const user = data[0];
        const friends = Array.isArray(user.friends) ? user.friends : [];

        friendTableBody.innerHTML = "";
        
        friends.forEach(friendName => {
            const row = document.createElement("tr");
            
            const nameCell = document.createElement("td");
            nameCell.textContent = friendName;
            row.appendChild(nameCell);
            
            const removeCell = document.createElement("td");
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", () => removeFriend(friendName));
            removeCell.appendChild(removeButton);
            row.appendChild(removeCell);
            
            friendTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading friends:", error);
    }
};

const removeFriend = async (friendName) => {
    const username = localStorage.getItem("username");
    if (!username) return;

    try {
        const query = encodeURIComponent(JSON.stringify({ username: username }));
        const data = await dbFetch(`?q=${query}`);
        
        if (data.length === 0) return;

        const me = data[0];
        const currentFriends = Array.isArray(me.friends) ? me.friends : [];
        const updatedFriends = currentFriends.filter(f => f !== friendName);

        await dbFetch(`/${me._id}`, "PUT", {
            username: me.username,
            password: me.password,
            highScore: me.highScore || 0,
            friends: updatedFriends
        });

        alert("Friend removed!");
        loadFriends();
    } catch (error) {
        console.error("Error removing friend:", error);
        alert("Error removing friend.");
    }
};

// --- Event Listeners ---

// 1. Login Logic
if (loginButton) {
    loginButton.addEventListener("click", async () => {
        const username = prompt("What is your username?");
        const password = prompt("What is your password?");
        if (!username || !password) return;

        const query = encodeURIComponent(JSON.stringify({ username: username, password: password }));

        try {
            const data = await dbFetch(`?q=${query}`);
            if (data.length > 0) {
                alert("Login successful!");
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', username);
                updateUIState();
                // Optional: location.reload() if you really need to refresh
            } else {
                alert("Incorrect username or password");
            }
        } catch (error) {
            console.error(error);
            alert("Login failed due to network error.");
        }
    });
}

// 2. Signup Logic
if (signupButton) {
    signupButton.addEventListener("click", async () => {
        const username = prompt("What is your desired username?");
        const password = prompt("What is your desired password?");
        if (!username || !password) return;

        const query = encodeURIComponent(JSON.stringify({ username: username }));

        try {
            // Check if user exists
            const existingUsers = await dbFetch(`?q=${query}`);
            if (existingUsers.length > 0) {
                alert("Username already taken. Please choose another one.");
                return;
            }

            // Create new user
            const newUser = {
                username: username,
                password: password,
                highScore: 0,
                friends: []
            };

            await dbFetch("", "POST", newUser);
            alert("Account created successfully!");
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            updateUIState();

        } catch (error) {
            console.error("Signup Error:", error);
            alert("Error creating account.");
        }
    });
}

// 3. Submit Score Logic
if (submitScoreButton) {
    submitScoreButton.addEventListener("click", async () => {
        const score = parseInt(scoreInput.value, 10);
        const username = localStorage.getItem("username");

        if (!username) return alert("You must be logged in.");
        if (Number.isNaN(score)) return alert("Please enter a valid number.");

        const query = encodeURIComponent(JSON.stringify({ username: username }));

        try {
            const data = await dbFetch(`?q=${query}`);
            if (data.length === 0) throw new Error("User not found");

            const user = data[0];
            const currentHighScore = user.highScore || 0;

            if (score > currentHighScore) {
                await dbFetch(`/${user._id}`, "PATCH", { highScore: score });
                alert(`New High Score: ${score}!`);
                scoreInput.value = "";
                updateUserBadge(); // Update badge immediately without reload
            } else {
                alert(`Score ${score} is not higher than your best (${currentHighScore}).`);
                scoreInput.value = "";
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting score.");
        }
    });
}

// 4. Add Friend Logic
if (addFriendButton) {
    addFriendButton.addEventListener("click", async () => {
        const loggedInUser = localStorage.getItem("username");
        if (!loggedInUser) return alert("You must be logged in.");

        const friendName = friendInput.value.trim();
        if (!friendName) return;
        if (friendName === loggedInUser) return alert("You can't add yourself.");

        try {
            // Step 1: Check if friend exists in DB
            const friendQuery = encodeURIComponent(JSON.stringify({ username: friendName }));
            const friendData = await dbFetch(`?q=${friendQuery}`);
            
            if (friendData.length === 0) return alert("User not found.");

            // Step 2: Get my own user data
            const myQuery = encodeURIComponent(JSON.stringify({ username: loggedInUser }));
            const myData = await dbFetch(`?q=${myQuery}`);
            
            if (myData.length === 0) return; // Should not happen if logged in

            const me = myData[0];
            const currentFriends = Array.isArray(me.friends) ? me.friends : [];

            // Step 3: Check duplicates
            if (currentFriends.includes(friendName)) {
                return alert("You already added this friend.");
            }

            // Step 4: Update friend list
            currentFriends.push(friendName);
            await dbFetch(`/${me._id}`, "PUT", {
                username: me.username,
                password: me.password,
                highScore: me.highScore || 0,
                friends: currentFriends
            });
            
            alert("Friend added!");
            friendInput.value = "";
            loadFriends();

        } catch (error) {
            console.error(error);
            alert("Error adding friend.");
        }
    });
}

// 5. Logout Logic
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        alert("You have been logged out.");
        updateUIState();
        // location.reload(); // clear page state if needed
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateUIState();
});
