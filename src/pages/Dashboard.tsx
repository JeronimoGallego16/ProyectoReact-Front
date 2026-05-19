import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { semesterService } from '../services/SemesterService';
import { Semester } from '../models/Semester';
import Breadcrumb from '../components/Breadcrumb';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  roles: string[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.user);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveSemester = async () => {
      try {
        const semester = await semesterService.getActiveSemester();
        setActiveSemester(semester);
      } catch (error) {
        console.error('Error loading active semester:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActiveSemester();
  }, []);

  const userRole = user?.role || 'STUDENT';

  // Define dashboard cards por rol
  const dashboardCards: DashboardCard[] = [
    // Common to all roles
    {
      title: 'Rúbricas',
      description: 'Consulta las rúbricas de evaluación',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M16.5 2.25H1.5C0.675 2.25 0 2.925 0 3.75V14.25C0 15.075 0.675 15.75 1.5 15.75H16.5C17.325 15.75 18 15.075 18 14.25V3.75C18 2.925 17.325 2.25 16.5 2.25ZM16.5 14.25H1.5V3.75H16.5V14.25ZM3 6.75H15V8.25H3V6.75ZM3 9.75H11.25V11.25H3V9.75Z" />
        </svg>
      ),
      path: '/rubrics',
      color: 'from-blue-500 to-blue-600',
      roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    },
    {
      title: 'Evaluaciones',
      description: 'Gestiona tus evaluaciones',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M16.5 2.25H1.5C0.675 2.25 0 2.925 0 3.75V14.25C0 15.075 0.675 15.75 1.5 15.75H16.5C17.325 15.75 18 15.075 18 14.25V3.75C18 2.925 17.325 2.25 16.5 2.25ZM16.5 14.25H1.5V3.75H16.5V14.25ZM3 6.75H15V8.25H3V6.75ZM3 9.75H11.25V11.25H3V9.75Z" />
        </svg>
      ),
      path: '/evaluations',
      color: 'from-purple-500 to-purple-600',
      roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    },
    {
      title: 'Notas',
      description: 'Consulta tus calificaciones',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M16.5 2.25H1.5C0.675 2.25 0 2.925 0 3.75V14.25C0 15.075 0.675 15.75 1.5 15.75H16.5C17.325 15.75 18 15.075 18 14.25V3.75C18 2.925 17.325 2.25 16.5 2.25ZM16.5 14.25H1.5V3.75H16.5V14.25ZM3 6.75H15V8.25H3V6.75ZM3 9.75H11.25V11.25H3V9.75Z" />
        </svg>
      ),
      path: '/grades',
      color: 'from-green-500 to-green-600',
      roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    },

    // Admin only
    {
      title: 'Carreras y Semestres',
      description: 'Administra carreras y semestres',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M2 2h14v3H2zM2 7h14v3H2zM2 12h14v3H2z" />
        </svg>
      ),
      path: '/academic',
      color: 'from-orange-500 to-orange-600',
      roles: ['ADMIN'],
    },
    {
      title: 'Asignaturas',
      description: 'Gestiona asignaturas y contenidos',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M4 3h10v3H4zM4 8h10v3H4zM4 13h10v2H4z" />
        </svg>
      ),
      path: '/academic/subjects',
      color: 'from-red-500 to-red-600',
      roles: ['ADMIN'],
    },
    {
      title: 'Planes de Estudio',
      description: 'Administra planes de estudio',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M3 2h12v2H3zM3 5h12v2H3zM3 8h12v2H3zM3 11h12v2H3z" />
        </svg>
      ),
      path: '/academic/study-plans',
      color: 'from-indigo-500 to-indigo-600',
      roles: ['ADMIN'],
    },
    {
      title: 'Usuarios',
      description: 'Gestiona usuarios del sistema',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M9 9C11.25 9 13 7.25 13 5C13 2.75 11.25 1 9 1C6.75 1 5 2.75 5 5C5 7.25 6.75 9 9 9ZM9 11C6.5 11 1 12.25 1 15V17H17V15C17 12.25 11.5 11 9 11Z" />
        </svg>
      ),
      path: '/usuarios',
      color: 'from-pink-500 to-pink-600',
      roles: ['ADMIN'],
    },
    {
      title: 'Grupos',
      description: 'Administra grupos y asignaciones',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M9 2.25C5.02031 2.25 1.875 5.39531 1.875 9.375C1.875 13.3547 5.02031 16.5 9 16.5C12.9797 16.5 16.125 13.3547 16.125 9.375C16.125 5.39531 12.9797 2.25 9 2.25ZM9 15C5.51016 15 2.75 12.2398 2.75 8.75C2.75 5.26016 5.51016 2.5 9 2.5C12.4898 2.5 15.25 5.26016 15.25 8.75C15.25 12.2398 12.4898 15 9 15Z" />
        </svg>
      ),
      path: '/grupos',
      color: 'from-cyan-500 to-cyan-600',
      roles: ['ADMIN'],
    },
    {
      title: 'Matricular Estudiante',
      description: 'Registra nuevas matrículas',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 18 18">
          <path d="M9 2.25C5.02031 2.25 1.875 5.39531 1.875 9.375C1.875 13.3547 5.02031 16.5 9 16.5C12.9797 16.5 16.125 13.3547 16.125 9.375C16.125 5.39531 12.9797 2.25 9 2.25ZM9 15C5.51016 15 2.75 12.2398 2.75 8.75C2.75 5.26016 5.51016 2.5 9 2.5C12.4898 2.5 15.25 5.26016 15.25 8.75C15.25 12.2398 12.4898 15 9 15Z" />
        </svg>
      ),
      path: '/matricula',
      color: 'from-teal-500 to-teal-600',
      roles: ['ADMIN'],
    },
  ];

  // Filter cards by role
  const visibleCards = dashboardCards.filter(card =>
    card.roles.includes(userRole)
  );

  return (
    <>
      <Breadcrumb pageName="Inicio" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Accede rápidamente a los módulos del portal académico
              </p>
            </div>

            {/* Active Semester Badge */}
            {!loading && activeSemester && (
              <div className="bg-white dark:bg-boxdark rounded-lg shadow p-4 border-l-4 border-primary">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Semestre Activo
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeSemester.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {activeSemester.start_date && activeSemester.end_date ? (
                    <>
                      {new Date(activeSemester.start_date).toLocaleDateString('es-ES')} -{' '}
                      {new Date(activeSemester.end_date).toLocaleDateString('es-ES')}
                    </>
                  ) : (
                    'Fechas no disponibles'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleCards.map((card) => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="group cursor-pointer"
            >
              <div className="h-full rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                {/* Card Header with Gradient */}
                <div
                  className={`bg-gradient-to-br ${card.color} p-6 text-white group-hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <div>{card.icon}</div>
                    <svg
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 bg-white dark:bg-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {visibleCards.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No hay módulos disponibles para tu rol
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
