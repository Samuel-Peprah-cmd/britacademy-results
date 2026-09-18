import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # Cloudflare R2 Config
    R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
    R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY')
    R2_SECRET_KEY = os.environ.get('R2_SECRET_KEY')
    R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
    R2_ENDPOINT_URL = os.environ.get('R2_ENDPOINT_URL')
    R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL')