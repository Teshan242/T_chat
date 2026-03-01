import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'teshan_supersecret_key_2024'
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///users.db'
    
    # Upload folders
    UPLOAD_IMAGE = "static/uploads/images"
    UPLOAD_VOICE = "static/uploads/voices"
    UPLOAD_AVATARS = "static/uploads/avatars"
    
    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ALLOWED_VOICE_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a'}
    
    # Socket.IO settings
    SOCKETIO_ASYNC_MODE = 'threading'
    SOCKETIO_MANAGE_SESSION = False

class DevelopmentConfig(Config):
    DEBUG = True
    DATABASE_URL = 'sqlite:///users.db'

class ProductionConfig(Config):
    DEBUG = False
    # Use production database if available
    if os.environ.get('DATABASE_URL'):
        DATABASE_URL = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
