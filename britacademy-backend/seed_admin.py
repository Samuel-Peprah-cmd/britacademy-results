from app import create_app
from app.extensions import db
from app.models import User, RoleEnum
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Check if admin already exists
    existing_admin = User.query.filter_by(email='admin@britacademy.online').first()
    
    if existing_admin:
        print("Admin user already exists!")
    else:
        new_admin = User(
            email='skapeprah@gmail.com',
            password_hash=generate_password_hash('Britacademy2026!'),
            first_name='Samuel',
            last_name='Peprah',
            role=RoleEnum.ADMIN
        )
        db.session.add(new_admin)
        db.session.commit()
        print("✅ Super Admin created successfully!")
        print("Email: skapeprah@gmail.com")
        print("Password: Britacademy2026!")