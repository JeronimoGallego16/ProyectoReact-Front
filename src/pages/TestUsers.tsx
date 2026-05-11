import { useState } from 'react';
import adminService from '../services/admin.service';
import studentService from '../services/student.service';
import teacherService from '../services/teacher.service';
import toast from 'react-hot-toast';

export default function TestUsers() {
    const [adminData, setAdminData] = useState({
        email: 'admin.test@example.com',
        password: 'Password123!',
        code: 'ADM-TEST-001'
    });

    const [studentData, setStudentData] = useState({
        email: 'student.test@example.com',
        password: 'Password123!',
        code: 'STD-TEST-001',
        first_name: 'Test',
        last_name: 'Student',
        identification: '9999999999'
    });

    const [teacherData, setTeacherData] = useState({
        email: 'teacher.test@example.com',
        password: 'Password123!',
        code: 'TCH-TEST-001',
        first_name: 'Test',
        last_name: 'Teacher',
        identification: '8888888888',
        phone: '3001234567',
        specialty: 'Programación'
    });

    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const createAdmin = async () => {
        setLoading(true);
        try {
            const result = await adminService.createAdmin(adminData);
            setResponse(result);
            toast.success('Admin creado exitosamente');
        } catch (error) {
            toast.error('Error al crear admin');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const createStudent = async () => {
        setLoading(true);
        try {
            const result = await studentService.createStudent(studentData);
            setResponse(result);
            toast.success('Student creado exitosamente');
        } catch (error) {
            toast.error('Error al crear student');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const createTeacher = async () => {
        setLoading(true);
        try {
            const result = await teacherService.createTeacher(teacherData);
            setResponse(result);
            toast.success('Teacher creado exitosamente');
        } catch (error) {
            toast.error('Error al crear teacher');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Pruebas de Usuarios</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* ADMIN */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#3b82f6' }}>Admin</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        value={adminData.email}
                        onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={adminData.password}
                        onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                    />
                    <input
                        type="text"
                        placeholder="Code"
                        value={adminData.code}
                        onChange={(e) => setAdminData({ ...adminData, code: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                    />
                    <button
                        onClick={createAdmin}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: loading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Creando...' : 'Crear Admin'}
                    </button>
                </div>

                {/* STUDENT */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#10b981' }}>Student</h2>
                    <input type="email" placeholder="Email" value={studentData.email} onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="password" placeholder="Password" value={studentData.password} onChange={(e) => setStudentData({ ...studentData, password: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Code" value={studentData.code} onChange={(e) => setStudentData({ ...studentData, code: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="First Name" value={studentData.first_name} onChange={(e) => setStudentData({ ...studentData, first_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Last Name" value={studentData.last_name} onChange={(e) => setStudentData({ ...studentData, last_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Identification" value={studentData.identification} onChange={(e) => setStudentData({ ...studentData, identification: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <button
                        onClick={createStudent}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: loading ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Creando...' : 'Crear Student'}
                    </button>
                </div>

                {/* TEACHER */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#8b5cf6' }}>Teacher</h2>
                    <input type="email" placeholder="Email" value={teacherData.email} onChange={(e) => setTeacherData({ ...teacherData, email: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="password" placeholder="Password" value={teacherData.password} onChange={(e) => setTeacherData({ ...teacherData, password: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Code" value={teacherData.code} onChange={(e) => setTeacherData({ ...teacherData, code: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="First Name" value={teacherData.first_name} onChange={(e) => setTeacherData({ ...teacherData, first_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Last Name" value={teacherData.last_name} onChange={(e) => setTeacherData({ ...teacherData, last_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Identification" value={teacherData.identification} onChange={(e) => setTeacherData({ ...teacherData, identification: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="tel" placeholder="Phone" value={teacherData.phone} onChange={(e) => setTeacherData({ ...teacherData, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <input type="text" placeholder="Specialty" value={teacherData.specialty} onChange={(e) => setTeacherData({ ...teacherData, specialty: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }} />
                    <button
                        onClick={createTeacher}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: loading ? '#9ca3af' : '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Creando...' : 'Crear Teacher'}
                    </button>
                </div>
            </div>

            {/* Response */}
            {response && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Respuesta del Backend:</h2>
                    <pre style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '400px', fontSize: '0.875rem' }}>
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
