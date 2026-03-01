# Deployment Guide for TeShaN Chat

## 🚀 Quick Deployment Options

### 1. **PythonAnywhere** (Recommended for Beginners)

#### Steps:
1. **Create Account**: [pythonanywhere.com](https://www.pythonanywhere.com)
2. **Create New Web App**:
   - Dashboard → Web → Add a new web app
   - Choose Flask framework
   - Python 3.9+ version
3. **Upload Files**:
   - Go to Files tab
   - Upload all project files
4. **Install Dependencies**:
   - Bash console: `pip install -r requirements.txt`
5. **Configure Web App**:
   - Set working directory to your project folder
   - WSGI file: point to `app.py`
6. **Set Environment Variables** (optional):
   - `SECRET_KEY=your_secret_key_here`

#### URL: `yourusername.pythonanywhere.com`

---

### 2. **Replit** (Easiest Setup)

#### Steps:
1. **Create Repl**: [replit.com](https://replit.com)
2. **Import Project**:
   - Choose "Import from GitHub" or upload files
3. **Install Dependencies**:
   - Shell: `pip install -r requirements.txt`
4. **Configure Main File**:
   - Rename `app.py` to `main.py` (Replit standard)
5. **Run**: Click "Run" button

#### URL: `yourappname.repl.app`

---

### 3. **Render** (Professional Option)

#### Steps:
1. **Create Account**: [render.com](https://render.com)
2. **Connect GitHub**:
   - Push code to GitHub repository
   - Connect Render to your GitHub
3. **Create Web Service**:
   - New → Web Service
   - Connect your repo
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`
4. **Environment Variables**:
   - `SECRET_KEY`: Generate a random key
   - `PYTHON_VERSION`: `3.9.16`

#### URL: `yourappname.onrender.com`

---

### 4. **Heroku** (Classic Choice)

#### Steps:
1. **Install Heroku CLI**
2. **Login**: `heroku login`
3. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   ```
5. **Deploy**:
   ```bash
   git push heroku main
   ```
6. **Set Environment Variables**:
   ```bash
   heroku config:set SECRET_KEY=your_secret_key_here
   ```

#### URL: `your-app-name.herokuapp.com`

---

### 5. **Vercel** (Modern & Fast)

#### Steps:
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Login**: `vercel login`
3. **Deploy**:
   ```bash
   vercel --prod
   ```
4. **Configure vercel.json** (create this file):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "app.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app.py"
       }
     ]
   }
   ```

#### URL: `your-app-name.vercel.app`

---

## 📋 Pre-Deployment Checklist

### ✅ Required Files:
- [ ] `app.py` - Main application
- [ ] `requirements.txt` - Dependencies
- [ ] `Procfile` - Process configuration (Heroku/Render)
- [ ] `.gitignore` - Git ignore file
- [ ] `README.md` - Project documentation

### ✅ Configuration:
- [ ] Update `SECRET_KEY` for production
- [ ] Set up database (SQLite works for free tiers)
- [ ] Configure upload folders
- [ ] Test locally first

### ✅ Security:
- [ ] Use environment variables for secrets
- [ ] Validate file uploads
- [ ] Implement rate limiting (optional)
- [ ] Use HTTPS (provided by most platforms)

---

## 🔧 Common Issues & Solutions

### **Database Issues**:
```python
# For production, use this in app.py:
import os
database_url = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
```

### **File Upload Issues**:
```python
# Ensure upload directories exist
os.makedirs(UPLOAD_IMAGE, exist_ok=True)
os.makedirs(UPLOAD_VOICE, exist_ok=True)
os.makedirs(UPLOAD_AVATARS, exist_ok=True)
```

### **Socket.IO Issues**:
```python
# For production, use eventlet
socketio = SocketIO(app, async_mode="eventlet", manage_session=False)
```

---

## 🌐 Free Tier Limitations

| Platform | Free Tier Limits | Database | Custom Domain |
|----------|------------------|----------|---------------|
| PythonAnywhere | 2 web apps, 512MB RAM | SQLite | ✅ Paid |
| Replit | Always-on (limited) | Built-in | ✅ Free |
| Render | 750 hours/month | PostgreSQL | ✅ Free |
| Heroku | Limited hours | PostgreSQL | ✅ Free |
| Vercel | Unlimited | None (serverless) | ✅ Free |

---

## 🎯 Recommended Choice

**For Beginners**: PythonAnywhere
**For Fast Setup**: Replit  
**For Professional**: Render
**For Performance**: Vercel

---

## 📞 Support

If you need help with deployment:
1. Check platform documentation
2. Review error logs
3. Test locally first
4. Use the community forums

Good luck with your deployment! 🚀
