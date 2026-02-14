// --- Configuration ---
const apiKey = "68ea8f1c7f34ed3b0c200aaa";
const dbUrl = "https://hiscoretracker-67e9.restdb.io/rest/accounts";

// --- Handle browser extension messages to prevent runtime errors ---
// Some browser extensions try to communicate with web pages
// This listener prevents "Unchecked runtime.lastError" console errors
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        // Silently ignore extension messages - don't respond
        // This prevents "receiving end does not exist" errors without interfering
        return false;
    });
}

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

    const fullUrl = `${dbUrl}${endpoint}`;
    console.log(`[dbFetch] ${method} ${fullUrl}`, body ? { body } : '');
    
    const response = await fetch(fullUrl, options);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[dbFetch] API Error: ${response.status} ${response.statusText}`, {
            url: fullUrl,
            method,
            body,
            responseBody: errorText
        });
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log(`[dbFetch] Response:`, data);
    return data;
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
        if (logoutButton) logoutButton.style.display = "block";
        if (submitScoreButton) submitScoreButton.style.display = "block";
        if (scoreInput) scoreInput.style.display = "block";
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

    console.log(`[loadFriends] Loading friends for user: ${username}`);

    try {
        const query = encodeURIComponent(JSON.stringify({ username: username }));
        const data = await dbFetch(`?q=${query}&deref=friends&h={"$fields": {"friends": 1}}`);
        
        if (data.length === 0) {
            console.warn(`[loadFriends] No user found with username: ${username}`);
            friendTableBody.innerHTML = "";
            return;
        }

        const user = data[0];
        const friends = Array.isArray(user.friends) ? user.friends : [];
        console.log(`[loadFriends] Found ${friends.length} friends:`, friends);

        friendTableBody.innerHTML = "";
        
        for (const friend of friends) {
            // Handle both dereferenced objects and plain IDs
            let friendId, friendName, friendHighScore;
            if (typeof friend === 'object' && friend !== null) {
                friendId = friend._id;
                friendName = friend.username || friend._id;
                friendHighScore = friend.highScore || 0;
                console.log(`[loadFriends] Processing dereferenced friend object:`, { friendId, friendName, friendHighScore, raw: friend });
            } else {
                friendId = friend;
                // Need to fetch friend details to get username and high score
                try {
                    const friendData = await dbFetch(`/${friendId}`);
                    friendName = friendData.username || friendId;
                    friendHighScore = friendData.highScore || 0;
                    console.log(`[loadFriends] Fetched friend details:`, { friendId, friendName, friendHighScore });
                } catch (err) {
                    console.error(`[loadFriends] Failed to fetch details for friend ${friendId}:`, err);
                    friendName = friendId; // Fallback to ID if fetch fails
                    friendHighScore = 0;
                }
            }

            const row = document.createElement("tr");
            
            const nameCell = document.createElement("td");
            nameCell.textContent = friendName;
            row.appendChild(nameCell);
            
            const scoreCell = document.createElement("td");
            scoreCell.textContent = friendHighScore;
            row.appendChild(scoreCell);
            
            const removeCell = document.createElement("td");
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", () => removeFriend(friendId));
            removeCell.appendChild(removeButton);
            row.appendChild(removeCell);
            
            friendTableBody.appendChild(row);
        }
        console.log(`[loadFriends] Successfully loaded ${friends.length} friends`);
    } catch (error) {
        console.error(`[loadFriends] Failed to load friends for user ${username}:`, error);
    }
};

const removeFriend = async (friendId) => {
    const username = localStorage.getItem("username");
    if (!username) {
        console.warn(`[removeFriend] Cannot remove friend - no user logged in`);
        return;
    }

    console.log(`[removeFriend] Attempting to remove friend with ID: ${friendId} for user: ${username}`);

    try {
        const query = encodeURIComponent(JSON.stringify({ username: username }));
        const data = await dbFetch(`?q=${query}`);
        
        if (data.length === 0) {
            console.error(`[removeFriend] User not found: ${username}`);
            return;
        }

        const me = data[0];
        const currentFriends = Array.isArray(me.friends) ? me.friends : [];
        console.log(`[removeFriend] Current friends before removal:`, currentFriends);
        
        // Filter out the friend by ID (handle both objects and plain IDs)
        const updatedFriends = currentFriends
            .map(f => (typeof f === 'object' && f !== null) ? f._id : f)
            .filter(id => id !== friendId);

        console.log(`[removeFriend] Updated friends list (removing ${friendId}):`, updatedFriends);

        await dbFetch(`/${me._id}`, "PATCH", { friends: updatedFriends });

        console.log(`[removeFriend] Successfully removed friend ${friendId}`);
        alert(`Friend removed!`);
        location.reload();
    } catch (error) {
        console.error(`[removeFriend] Failed to remove friend ${friendId} for user ${username}:`, error);
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
                location.reload();
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
            location.reload();

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
                location.reload();
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

        console.log(`[addFriend] Attempting to add friend "${friendName}" for user "${loggedInUser}"`);

        try {
            // Step 1: Check if friend exists in DB
            console.log(`[addFriend] Step 1: Looking up friend "${friendName}" in database`);
            const friendQuery = encodeURIComponent(JSON.stringify({ username: friendName }));
            const friendData = await dbFetch(`?q=${friendQuery}`);
            
            if (friendData.length === 0) {
                console.warn(`[addFriend] Friend not found: "${friendName}"`);
                return alert("User not found.");
            }

            const friendRecord = friendData[0];
            const friendId = friendRecord._id;
            console.log(`[addFriend] Found friend:`, { username: friendName, id: friendId });

            // Step 2: Get my own user data
            console.log(`[addFriend] Step 2: Fetching current user data for "${loggedInUser}"`);
            const myQuery = encodeURIComponent(JSON.stringify({ username: loggedInUser }));
            const myData = await dbFetch(`?q=${myQuery}`);
            
            if (myData.length === 0) {
                console.error(`[addFriend] Current user not found in database: "${loggedInUser}"`);
                return;
            }

            const me = myData[0];
            const currentFriends = Array.isArray(me.friends) ? me.friends : [];
            console.log(`[addFriend] Current friends list:`, currentFriends);

            // Step 3: Check duplicates (compare by ID)
            console.log(`[addFriend] Step 3: Checking for duplicates`);
            const friendIds = currentFriends.map(f => 
                (typeof f === 'object' && f !== null) ? f._id : f
            );
            console.log(`[addFriend] Normalized friend IDs:`, friendIds);
            
            if (friendIds.includes(friendId)) {
                console.warn(`[addFriend] Duplicate friend detected: ${friendId}`);
                return alert("You already added this friend.");
            }

            // Step 4: Update friend list with the friend's _id
            const updatedFriends = [...friendIds, friendId];
            console.log(`[addFriend] Step 4: Updating friends list:`, updatedFriends);
            
            await dbFetch(`/${me._id}`, "PATCH", { friends: updatedFriends });
            
            console.log(`[addFriend] Successfully added friend "${friendName}" (${friendId})`);
            alert("Friend added!");
            location.reload();

        } catch (error) {
            console.error(`[addFriend] Failed to add friend "${friendName}" for user "${loggedInUser}":`, error);
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
        location.reload();
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateUIState();
});
