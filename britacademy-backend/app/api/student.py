from flask import Blueprint, request, jsonify, send_file
from app.models import Student, ResultRecord, ResultStatus, ExamType, AcademicYear
from app.services.pdf_generator import generate_result_pdf

student_bp = Blueprint('student', __name__)

@student_bp.route('/check-result', methods=['GET'])
def check_result():
    """Public endpoint for students to view their results via JSON for the web UI."""
    student_id = request.args.get('student_id')
    exam_type_id = request.args.get('exam_type_id')
    academic_year_id = request.args.get('academic_year_id')

    if not all([student_id, exam_type_id, academic_year_id]):
        return jsonify({"msg": "Missing required examination parameters."}), 400

    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({"msg": "Candidate not found."}), 404

    record = ResultRecord.query.filter_by(
        student_id=student.id,
        exam_type_id=exam_type_id,
        academic_year_id=academic_year_id,
        status=ResultStatus.PUBLISHED
    ).first()

    if not record:
        return jsonify({"msg": "Result not found or has not been published yet."}), 404

    # Structure data for the web UI
    payload = {
        "candidate": {
            "name": f"{student.first_name} {student.last_name}",
            "student_id": student.student_id,
            "gender": student.gender,
            "photo_url": student.photo_url,
            "exam_type": record.exam_type.name,
            "academic_year": record.academic_year.year_string,
            "class_group": student.class_group.name
        },
        "results": [{
            "subject": item.subject.name,
            "grade": item.grade,
            "mark": item.mark,
            "remark": item.remark
        } for item in record.items]
    }
    
    return jsonify(payload), 200

@student_bp.route('/download-pdf', methods=['GET'])
def download_pdf():
    """Generates and returns the official result slip PDF."""
    student_id = request.args.get('student_id')
    exam_type_id = request.args.get('exam_type_id')
    academic_year_id = request.args.get('academic_year_id')

    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({"msg": "Candidate not found."}), 404

    record = ResultRecord.query.filter_by(
        student_id=student.id,
        exam_type_id=exam_type_id,
        academic_year_id=academic_year_id,
        status=ResultStatus.PUBLISHED
    ).first()

    if not record:
        return jsonify({"msg": "Result not available for download."}), 404

    pdf_buffer = generate_result_pdf(student, record)
    
    filename = f"{student.student_id}_{record.exam_type.name.replace(' ', '_')}_Result.pdf"
    
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )