from flask import Flask, render_template, request, redirect, session, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import sqlite3, os, datetime, uuid, hashlib
from werkzeug.utils import secure_filename
import base64
from cryptography.fernet import Fernet

app = Flask(__name__)
app.secret_key = "teshan_supersecret_key_2024"
socketio = SocketIO(app, async_mode="threading", manage_session=False)

# Upload directories
UPLOAD_IMAGE = "static/uploads/images"
UPLOAD_VOICE = "static/uploads/voices"
UPLOAD_AVATARS = "static/uploads/avatars"
os.makedirs(UPLOAD_IMAGE, exist_ok=True)
os.makedirs(UPLOAD_VOICE, exist_ok=True)
os.makedirs(UPLOAD_AVATARS, exist_ok=True)

# Encryption key
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

# Online users tracking
online_users = {}
user_rooms = {}

# ------------------- DATABASE -------------------
def init_db():
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    # Users table with registration fields
    c.execute("""
    CREATE TABLE IF NOT EXISTS users(
        username TEXT PRIMARY KEY,
        password TEXT,
        email TEXT,
        avatar TEXT DEFAULT 'default.png',
        last_seen TEXT,
        status TEXT DEFAULT 'online',
        created_at TEXT,
        updated_at TEXT,
        is_active INTEGER DEFAULT 1
    )
    """)
    
    # Messages table with all legendary features
    c.execute("""
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        message TEXT,
        room TEXT,
        to_user TEXT,
        file TEXT,
        file_type TEXT,
        seen INTEGER DEFAULT 0,
        reaction TEXT,
        timestamp TEXT,
        message_id TEXT UNIQUE,
        deleted INTEGER DEFAULT 0,
        is_private INTEGER DEFAULT 0
    )
    """)
    
    # Rooms table for room management
    c.execute("""
    CREATE TABLE IF NOT EXISTS rooms(
        room_name TEXT PRIMARY KEY,
        created_by TEXT,
        created_at TEXT,
        is_private INTEGER DEFAULT 0
    )
    """)
    
    # Private chats table
    c.execute("""
    CREATE TABLE IF NOT EXISTS private_chats(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1 TEXT,
        user2 TEXT,
        created_at TEXT,
        last_message TEXT,
        last_message_time TEXT,
        is_active INTEGER DEFAULT 1,
        UNIQUE(user1, user2)
    )
    """)
    
    conn.commit()
    conn.close()

init_db()

# ------------------- HELPER FUNCTIONS -------------------
def encrypt_data(data):
    """Encrypt sensitive data before storing"""
    if isinstance(data, str):
        data = data.encode()
    return cipher_suite.encrypt(data).decode()

def decrypt_data(encrypted_data):
    """Decrypt sensitive data from database"""
    if isinstance(encrypted_data, str):
        encrypted_data = encrypted_data.encode()
    return cipher_suite.decrypt(encrypted_data).decode()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hashlib.sha256(password.encode()).hexdigest() == hashed

def user_exists(username):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT username FROM users WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    return result is not None

def email_exists(email):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT email FROM users WHERE email=?", (email,))
    result = c.fetchone()
    conn.close()
    return result is not None

def register_user(username, password, email, avatar):
    if user_exists(username):
        return False, "Username already exists"
    if email_exists(email):
        return False, "Email already exists"
    
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        INSERT INTO users(username, password, email, avatar, created_at)
        VALUES(?, ?, ?, ?, ?)
    """, (username, hash_password(password), encrypt_data(email), avatar, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()
    return True, "Registration successful"

def authenticate_user(username, password):
    try:
        conn = sqlite3.connect("users.db")
        c = conn.cursor()
        c.execute("SELECT password, avatar FROM users WHERE username=? AND is_active=1", (username,))
        result = c.fetchone()
        conn.close()
        
        print(f"DEBUG: User lookup - Username: '{username}', Found: {result is not None}")
        
        if result:
            stored_password, avatar = result
            print(f"DEBUG: Stored password type: {type(stored_password)}, Avatar: {avatar}")
            
            if stored_password and verify_password(password, stored_password):
                print(f"DEBUG: Password verification successful")
                return True, avatar
            else:
                print(f"DEBUG: Password verification failed")
        else:
            print(f"DEBUG: User not found in database")
            
        return False, None
    except Exception as e:
        print(f"DEBUG: Authentication error - {str(e)}")
        return False, None

def get_user_avatar(username):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT avatar FROM users WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else "default.png"

def get_user_profile(username):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT username, avatar, created_at, status FROM users WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return {
            "username": result[0],
            "avatar": result[1],
            "created_at": result[2],
            "status": result[3]
        }
    return None

def update_user_profile(username, new_username=None, new_password=None, new_avatar=None):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    updates = []
    params = []
    
    if new_username and new_username != username:
        # Check if new username already exists
        if user_exists(new_username):
            conn.close()
            return False, "Username already exists"
        updates.append("username=?")
        params.append(new_username)
    
    if new_password:
        updates.append("password=?")
        params.append(hash_password(new_password))
    
    if new_avatar:
        updates.append("avatar=?")
        params.append(new_avatar)
    
    if updates:
        updates.append("updated_at=?")
        params.append(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        params.append(username)  # WHERE clause
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE username=?"
        c.execute(query, params)
        conn.commit()
    
    conn.close()
    return True, "Profile updated successfully"

def clear_user_chats(username):
    """Mark all messages from/to user as deleted"""
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    # Mark sent messages as deleted
    c.execute("UPDATE messages SET deleted=1 WHERE username=?", (username,))
    
    # Mark received messages as deleted
    c.execute("UPDATE messages SET deleted=1 WHERE to_user=?", (username,))
    
    conn.commit()
    conn.close()
    return True

def get_user_avatar(username):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT avatar FROM users WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else "default.png"

def get_private_chat_users_list(username):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        SELECT DISTINCT user1, user2 FROM private_chats 
        WHERE (user1=? OR user2=?) AND is_active=1
    """, (username, username))
    chats = c.fetchall()
    conn.close()
    
    users = []
    for user1, user2 in chats:
        other_user = user2 if user1 == username else user1
        users.append(other_user)
    
    return users

def create_private_chat(user1, user2):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO private_chats(user1, user2, created_at)
            VALUES(?, ?, ?)
        """, (user1, user2, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # Chat already exists
    finally:
        conn.close()

def update_user_status(username, status="online"):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        UPDATE users SET last_seen=?, status=? WHERE username=?
    """, (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), status, username))
    conn.commit()
    conn.close()

def get_message_history(room, limit=50):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        SELECT username, message, room, to_user, file, file_type, seen, reaction, timestamp, message_id, is_private
        FROM messages 
        WHERE room=? AND deleted=0 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (room, limit))
    messages = c.fetchall()
    conn.close()
    
    # Decrypt messages for display
    decrypted_messages = []
    for msg in messages:
        try:
            decrypted_message = decrypt_data(msg[1]) if msg[1] else msg[1]
            decrypted_messages.append((msg[0], decrypted_message, msg[2], msg[3], msg[4], msg[5], msg[6], msg[7], msg[8], msg[9], msg[10]))
        except Exception as e:
            # If decryption fails, return original message
            decrypted_messages.append(msg)
    
    return decrypted_messages

# ------------------- ROUTES -------------------
@app.route("/")
def home():
    return render_template("login.html")

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/loading")
def loading():
    return render_template("loading.html")

@app.route("/register", methods=["POST"])
def handle_register():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    email = request.form.get("email", "").strip()
    avatar = request.form.get("avatar", "👤")
    
    if not username or not password or not email:
        return render_template("register.html", error="All fields are required")
    
    if len(password) < 6:
        return render_template("register.html", error="Password must be at least 6 characters")
    
    success, message = register_user(username, password, email, avatar)
    
    if success:
        return render_template("login.html", success="Registration successful! Please login.")
    else:
        return render_template("register.html", error=message)

@app.route("/login", methods=["POST"])
def login():
    try:
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        print(f"DEBUG: Login attempt - Username: '{username}', Password provided: {'Yes' if password else 'No'}")
        
        if not username or not password:
            print("DEBUG: Missing username or password")
            return render_template("login.html", error="Username and password are required")
        
        success, avatar = authenticate_user(username, password)
        print(f"DEBUG: Authentication result - Success: {success}, Avatar: {avatar}")
        
        if success:
            session["username"] = username
            session["avatar"] = avatar or "👤"
            session["user_id"] = str(uuid.uuid4())
            
            print(f"DEBUG: Session created - Username: {session['username']}, Avatar: {session['avatar']}")
            
            # Update user status
            update_user_status(username, "online")
            
            print("DEBUG: Redirecting to /loading")
            return redirect("/loading")
        else:
            print("DEBUG: Authentication failed")
            return render_template("login.html", error="Invalid username or password")
    except Exception as e:
        print(f"DEBUG: Login error - {str(e)}")
        return render_template("login.html", error="Login failed. Please try again.")

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect("/")
    
    # Get available rooms
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT room_name FROM rooms")
    rooms = [row[0] for row in c.fetchall()]
    conn.close()
    
    # Get private chat users
    private_users = get_private_chat_users_list(session["username"])
    
    return render_template("chat.html", 
                         username=session["username"], 
                         avatar=session["avatar"],
                         rooms=rooms,
                         private_users=private_users)

@app.route("/profile")
def profile():
    if "username" not in session:
        return redirect("/")
    
    user_profile = get_user_profile(session["username"])
    return render_template("profile.html", profile=user_profile)

@app.route("/update_profile", methods=["POST"])
def update_profile():
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    try:
        username = session["username"]
        new_username = request.form.get("username", "").strip()
        new_password = request.form.get("password", "")
        new_avatar = request.form.get("avatar", "")
        
        # Handle avatar upload
        if "avatar_file" in request.files:
            avatar_file = request.files["avatar_file"]
            if avatar_file and avatar_file.filename:
                filename = secure_filename(f"{username}_avatar_{avatar_file.filename}")
                avatar_path = os.path.join(UPLOAD_AVATARS, filename)
                avatar_file.save(avatar_path)
                new_avatar = f"/static/uploads/avatars/{filename}"
        
        success, message = update_user_profile(username, new_username if new_username else None, 
                                              new_password if new_password else None, 
                                              new_avatar if new_avatar else None)
        
        if success:
            # Update session if username changed
            if new_username and new_username != username:
                session["username"] = new_username
                session["avatar"] = new_avatar or session.get("avatar", "default.png")
        
        return jsonify({"success": success, "message": message})
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route("/clear_chats", methods=["POST"])
def clear_chats():
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    username = session["username"]
    success = clear_user_chats(username)
    
    if success:
        return jsonify({"success": True, "message": "All chats cleared successfully"})
    else:
        return jsonify({"success": False, "message": "Failed to clear chats"})

@app.route("/logout")
def logout():
    if "username" in session:
        update_user_status(session["username"], "offline")
        session.clear()
    return redirect("/")

@app.route("/upload", methods=["POST"])
def upload_file():
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    f = request.files["file"]
    file_type = request.form.get("type", "image")
    
    if f:
        # Generate unique filename
        filename = f"{uuid.uuid4()}_{f.filename}"
        
        if file_type == "voice":
            path = os.path.join(UPLOAD_VOICE, filename)
            f.save(path)
        else:
            path = os.path.join(UPLOAD_IMAGE, filename)
            f.save(path)
        
        return filename
    
    return "Error uploading file", 400

@app.route("/history/<room>")
def get_history(room):
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    messages = get_message_history(room)
    history = []
    
    for msg in reversed(messages):
        history.append({
            "username": msg[0],
            "message": msg[1],
            "room": msg[2],
            "to_user": msg[3],
            "file": msg[4],
            "file_type": msg[5],
            "seen": msg[6],
            "reaction": msg[7],
            "timestamp": msg[8],
            "message_id": msg[9]
        })
    
    return jsonify(history)

@app.route("/create_private_chat", methods=["POST"])
def create_private_chat_route():
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    current_user = session["username"]
    other_user = request.json.get("username")
    
    if not other_user or other_user == current_user:
        return jsonify({"error": "Invalid user"}), 400
    
    if not user_exists(other_user):
        return jsonify({"error": "User does not exist"}), 404
    
    success = create_private_chat(current_user, other_user)
    
    if success:
        return jsonify({"success": True, "message": f"Private chat with {other_user} created"})
    else:
        return jsonify({"success": True, "message": "Private chat already exists"})

@app.route("/get_private_chat_users")
def get_private_chat_users():
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    current_user = session["username"]
    
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    # Get users from private chats where current user is involved
    c.execute("""
        SELECT DISTINCT u.username, u.avatar, u.status
        FROM users u
        INNER JOIN private_chats pc ON (u.username = pc.user1 OR u.username = pc.user2)
        WHERE (pc.user1 = ? OR pc.user2 = ?) AND u.username != ? AND u.is_active = 1 AND pc.is_active = 1
    """, (current_user, current_user, current_user))
    
    users = c.fetchall()
    conn.close()
    
    return jsonify({
        "users": [{"username": row[0], "avatar": row[1], "status": row[2]} for row in users]
    })

@app.route("/search_users")
def search_users():
    if "username" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    query = request.args.get("q", "").strip()
    current_user = session["username"]
    
    if not query:
        return jsonify({"users": []})
    
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        SELECT username, avatar, status FROM users 
        WHERE username LIKE ? AND username != ? AND is_active=1
        LIMIT 10
    """, (f"%{query}%", current_user))
    users = c.fetchall()
    conn.close()
    
    return jsonify({
        "users": [{"username": row[0], "avatar": row[1], "status": row[2]} for row in users]
    })

# ------------------- SOCKET EVENTS -------------------
@socketio.on("connect")
def handle_connect():
    username = session.get("username")
    if username:
        online_users[request.sid] = {
            "name": username, 
            "avatar": session.get("avatar", "default.png"),
            "status": "online"
        }
        update_user_status(username, "online")
        emit("online", list(online_users.values()), broadcast=True)
        emit("user_connected", {"username": username}, broadcast=True)

@socketio.on("disconnect")
def handle_disconnect():
    user_data = online_users.pop(request.sid, None)
    if user_data:
        username = user_data["name"]
        update_user_status(username, "offline")
        emit("online", list(online_users.values()), broadcast=True)
        emit("user_disconnected", {"username": username}, broadcast=True)

@socketio.on("join_room")
def handle_join_room(data):
    room = data.get("room", "general")
    username = session.get("username")
    
    if username:
        join_room(room)
        user_rooms[request.sid] = room
        
        # For private chats, ensure both users are in the room
        if room.startswith("private_"):
            target_user = room.replace("private_", "")
            # Find the target user's session and join them to the room
            for sid, user_data in online_users.items():
                if user_data["name"] == target_user:
                    # The target user will join when they switch to this chat
                    pass
        
        # Send message history to the user
        history = get_message_history(room)
        for msg in reversed(history):
            emit("receive", {
                "username": msg[0],
                "message": msg[1],
                "room": msg[2],
                "to_user": msg[3],
                "file": msg[4],
                "file_type": msg[5],
                "seen": msg[6],
                "reaction": msg[7],
                "timestamp": msg[8],
                "message_id": msg[9],
                "is_private": msg[10] if len(msg) > 10 else False
            })
        
        # Notify others
        emit("user_joined_room", {
            "username": username,
            "room": room
        }, room=room, include_self=False)

@socketio.on("leave_room")
def handle_leave_room(data):
    room = data.get("room", "general")
    username = session.get("username")
    
    if username and request.sid in user_rooms:
        leave_room(room)
        emit("user_left_room", {
            "username": username,
            "room": room
        }, room=room, include_self=False)
        del user_rooms[request.sid]

@socketio.on("send")
def handle_send(data):
    username = session["username"]
    room = data.get("room", "general")
    to_user = data.get("to_user")
    is_private = data.get("is_private", False)
    message_id = str(uuid.uuid4())
    ts = datetime.datetime.now().strftime("%H:%M")
    
    # Encrypt message content before storing
    encrypted_message = encrypt_data(data["msg"])
    
    # Save to database
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        INSERT INTO messages(username, message, room, to_user, file, file_type, 
                           seen, reaction, timestamp, message_id, is_private)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (username, encrypted_message, room, to_user, data.get("file"), 
          data.get("file_type", "text"), 0, "", ts, message_id, is_private))
    conn.commit()
    conn.close()
    
    # Broadcast message (send original unencrypted message for display)
    message_data = {
        **data,
        "user": username,
        "timestamp": ts,
        "message_id": message_id,
        "seen": 0,
        "reaction": "",
        "is_private": is_private
    }
    
    if is_private and to_user:
        # Private message - send to both users in the private room
        emit("receive", message_data, room=room)
    else:
        # Room message
        emit("receive", message_data, room=room)

@socketio.on("seen")
def handle_seen(data):
    username = session["username"]
    message_id = data.get("message_id")
    
    # Update seen status in database
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("UPDATE messages SET seen=1 WHERE message_id=?", (message_id,))
    conn.commit()
    conn.close()
    
    # Broadcast seen update
    emit("seen_update", {
        "message_id": message_id,
        "seen_by": username,
        "timestamp": datetime.datetime.now().strftime("%H:%M")
    }, room=data.get("room", "general"))

@socketio.on("react")
def handle_react(data):
    username = session["username"]
    message_id = data.get("message_id")
    emoji = data.get("emoji")
    
    # Update reaction in database
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("UPDATE messages SET reaction=? WHERE message_id=?", (emoji, message_id))
    conn.commit()
    conn.close()
    
    # Broadcast reaction update
    emit("reaction_update", {
        "message_id": message_id,
        "reaction": emoji,
        "reacted_by": username
    }, room=data.get("room", "general"))

@socketio.on("typing")
def handle_typing(data):
    username = session["username"]
    room = data.get("room", "general")
    
    emit("typing_update", {
        "user": username,
        "is_typing": data.get("is_typing", True)
    }, room=room, include_self=False)

@socketio.on("delete")
def handle_delete(data):
    username = session["username"]
    message_id = data.get("message_id")
    room = data.get("room", "general")
    
    # Mark message as deleted in database
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("UPDATE messages SET deleted=1 WHERE message_id=? AND username=?", 
              (message_id, username))
    conn.commit()
    conn.close()
    
    # Broadcast delete event
    emit("delete_update", {
        "message_id": message_id,
        "deleted_by": username
    }, room=room)

@socketio.on("create_room")
def handle_create_room(data):
    username = session["username"]
    room_name = data.get("room_name")
    is_private = data.get("is_private", False)
    
    if room_name:
        # Save room to database
        conn = sqlite3.connect("users.db")
        c = conn.cursor()
        c.execute("""
            INSERT OR IGNORE INTO rooms(room_name, created_by, created_at, is_private)
            VALUES(?, ?, ?, ?)
        """, (room_name, username, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), is_private))
        conn.commit()
        conn.close()
        
        # Broadcast new room
        emit("room_created", {
            "room_name": room_name,
            "created_by": username,
            "is_private": is_private
        }, broadcast=True)

# ------------------- RUN -------------------
if __name__ == "__main__":
    print("🚀 TeShaN Chat Server Starting...")
    print("📱 Features: Real-time chat, file upload, reactions, seen ticks, typing indicators")
    print("🌐 Open http://127.0.0.1:5000 in your browser")
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)
