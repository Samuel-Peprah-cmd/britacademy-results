import boto3
import uuid
from botocore.exceptions import ClientError
from app.config import Config
from werkzeug.utils import secure_filename

def get_r2_client():
    return boto3.client(
        's3',
        endpoint_url=Config.R2_ENDPOINT_URL,
        aws_access_key_id=Config.R2_ACCESS_KEY,
        aws_secret_access_key=Config.R2_SECRET_KEY,
        region_name='auto'  # Required for R2
    )

def upload_student_photo(file_obj):
    """Uploads a file to R2 and returns the public URL."""
    if not file_obj:
        return None
        
    client = get_r2_client()
    filename = secure_filename(file_obj.filename)
    # Generate a unique string to prevent file overwrites
    unique_filename = f"students/{uuid.uuid4().hex}_{filename}"
    
    try:
        client.upload_fileobj(
            file_obj,
            Config.R2_BUCKET_NAME,
            unique_filename,
            ExtraArgs={'ContentType': file_obj.content_type}
        )
        # Construct and return the public URL using your dev endpoint
        return f"{Config.R2_PUBLIC_URL}/{unique_filename}"
    except ClientError as e:
        print(f"R2 Upload Error: {e}")
        return None