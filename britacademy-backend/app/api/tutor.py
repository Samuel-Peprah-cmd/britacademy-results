from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import TutorClassAssignment, Student, Subject, ResultRecord, ResultItem, ResultStatus, ExamType, AcademicYear
from app.utils.decorators import tutor_required
from flask_jwt_extended import get_jwt_identity

tutor_bp = Blueprint('tutor', __name__)

@tutor_bp.route('/assignments', methods=['GET'])
@tutor_required()
def get_assignments():
    tutor_id = get_jwt_identity()
    assignments = TutorClassAssignment.query.filter_by(tutor_id=tutor_id).all()
    return jsonify([{
        "assignment_id": a.id, "class_id": a.class_id, "class_name": a.class_group.name if a.class_group else "Unassigned"
    } for a in assignments]), 200

@tutor_bp.route('/classes/<int:class_id>/data', methods=['GET'])
@tutor_required()
def get_class_data(class_id):
    students = Student.query.filter_by(class_id=class_id).all()
    subjects = Subject.query.filter_by(class_id=class_id).all()
    return jsonify({
        "students": [{"id": s.id, "student_id": s.student_id, "name": f"{s.first_name} {s.last_name}"} for s in students],
        "subjects": [{"id": s.id, "name": s.name} for s in subjects]
    }), 200

@tutor_bp.route('/classes/<int:class_id>/subjects', methods=['POST'])
@tutor_required()
def add_class_subject(class_id):
    name = request.json.get('name', '').strip()
    existing = Subject.query.filter(db.func.lower(Subject.name) == name.lower(), Subject.class_id == class_id).first()
    if existing:
        return jsonify({"msg": "Subject already exists in this class"}), 400
    new_sub = Subject(name=name, class_id=class_id)
    db.session.add(new_sub)
    db.session.commit()
    return jsonify({"id": new_sub.id, "name": new_sub.name}), 201

# NEW: Fetch existing grades to auto-populate the frontend form
@tutor_bp.route('/classes/<int:class_id>/results', methods=['GET'])
@tutor_required()
def get_existing_results(class_id):
    subject_id = request.args.get('subject_id')
    exam_name = request.args.get('exam_name')
    year_name = request.args.get('year_name')

    if not all([subject_id, exam_name, year_name]):
        return jsonify({}), 200

    exam = ExamType.query.filter(db.func.lower(ExamType.name) == exam_name.lower().strip()).first()
    year = AcademicYear.query.filter(db.func.lower(AcademicYear.year_string) == year_name.lower().strip()).first()

    if not exam or not year:
        return jsonify({}), 200

    records = ResultRecord.query.join(Student).filter(
        Student.class_id == class_id,
        ResultRecord.exam_type_id == exam.id,
        ResultRecord.academic_year_id == year.id
    ).all()

    result_data = {}
    for record in records:
        item = ResultItem.query.filter_by(record_id=record.id, subject_id=subject_id).first()
        if item:
            result_data[record.student_id] = {
                "mark": item.mark,
                "grade": item.grade,
                "remark": item.remark
            }

    return jsonify(result_data), 200

@tutor_bp.route('/results/submit', methods=['POST'])
@tutor_required()
def submit_results():
    tutor_id = get_jwt_identity()
    data = request.get_json()
    student_id = data.get('student_id')
    exam_type_id = data.get('exam_type_id')
    academic_year_id = data.get('academic_year_id')
    subject_id = data.get('subject_id')

    try:
        record = ResultRecord.query.filter_by(student_id=student_id, exam_type_id=exam_type_id, academic_year_id=academic_year_id).first()
        if not record:
            record = ResultRecord(student_id=student_id, exam_type_id=exam_type_id, academic_year_id=academic_year_id, status=ResultStatus.PENDING)
            db.session.add(record)
            db.session.flush()

        item = ResultItem.query.filter_by(record_id=record.id, subject_id=subject_id).first()
        if item:
            item.mark = data.get('mark')
            item.grade = data.get('grade')
            item.remark = data.get('remark')
            item.tutor_id = tutor_id
        else:
            new_item = ResultItem(record_id=record.id, subject_id=subject_id, tutor_id=tutor_id, mark=data.get('mark'), grade=data.get('grade'), remark=data.get('remark'))
            db.session.add(new_item)

        record.status = ResultStatus.PENDING
        db.session.commit()
        return jsonify({"msg": "Result submitted."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Database transaction failed", "error": str(e)}), 500