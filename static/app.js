// TeShaN Chat - Legendary WhatsApp Clone with SocketIO
var socket = io();
var username = "{{username}}";
var avatar = "{{avatar}}";
var currentRoom = "general";
var typingTimeout;

// Load private chat users with avatars
async function loadPrivateChatUsers() {
    try {
        const response = await fetch('/get_private_chat_users');
        const data = await response.json();
        
        const privateChatsDiv = document.getElementById("private-chats");
        if (data.users && data.users.length > 0) {
            privateChatsDiv.innerHTML = data.users.map(user => {
                // Check if avatar is a file path (starts with '/') or emoji/text
                const avatarDisplay = user.avatar && user.avatar.startsWith('/') 
                    ? `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                    : (user.avatar || user.username[0].toUpperCase());
                    
                return `
                <div class="private-chat-item" data-user="${user.username}" onclick="switchToPrivateChat('${user.username}')">
                    <div class="private-chat-avatar">${avatarDisplay}</div>
                    <div class="private-chat-info">
                        <div class="private-chat-name">${user.username}</div>
                        <div class="private-chat-last-message">Click to open chat</div>
                    </div>
                    <div class="private-chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
            }).join('');
        } else {
            privateChatsDiv.innerHTML = '<div style="padding: 12px; color: #8696a0; text-align: center;">No private chats yet</div>';
        }
    } catch (error) {
        console.error("Error loading private chat users:", error);
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", function() {
    // Join default room
    socket.emit("join_room", {room: currentRoom});
    
    // Load private chat users
    loadPrivateChatUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Focus on message input
    document.getElementById("msg").focus();
});

function setupEventListeners() {
    // Message input
    const msgInput = document.getElementById("msg");
    msgInput.addEventListener("input", handleTyping);
    msgInput.addEventListener("keypress", handleKeyPress);
    
    // File inputs
    document.getElementById("file_image").addEventListener("change", sendImage);
    document.getElementById("file_voice").addEventListener("change", sendVoice);
    
    // Room switching
    document.querySelectorAll(".room-item").forEach(item => {
        item.addEventListener("click", () => switchRoom(item.dataset.room));
    });
    
    // Private chat switching
    document.querySelectorAll(".private-chat-item").forEach(item => {
        item.addEventListener("click", () => switchToPrivateChat(item.dataset.user));
    });
    
    // User search
    const searchInput = document.getElementById("user-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchUsers(e.target.value);
        });
        
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Escape") {
                hideSearchUsers();
            }
        });
    }
    
    // Close modals on outside click
    window.addEventListener("click", function(event) {
        if (event.target.classList.contains("modal")) {
            event.target.classList.remove("show");
        }
        if (event.target.id !== "emoji-picker" && !event.target.closest(".emoji-picker") && !event.target.closest(".input-button")) {
            document.getElementById("emoji-picker").classList.remove("show");
        }
        if (event.target.id !== "search-users-modal" && !event.target.closest("#search-users-modal") && !event.target.closest(".create-room-btn")) {
            hideSearchUsers();
        }
    });
    
    // Escape key to close modals
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeCreateRoomModal();
            hideSearchUsers();
            document.getElementById("emoji-picker").classList.remove("show");
        }
    });
}

// Room Management
function switchRoom(roomName) {
    // Leave current room
    socket.emit("leave_room", {room: currentRoom});
    
    // Join new room
    currentRoom = roomName;
    document.getElementById("current-room").value = roomName;
    
    // Update UI
    document.querySelectorAll(".room-item").forEach(item => {
        item.classList.remove("active");
    });
    document.querySelectorAll(".private-chat-item").forEach(item => {
        item.classList.remove("active");
    });
    
    const roomElement = document.querySelector(`[data-room="${roomName}"]`);
    if (roomElement) {
        roomElement.classList.add("active");
        document.getElementById("current-room-name").textContent = roomName.charAt(0).toUpperCase() + roomName.slice(1);
        document.getElementById("current-room-avatar").textContent = "💬";
    }
    
    // Clear messages and show loading
    const chatContainer = document.getElementById("chat");
    chatContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    
    // Join room and get history
    socket.emit("join_room", {room: roomName});
}

function switchToPrivateChat(username) {
    // Create private room name
    const privateRoom = `private_${username}`;
    currentRoom = privateRoom;
    document.getElementById("current-room").value = privateRoom;
    
    // Update UI
    document.querySelectorAll(".room-item").forEach(item => {
        item.classList.remove("active");
    });
    document.querySelectorAll(".private-chat-item").forEach(item => {
        item.classList.remove("active");
    });
    
    const privateElement = document.querySelector(`[data-user="${username}"]`);
    if (privateElement) {
        privateElement.classList.add("active");
    }
    
    // Update header
    document.getElementById("current-room-name").textContent = username;
    document.getElementById("current-room-avatar").textContent = username.charAt(0).toUpperCase();
    
    // Clear messages and show loading
    const chatContainer = document.getElementById("chat");
    chatContainer.innerHTML = '<div class="loading-messages">Loading private messages...</div>';
    
    // Join private room
    socket.emit("join_room", {room: privateRoom});
}

function showSearchUsers() {
    const modal = document.getElementById("search-users-modal");
    modal.classList.add("show");
    document.getElementById("user-search-input").focus();
}

function hideSearchUsers() {
    document.getElementById("search-users-modal").classList.remove("show");
    document.getElementById("user-search-input").value = "";
    document.getElementById("search-results").innerHTML = "";
}

async function searchUsers(query) {
    if (!query.trim()) {
        document.getElementById("search-results").innerHTML = "";
        return;
    }
    
    try {
        const response = await fetch(`/search_users?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById("search-results");
        if (data.users && data.users.length > 0) {
            resultsDiv.innerHTML = data.users.map(user => {
                // Check if avatar is a file path (starts with '/') or emoji/text
                const avatarDisplay = user.avatar && user.avatar.startsWith('/') 
                    ? `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                    : (user.avatar || "👤");
                    
                return `
                <div class="search-user-item">
                    <div class="search-user-avatar">${avatarDisplay}</div>
                    <div class="search-user-info">
                        <div class="search-user-name">${user.username}</div>
                        <div class="search-user-status">${user.status}</div>
                    </div>
                    <button class="search-user-action" onclick="startPrivateChat('${user.username}')">
                        Chat
                    </button>
                </div>
            `;
            }).join('');
        } else {
            resultsDiv.innerHTML = '<div style="padding: 12px; color: #8696a0; text-align: center;">No users found</div>';
        }
    } catch (error) {
        console.error("Search error:", error);
    }
}

async function startPrivateChat(username) {
    try {
        const response = await fetch("/create_private_chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: username})
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add to private chats list
            addPrivateChatToList(username);
            
            // Switch to the private chat
            switchToPrivateChat(username);
            
            // Hide search modal
            hideSearchUsers();
        }
    } catch (error) {
        console.error("Error creating private chat:", error);
    }
}

function addPrivateChatToList(username) {
    const privateChatsDiv = document.getElementById("private-chats");
    
    // Check if already exists
    if (document.querySelector(`[data-user="${username}"]`)) {
        return;
    }
    
    const chatItem = document.createElement("div");
    chatItem.className = "private-chat-item";
    chatItem.dataset.user = username;
    chatItem.innerHTML = `
        <div class="private-chat-avatar">${username.charAt(0).toUpperCase()}</div>
        <div class="private-chat-info">
            <div class="private-chat-name">${username}</div>
            <div class="private-chat-last-message">Tap to start chatting</div>
        </div>
        <div class="private-chat-time">Now</div>
    `;
    chatItem.addEventListener("click", () => switchToPrivateChat(username));
    
    privateChatsDiv.appendChild(chatItem);
}

async function loadPrivateChatHistory(username) {
    try {
        const response = await fetch(`/history/private_${username}`);
        const messages = await response.json();
        
        messages.forEach(msg => {
            displayMessage(msg);
        });
    } catch (error) {
        console.error("Error loading private chat history:", error);
    }
}

function showCreateRoomModal() {
    document.getElementById("create-room-modal").classList.add("show");
    document.getElementById("new-room-name").focus();
}

function closeCreateRoomModal() {
    document.getElementById("create-room-modal").classList.remove("show");
    document.getElementById("new-room-name").value = "";
    document.getElementById("private-room").checked = false;
}

function createRoom() {
    const roomName = document.getElementById("new-room-name").value.trim();
    const isPrivate = document.getElementById("private-room").checked;
    
    if (roomName) {
        socket.emit("create_room", {
            room_name: roomName,
            is_private: isPrivate
        });
        closeCreateRoomModal();
    }
}

// Message Functions
function sendText() {
    const msgInput = document.getElementById("msg");
    const message = msgInput.value.trim();
    
    if (message) {
        // Check if this is a private chat
        const isPrivateChat = currentRoom.startsWith('private_');
        const targetUser = isPrivateChat ? currentRoom.replace('private_', '') : null;
        
        socket.emit("send", {
            msg: message,
            room: currentRoom,
            to_user: targetUser,
            file_type: "text",
            is_private: isPrivateChat
        });
        msgInput.value = "";
        msgInput.focus();
        
        // Stop typing indicator
        socket.emit("typing", {
            user: username,
            room: currentRoom,
            is_typing: false
        });
    }
}

function sendImage() {
    const file = document.getElementById("file_image").files[0];
    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        fetch("/upload", {method: "POST", body: formData})
            .then(response => response.text())
            .then(filename => {
                socket.emit("send", {
                    msg: "📷 Image",
                    room: currentRoom,
                    file: filename,
                    file_type: "image"
                });
            })
            .catch(error => console.error("Upload error:", error));
        
        // Reset file input
        document.getElementById("file_image").value = "";
    }
}

function sendVoice() {
    const file = document.getElementById("file_voice").files[0];
    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "voice");
        
        fetch("/upload", {method: "POST", body: formData})
            .then(response => response.text())
            .then(filename => {
                socket.emit("send", {
                    msg: "🎤 Voice Message",
                    room: currentRoom,
                    file: filename,
                    file_type: "voice"
                });
            })
            .catch(error => console.error("Upload error:", error));
        
        // Reset file input
        document.getElementById("file_voice").value = "";
    }
}

function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendText();
    }
}

function handleTyping() {
    // Emit typing indicator
    socket.emit("typing", {
        user: username,
        room: currentRoom,
        is_typing: true
    });
    
    // Clear existing timeout
    clearTimeout(typingTimeout);
    
    // Stop typing after 3 seconds
    typingTimeout = setTimeout(() => {
        socket.emit("typing", {
            user: username,
            room: currentRoom,
            is_typing: false
        });
    }, 3000);
}

// Emoji Picker
function showEmojiPicker() {
    const picker = document.getElementById("emoji-picker");
    picker.classList.toggle("show");
}

function insertEmoji(emoji) {
    const msgInput = document.getElementById("msg");
    msgInput.value += emoji;
    msgInput.focus();
    document.getElementById("emoji-picker").classList.remove("show");
}

// Message Actions
function deleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
        socket.emit("delete", {
            message_id: messageId,
            room: currentRoom
        });
    }
}

function reactToMessage(messageId, emoji) {
    socket.emit("react", {
        message_id: messageId,
        emoji: emoji,
        room: currentRoom
    });
}

function markAsSeen(messageId) {
    socket.emit("seen", {
        message_id: messageId,
        room: currentRoom
    });
}

// UI Helper Functions
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isMenuButton = event.target.classList.contains('back-btn') || event.target.closest('.back-btn');
    
    if (!isClickInsideSidebar && !isMenuButton && sidebar.classList.contains('show')) {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('show');
        }
    }
});

function toggleSearch() {
    // TODO: Implement search functionality
    console.log("Search feature coming soon!");
}

function showRoomInfo() {
    // TODO: Show room information modal
    console.log("Room info feature coming soon!");
}

// Socket Event Listeners
socket.on("connect", function() {
    console.log("Connected to TeShaN Chat server");
    document.getElementById("connection-status").textContent = "🟢 Connected";
});

socket.on("disconnect", function() {
    console.log("Disconnected from server");
    document.getElementById("connection-status").textContent = "🔴 Disconnected";
});

socket.on("receive", function(data) {
    // Ensure we have all required data
    if (!data.username) data.username = "Unknown";
    if (!data.message_id) data.message_id = Date.now().toString();
    if (!data.timestamp) data.timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    if (!data.seen) data.seen = 0;
    if (!data.reaction) data.reaction = "";
    
    displayMessage(data);
    
    // Mark as seen if it's not our message
    if (data.username !== username && data.message_id) {
        setTimeout(() => markAsSeen(data.message_id), 1000);
    }
});

socket.on("online", function(users) {
    updateOnlineUsers(users);
});

socket.on("typing_update", function(data) {
    if (data.user !== username && data.is_typing) {
        const typingDiv = document.getElementById("typing");
        typingDiv.textContent = `${data.user} is typing...`;
        
        clearTimeout(window.typingIndicatorTimeout);
        window.typingIndicatorTimeout = setTimeout(() => {
            typingDiv.textContent = "";
        }, 3000);
    }
});

socket.on("seen_update", function(data) {
    updateSeenTicks(data.message_id, data.seen_by);
});

socket.on("reaction_update", function(data) {
    updateMessageReaction(data.message_id, data.reaction, data.reacted_by);
});

socket.on("delete_update", function(data) {
    animateMessageDeletion(data.message_id);
});

socket.on("room_created", function(data) {
    addRoomToList(data.room_name, data.created_by, data.is_private);
});

// Debounced system messages to prevent spam
var systemMessageTimeouts = {};

socket.on("user_joined_room", function(data) {
    const key = `join_${data.username}_${data.room}`;
    clearTimeout(systemMessageTimeouts[key]);
    systemMessageTimeouts[key] = setTimeout(() => {
        showSystemMessage(`${data.username} joined the room`, "join");
    }, 500);
});

socket.on("user_left_room", function(data) {
    const key = `leave_${data.username}_${data.room}`;
    clearTimeout(systemMessageTimeouts[key]);
    systemMessageTimeouts[key] = setTimeout(() => {
        showSystemMessage(`${data.username} left the room`, "leave");
    }, 500);
});

socket.on("user_connected", function(data) {
    const key = `connect_${data.username}`;
    clearTimeout(systemMessageTimeouts[key]);
    systemMessageTimeouts[key] = setTimeout(() => {
        showSystemMessage(`${data.username} is online`, "connect");
    }, 500);
});

socket.on("user_disconnected", function(data) {
    const key = `disconnect_${data.username}`;
    clearTimeout(systemMessageTimeouts[key]);
    systemMessageTimeouts[key] = setTimeout(() => {
        showSystemMessage(`${data.username} went offline`, "disconnect");
    }, 500);
});

// Display Functions
function displayMessage(data) {
    const messagesContainer = document.getElementById("chat");
    
    // Remove welcome message or loading message if present
    const welcomeMsg = messagesContainer.querySelector(".welcome-message");
    const loadingMsg = messagesContainer.querySelector(".loading-messages");
    if (welcomeMsg) welcomeMsg.remove();
    if (loadingMsg) loadingMsg.remove();
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${data.username === username ? "sent" : "received"}`;
    messageDiv.dataset.messageId = data.message_id;
    
    const isOwnMessage = data.username === username;
    
    let messageHTML = `
        <div class="message-header">
            <span class="message-author">${isOwnMessage ? "You" : data.username}</span>
            <div class="message-actions">
                ${isOwnMessage ? `<button class="message-action-btn" onclick="deleteMessage('${data.message_id}')">🗑️</button>` : ''}
                <button class="message-action-btn" onclick="reactToMessage('${data.message_id}', '❤️')">❤️</button>
                <button class="message-action-btn" onclick="reactToMessage('${data.message_id}', '👍')">👍</button>
                <button class="message-action-btn" onclick="reactToMessage('${data.message_id}', '😂')">😂</button>
            </div>
        </div>
        <div class="message-content">${data.msg || data.message || 'No content'}</div>
    `;
    
    // Add file content if present
    if (data.file_type === "image" && data.file) {
        messageHTML += `<img src="/static/uploads/images/${data.file}" class="message-image" alt="Image" onclick="window.open(this.src)">`;
    } else if (data.file_type === "voice" && data.file) {
        messageHTML += `<audio controls class="message-audio" src="/static/uploads/voices/${data.file}"></audio>`;
    }
    
    // Add timestamp and seen ticks
    messageHTML += `
        <div class="message-time">
            ${data.timestamp}
            ${isOwnMessage ? `<span class="seen-ticks ${data.seen ? 'double' : 'single'}"></span>` : ''}
        </div>
    `;
    
    // Add reaction if present
    if (data.reaction) {
        messageHTML += `<div class="message-reactions">
            <span class="reaction">${data.reaction}</span>
        </div>`;
    }
    
    messageDiv.innerHTML = messageHTML;
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add entrance animation
    setTimeout(() => {
        messageDiv.style.opacity = "1";
        messageDiv.style.transform = "translateY(0)";
    }, 10);
}

function updateOnlineUsers(users) {
    const onlineUsersDiv = document.getElementById("online-users");
    const onlineCountSpan = document.getElementById("online-count");
    const roomUsersCount = document.getElementById("room-users-count");
    
    onlineCountSpan.textContent = users.length;
    roomUsersCount.textContent = users.length;
    
    onlineUsersDiv.innerHTML = users.map(user => {
        // Check if avatar is a file path (starts with '/') or emoji/text
        const avatarDisplay = user.avatar && user.avatar.startsWith('/') 
            ? `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
            : (user.avatar || "👤");
            
        return `
        <div class="chat-item">
            <div class="chat-avatar">${avatarDisplay}</div>
            <div class="chat-info">
                <div class="chat-name">${user.name}</div>
                <div class="chat-last-message">🟢 Online</div>
            </div>
            <div class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `;
    }).join('');
}

function updateSeenTicks(messageId, seenBy) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        const seenTicks = messageDiv.querySelector(".seen-ticks");
        if (seenTicks) {
            seenTicks.classList.remove("single");
            seenTicks.classList.add("double");
        }
    }
}

function updateMessageReaction(messageId, reaction, reactedBy) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        let reactionsDiv = messageDiv.querySelector(".message-reactions");
        if (!reactionsDiv) {
            reactionsDiv = document.createElement("div");
            reactionsDiv.className = "message-reactions";
            messageDiv.appendChild(reactionsDiv);
        }
        
        reactionsDiv.innerHTML = `<span class="reaction">${reaction}</span>`;
    }
}

function animateMessageDeletion(messageId) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        messageDiv.classList.add("deleting");
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }
}

function addRoomToList(roomName, createdBy, isPrivate) {
    const roomList = document.getElementById("room-list");
    const roomItem = document.createElement("div");
    roomItem.className = "room-item";
    roomItem.dataset.room = roomName;
    roomItem.innerHTML = `
        <div class="room-avatar">${isPrivate ? "🔒" : "💬"}</div>
        <div class="room-info">
            <div class="room-name">${roomName}</div>
            <div class="room-last-message">Created by ${createdBy}</div>
        </div>
    `;
    roomItem.addEventListener("click", () => switchRoom(roomName));
    roomList.appendChild(roomItem);
}

function showSystemMessage(message, type) {
    const messagesContainer = document.getElementById("chat");
    const systemDiv = document.createElement("div");
    systemDiv.className = "system-message";
    systemDiv.innerHTML = `<div class="system-text">${message}</div>`;
    messagesContainer.appendChild(systemDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add system message styles
const systemStyles = `
    .system-message {
        text-align: center;
        margin: 10px 0;
        opacity: 0.7;
    }
    .system-text {
        background: #202c33;
        color: #8696a0;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        display: inline-block;
    }
`;

// Inject system styles
const styleSheet = document.createElement("style");
styleSheet.textContent = systemStyles;
document.head.appendChild(styleSheet);
