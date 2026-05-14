from app import create_app
from app.models import db
from app.models.entities import (
    User, Teacher, Student, Career, Subject, StudyPlan, Group,
    Registration, Enrollment, Semester, Rubric, Criterion, Scale,
    Evaluation, Grade, GradeDetail
)
from app.utils.security import hash_password
from datetime import datetime

app = create_app()


def ensure(obj):
    db.session.add(obj)
    db.session.flush()
    return obj


with app.app_context():
    db.create_all()

    # --- Careers (>=3) ---
    careers_data = [
        ('Engineering', 'ENG-001'),
        ('Computer Science', 'CS-001'),
        ('Business', 'BUS-001')
    ]
    careers = []
    for name, code in careers_data:
        c = Career.query.filter_by(code=code).first()
        if not c:
            c = Career(name=name, code=code, description=f'{name} career')
            ensure(c)
        careers.append(c)

    # --- Semesters (>=3) ---
    semesters = []
    sem_data = [
        ('2026-1', 'S2026A', '2026-01-10', '2026-06-30'),
        ('2026-2', 'S2026B', '2026-07-01', '2026-12-20'),
        ('2027-1', 'S2027A', '2027-01-10', '2027-06-30')
    ]
    for name, code, start, end in sem_data:
        s = Semester.query.filter_by(code=code).first()
        if not s:
            # Convert string dates to Python date objects for SQLite
            start_date = datetime.strptime(start, '%Y-%m-%d').date() if isinstance(start, str) else start
            end_date = datetime.strptime(end, '%Y-%m-%d').date() if isinstance(end, str) else end
            s = Semester(name=name, code=code, start_date=start_date, end_date=end_date, is_active=False)
            ensure(s)
        semesters.append(s)

    # --- Subjects (>=3) ---
    subjects_data = [
        ('Mathematics I', 'MATH-101', 3),
        ('Physics I', 'PHYS-101', 3),
        ('Programming I', 'PROG-101', 4)
    ]
    subjects = []
    for name, code, credits in subjects_data:
        sub = Subject.query.filter_by(code=code).first()
        if not sub:
            sub = Subject(name=name, code=code, credits=credits)
            ensure(sub)
        subjects.append(sub)

    db.session.commit()

    # --- StudyPlans (>=3) and link subjects ---
    study_plans = []
    for i, career in enumerate(careers, start=1):
        sp_name = f'Plan {2026 + i}'
        sp = StudyPlan.query.filter_by(name=sp_name).first()
        if not sp:
            sp = StudyPlan(career_id=career.id, name=sp_name, year=2026 + i, suggested_semester=1, is_published=(i % 2 == 0))
            ensure(sp)
            # link at least two subjects
            sp.subjects.append(subjects[i % len(subjects)])
            sp.subjects.append(subjects[(i + 1) % len(subjects)])
        study_plans.append(sp)

    db.session.commit()

    # --- Users / Teachers (>=3) ---
    teachers = []
    for idx in range(1, 4):
        email = f'teacher{idx}@example.com'
        base_code = f'TCH-{idx:03d}'
        user = User.query.filter_by(email=email).first()
        if not user:
            # Avoid UNIQUE collisions on code by trying suffixes
            code = base_code
            suffix = 1
            while User.query.filter_by(code=code).first():
                code = f"{base_code}-{suffix}"
                suffix += 1
            user = User(email=email, password_hash=hash_password('Teacher123'), code=code, role='TEACHER')
            ensure(user)
        teacher = Teacher.query.filter_by(user_id=user.id).first()
        if not teacher:
            teacher = Teacher(user_id=user.id, first_name=f'Teach{idx}', last_name='Doc', identification=f'TCH{100+idx}')
            ensure(teacher)
        teachers.append(teacher)

    # --- Users / Students (>=3) ---
    students = []
    for idx in range(1, 4):
        email = f'student{idx}@example.com'
        base_code = f'STU-{idx:03d}'
        user = User.query.filter_by(email=email).first()
        if not user:
            code = base_code
            suffix = 1
            while User.query.filter_by(code=code).first():
                code = f"{base_code}-{suffix}"
                suffix += 1
            user = User(email=email, password_hash=hash_password('Student123'), code=code, role='STUDENT')
            ensure(user)
        student = Student.query.filter_by(user_id=user.id).first()
        if not student:
            student = Student(user_id=user.id, first_name=f'Stud{idx}', last_name='User', identification=f'STU{200+idx}')
            ensure(student)
        students.append(student)

    db.session.commit()

    # --- Groups (>=3) ---
    groups = []
    for i in range(3):
        g_code = f'G-{i+1:02d}'
        grp = Group.query.filter_by(group_code=g_code).first()
        if not grp:
            grp = Group(teacher_id=teachers[i].id, subject_id=subjects[i].id, semester_id=semesters[i].id, name=f'Group {i+1}', group_code=g_code, capacity=30)
            ensure(grp)
        groups.append(grp)

    db.session.commit()

    # --- Registrations (one per student per career) ---
    for i, student in enumerate(students):
        career = careers[i % len(careers)]
        reg = Registration.query.filter_by(student_id=student.id, career_id=career.id).first()
        if not reg:
            reg = Registration(career_id=career.id, student_id=student.id, admission_period='2026-01', academic_status='ACTIVE')
            ensure(reg)

    db.session.commit()

    # --- Enrollments (>=3) ---
    for i, student in enumerate(students):
        grp = groups[i % len(groups)]
        en = Enrollment.query.filter_by(student_id=student.id, group_id=grp.id).first()
        if not en:
            en = Enrollment(student_id=student.id, group_id=grp.id, status='ACTIVE')
            ensure(en)

    db.session.commit()

    # --- Rubrics, Criteria, Scales (>=3 rubrics) ---
    rubrics = []
    for i in range(1, 4):
        title = f'Rubric {i}'
        r = Rubric.query.filter_by(title=title).first()
        if not r:
            r = Rubric(title=title, description=f'Description for {title}', is_public=(i % 2 == 1))
            ensure(r)
            # add 2 criteria each
            for cidx in range(2):
                crit = Criterion(rubric_id=r.id, name=f'Criterion {cidx+1}', description='...', weight=50.0)
                ensure(crit)
                # add 2 scales per criterion
                for sidx in range(2):
                    sc = Scale(criterion_id=crit.id, name=f'Level {sidx+1}', description='', value=float((sidx+1) * 50))
                    ensure(sc)
        rubrics.append(r)

    db.session.commit()

    # --- Evaluations (>=3) ---
    evaluations = []
    for i in range(3):
        ev_name = f'Evaluation {i+1}'
        grp = groups[i % len(groups)]
        ev = Evaluation.query.filter_by(name=ev_name, group_id=grp.id).first()
        if not ev:
            ev = Evaluation(subject_id=grp.subject_id, group_id=grp.id, name=ev_name, description='Eval', weight=50.0, rubric_id=rubrics[i].id)
            ensure(ev)
        evaluations.append(ev)

    db.session.commit()

    # --- Grades and GradeDetails (>=3) ---
    for i, student in enumerate(students):
        enrollment = Enrollment.query.filter_by(student_id=student.id).first()
        rubric = rubrics[i % len(rubrics)]
        # grade
        g = Grade.query.filter_by(enrollment_id=enrollment.id, rubric_id=rubric.id).first()
        if not g:
            g = Grade(enrollment_id=enrollment.id, rubric_id=rubric.id, final_score=0.0, status='DRAFT')
            ensure(g)
        # details: pick first scale of first criterion
        first_scale = Scale.query.filter_by(criterion_id=Criterion.query.filter_by(rubric_id=rubric.id).first().id).first()
        if first_scale:
            gd = GradeDetail.query.filter_by(scale_id=first_scale.id, student_id=student.id).first()
            if not gd:
                gd = GradeDetail(scale_id=first_scale.id, student_id=student.id, score=first_scale.value, comment='Auto')
                ensure(gd)

    db.session.commit()

    print('Seeding complete: created sample data (>=3 per table)')
