from app import create_app
from app.extensions import db
# Import models to ensure they are registered before creating tables
from app import models 

app = create_app()

if __name__ == '__main__':
    # Initialize the database tables on the first run
    with app.app_context():
        db.create_all()
        print("✅ PostgreSQL Database tables verified/created successfully!")
        
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=True)