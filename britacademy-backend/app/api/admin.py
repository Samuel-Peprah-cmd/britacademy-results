from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import ClassGroup, Subject, User, RoleEnum, Student, ExamType, AcademicYear, ResultRecord, ResultStatus, TutorClassAssignment
from app.utils.decorators import admin_required
from app.services.r2_storage import upload_student_photo
from werkzeug.security import generate_password_hash
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

admin_bp = Blueprint('admin', __name__)

def safe_delete(obj):
    try:
        db.session.delete(obj)
        db.session.commit()
        return jsonify({"msg": "Deleted successfully"}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Cannot delete. This record is linked to other active data."}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": str(e)}), 500

@admin_bp.route('/classes', methods=['POST', 'GET'])
@admin_required()
def handle_classes():
    if request.method == 'POST':
        new_class = ClassGroup(name=request.json.get('name'))
        db.session.add(new_class)
        db.session.commit()
        return jsonify({"msg": "Class created successfully"}), 201
    return jsonify([{"id": c.id, "name": c.name} for c in ClassGroup.query.all()]), 200

@admin_bp.route('/classes/<int:id>', methods=['PUT', 'DELETE'])
@admin_required()
def manage_class(id):
    c = ClassGroup.query.get_or_404(id)
    if request.method == 'PUT':
        c.name = request.json.get('name', c.name)
        db.session.commit()
        return jsonify({"msg": "Class updated successfully"}), 200
    return safe_delete(c)

@admin_bp.route('/subjects', methods=['POST', 'GET'])
@admin_required()
def handle_subjects():
    if request.method == 'POST':
        name = request.json.get('name', '').strip()
        class_id = request.json.get('class_id')
        
        existing = Subject.query.filter(db.func.lower(Subject.name) == name.lower(), Subject.class_id == class_id).first()
        if existing:
            return jsonify({"msg": "Subject already exists in this class"}), 400
            
        new_subject = Subject(name=name, class_id=class_id)
        db.session.add(new_subject)
        db.session.commit()
        return jsonify({"msg": "Subject created successfully"}), 201
        
    subjects = Subject.query.all()
    result = []
    for s in subjects:
        cg = ClassGroup.query.get(s.class_id)
        result.append({
            "id": s.id, 
            "name": s.name, 
            "class_id": s.class_id, 
            "class_name": cg.name if cg else "Deleted Class"
        })
    return jsonify(result), 200

@admin_bp.route('/subjects/<int:id>', methods=['PUT', 'DELETE'])
@admin_required()
def manage_subject(id):
    s = Subject.query.get_or_404(id)
    if request.method == 'PUT':
        s.name = request.json.get('name', s.name)
        s.class_id = request.json.get('class_id', s.class_id)
        db.session.commit()
        return jsonify({"msg": "Subject updated successfully"}), 200
    return safe_delete(s)

@admin_bp.route('/setup/exams', methods=['GET'])
def get_exams():
    return jsonify([{"id": e.id, "name": e.name} for e in ExamType.query.all()]), 200

@admin_bp.route('/setup/exams', methods=['POST'])
@jwt_required()
def create_exam():
    name = request.json.get('name', '').strip()
    existing = ExamType.query.filter(ExamType.name.ilike(name)).first()
    if existing: return jsonify({"msg": "Exam exists", "id": existing.id}), 200
        
    new_exam = ExamType(name=name)
    db.session.add(new_exam)
    db.session.commit()
    return jsonify({"msg": "Exam Type created", "id": new_exam.id}), 201

@admin_bp.route('/setup/exams/<int:id>', methods=['DELETE'])
@admin_required()
def delete_exam(id):
    return safe_delete(ExamType.query.get_or_404(id))

@admin_bp.route('/setup/years', methods=['GET'])
def get_years():
    return jsonify([{"id": y.id, "year_string": y.year_string} for y in AcademicYear.query.all()]), 200

@admin_bp.route('/setup/years', methods=['POST'])
@jwt_required()
def create_year():
    year_str = request.json.get('year_string', '').strip()
    existing = AcademicYear.query.filter(AcademicYear.year_string.ilike(year_str)).first()
    if existing: return jsonify({"msg": "Year exists", "id": existing.id}), 200
        
    new_year = AcademicYear(year_string=year_str, is_active=True)
    db.session.add(new_year)
    db.session.commit()
    return jsonify({"msg": "Academic Year created", "id": new_year.id}), 201

@admin_bp.route('/setup/years/<int:id>', methods=['DELETE'])
@admin_required()
def delete_year(id):
    return safe_delete(AcademicYear.query.get_or_404(id))

@admin_bp.route('/tutors', methods=['POST', 'GET'])
@admin_required()
def handle_tutors():
    if request.method == 'POST':
        new_tutor = User(
            email=request.json.get('email'),
            password_hash=generate_password_hash(request.json.get('password')),
            first_name=request.json.get('first_name'),
            last_name=request.json.get('last_name'),
            role=RoleEnum.TUTOR
        )
        db.session.add(new_tutor)
        db.session.commit()
        return jsonify({"msg": "Tutor created"}), 201
    tutors = User.query.filter_by(role=RoleEnum.TUTOR).all()
    return jsonify([{"id": t.id, "name": f"{t.first_name} {t.last_name}", "email": t.email} for t in tutors]), 200

@admin_bp.route('/tutors/<int:id>', methods=['DELETE'])
@admin_required()
def delete_tutor(id):
    return safe_delete(User.query.get_or_404(id))

@admin_bp.route('/tutors/assign', methods=['POST', 'GET'])
@admin_required()
def handle_tutor_assignments():
    if request.method == 'POST':
        data = request.get_json()
        if TutorClassAssignment.query.filter_by(tutor_id=data.get('tutor_id'), class_id=data.get('class_id')).first():
            return jsonify({"msg": "Tutor already assigned to this class."}), 400
            
        db.session.add(TutorClassAssignment(tutor_id=data.get('tutor_id'), class_id=data.get('class_id')))
        db.session.commit()
        return jsonify({"msg": "Tutor assigned to class"}), 201

    assignments = TutorClassAssignment.query.all()
    return jsonify([{
        "id": a.id, "tutor_name": f"{a.tutor.first_name} {a.tutor.last_name}",
        "class_name": a.class_group.name if a.class_group else "Deleted Class"
    } for a in assignments]), 200

@admin_bp.route('/tutors/assign/<int:id>', methods=['DELETE'])
@admin_required()
def delete_assignment(id):
    return safe_delete(TutorClassAssignment.query.get_or_404(id))

@admin_bp.route('/students', methods=['POST', 'GET'])
@admin_required()
def handle_students():
    if request.method == 'POST':
        photo = request.files.get('photo')
        photo_url = upload_student_photo(photo) if photo else None
        new_student = Student(
            student_id=request.form.get('student_id'),
            first_name=request.form.get('first_name'),
            last_name=request.form.get('last_name'),
            gender=request.form.get('gender'), 
            class_id=request.form.get('class_id'),
            photo_url=photo_url
        )
        db.session.add(new_student)
        db.session.commit()
        return jsonify({"msg": "Student created"}), 201

    students = Student.query.all()
    return jsonify([{
        "id": s.id, "student_id": s.student_id, "first_name": s.first_name, "last_name": s.last_name,
        "name": f"{s.first_name} {s.last_name}", "gender": s.gender, "class_id": s.class_id, "photo_url": s.photo_url
    } for s in students]), 200

@admin_bp.route('/students/<int:id>', methods=['PUT', 'DELETE'])
@admin_required()
def manage_student(id):
    s = Student.query.get_or_404(id)
    if request.method == 'PUT':
        s.student_id = request.form.get('student_id', s.student_id)
        s.first_name = request.form.get('first_name', s.first_name)
        s.last_name = request.form.get('last_name', s.last_name)
        s.gender = request.form.get('gender', s.gender)
        s.class_id = request.form.get('class_id', s.class_id)
        photo = request.files.get('photo')
        if photo: s.photo_url = upload_student_photo(photo)
        db.session.commit()
        return jsonify({"msg": "Student updated"}), 200
    return safe_delete(s)

# FIXED: Returns FULL result payload so Admin can preview the slip
@admin_bp.route('/results/all', methods=['GET'])
@admin_required()
def get_all_results():
    # Fetch all master result slips, ordering Pending ones at the top
    records = ResultRecord.query.order_by(ResultRecord.status.asc()).all()
    
    return jsonify([{
        "record_id": r.id, 
        "student": f"{r.student.first_name} {r.student.last_name} ({r.student.student_id})",
        "exam_type": r.exam_type.name, 
        "academic_year": r.academic_year.year_string, 
        "items_count": len(r.items),
        "status": r.status.value, # 'pending' or 'published'
        "candidate": {
            "name": f"{r.student.first_name} {r.student.last_name}",
            "student_id": r.student.student_id,
            "gender": r.student.gender,
            "photo_url": r.student.photo_url,
            "exam_type": r.exam_type.name,
            "academic_year": r.academic_year.year_string
        },
        # Compiles all subjects from all tutors into the single slip
        "results": [{"subject": i.subject.name, "grade": i.grade, "mark": i.mark, "remark": i.remark} for i in r.items]
    } for r in records]), 200

@admin_bp.route('/results/<int:record_id>/approve', methods=['PATCH'])
@admin_required()
def approve_result(record_id):
    record = ResultRecord.query.get_or_404(record_id)
    record.status = ResultStatus.PUBLISHED
    record.approved_by = get_jwt_identity()
    db.session.commit()
    return jsonify({"msg": "Result slip successfully published."}), 200