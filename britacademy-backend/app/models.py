from app.extensions import db
from datetime import datetime
from enum import Enum

class RoleEnum(Enum):
    ADMIN = 'admin'
    TUTOR = 'tutor'

class ResultStatus(Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    PUBLISHED = 'published'

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum(RoleEnum, name='role_enum', values_callable=lambda x: [e.value for e in x]), nullable=False)

class ClassGroup(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    # ADDED CASCADE: Deleting a class deletes its subjects
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    __table_args__ = (db.UniqueConstraint('name', 'class_id', name='uq_subject_class'),)
    
    class_group = db.relationship('ClassGroup', backref=db.backref('subjects', cascade="all, delete", lazy=True))

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(10), nullable=False, server_default='Male') 
    photo_url = db.Column(db.String(255), nullable=True) 
    # ADDED CASCADE: Deleting a class deletes its students
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    
    class_group = db.relationship('ClassGroup', backref=db.backref('students', cascade="all, delete", lazy=True))

class ExamType(db.Model):
    __tablename__ = 'exam_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) 

class AcademicYear(db.Model):
    __tablename__ = 'academic_years'
    id = db.Column(db.Integer, primary_key=True)
    year_string = db.Column(db.String(20), unique=True, nullable=False) 
    is_active = db.Column(db.Boolean, default=False)

class TutorClassAssignment(db.Model):
    __tablename__ = 'tutor_class_assignments'
    id = db.Column(db.Integer, primary_key=True)
    tutor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    # ADDED CASCADE: Deleting a class deletes its tutor assignments
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    
    class_group = db.relationship('ClassGroup', backref=db.backref('tutor_assignments', cascade="all, delete", lazy=True))
    tutor = db.relationship('User', backref=db.backref('class_assignments', cascade="all, delete", lazy=True))
    __table_args__ = (db.UniqueConstraint('tutor_id', 'class_id', name='uq_tutor_class_assignment'),)

class ResultRecord(db.Model):
    __tablename__ = 'result_records'
    id = db.Column(db.Integer, primary_key=True)
    # ADDED CASCADE: Deleting a student deletes their result record
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    exam_type_id = db.Column(db.Integer, db.ForeignKey('exam_types.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum(ResultStatus, name='result_status', values_callable=lambda x: [e.value for e in x]), default=ResultStatus.PENDING, nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    __table_args__ = (db.UniqueConstraint('student_id', 'exam_type_id', 'academic_year_id', name='uq_student_exam_year'),)
    
    student = db.relationship('Student', backref=db.backref('results', cascade="all, delete", lazy=True))
    exam_type = db.relationship('ExamType')
    academic_year = db.relationship('AcademicYear')
    items = db.relationship('ResultItem', backref='record', cascade="all, delete-orphan")

class ResultItem(db.Model):
    __tablename__ = 'result_items'
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('result_records.id', ondelete='CASCADE'), nullable=False)
    # ADDED CASCADE: Deleting a subject deletes the grades tied to it
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    tutor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    mark = db.Column(db.Float, nullable=False)
    grade = db.Column(db.String(5), nullable=False)
    remark = db.Column(db.String(100), nullable=True)
    
    subject = db.relationship('Subject')