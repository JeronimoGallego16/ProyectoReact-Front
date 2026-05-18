import { lazy } from 'react';

const SubjectsPage = lazy(() => import('../pages/Academic/Subjects'));
const StudyPlansPage = lazy(() => import('../pages/Academic/StudyPlans'));
const Profile = lazy(() => import('../pages/Profile'));
const TestUsers = lazy(() => import('../pages/TestUsers'));
const EvaluationsPage = lazy(() => import('../pages/Evaluation/Evaluations'));
const RubricsPage = lazy(() => import('../pages/Evaluation/Rubrics'));
const CriteriaByRubricPage = lazy(() => import('../pages/Evaluation/CriteriaByRubric'));
const ScalesByCriterionPage = lazy(() => import('../pages/Evaluation/ScalesByCriterion'));
const RubricForEvaluationPage = lazy(() => import('../pages/Evaluation/RubricForEvaluation'));
const CalificationPage = lazy(() => import('../pages/Evaluation/Calification'));
const CalificationDetailPage = lazy(() => import('../pages/Evaluation/CalificationDetail'));
const GradesPage = lazy(() => import('../pages/Evaluation/Grades'));
const GradeDetailPage = lazy(() => import('../pages/Evaluation/GradeDetail'));
const AcademicPage = lazy(() => import('../pages/Academic/AcademicPage'));
const StudyPlanDetailsPage = lazy(() => import('../pages/Academic/StudyPlanDetails'));
const EnrollInGroupPage = lazy(() => import('../pages/Academic/EnrollInGroup'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const GroupsPage = lazy(() => import('../pages/GroupsPage'));
const EnrollmentPage = lazy(() => import('../pages/EnrollmentPage'));


const coreRoutes = [
  {
    path: '/profile',
    title: 'Profile',
    component: Profile,
  },
  {
    path: '/usuarios',
    title: 'Usuarios',
    component: UsersPage,
  },
  {
    path: '/grupos',
    title: 'Grupos',
    component: GroupsPage,
  },
  {
    path: '/matricula',
    title: 'Matricular Estudiante',
    component: EnrollmentPage,
  },
  {
    path: '/test-users',
    title: 'Test Users',
    component: TestUsers,
  },
  {
    path: '/academic',
    title: 'Académico',
    component: AcademicPage,
  },
  {
    path: '/academic/subjects',
    title: 'Asignaturas',
    component: SubjectsPage,
  },
  {
    path: '/academic/study-plans',
    title: 'Plan de estudios',
    component: StudyPlansPage,
  },
  {
    path: '/academic/study-plans/:studyPlanId',
    title: 'Study Plan Details',
    component: StudyPlanDetailsPage,
  },
  {
    path: '/academic/enroll-student',
    title: 'Inscribir estudiante en grupo',
    component: EnrollInGroupPage,
  },
  {
    path: '/rubrics',
    title: 'Rubrics Page',
    component: RubricsPage,
  },
  {
    path: '/rubrics/:rubricId/criteria',
    title: 'Criteria by Rubric Page',
    component: CriteriaByRubricPage,
  },
  {
    path: '/criteria/:criterionId/scales',
    title: 'Scales by Criterion Page',
    component: ScalesByCriterionPage,
  },   
  {
    path: '/evaluations',
    title: 'Evaluations',
    component: EvaluationsPage,
  },
  {
    path: '/evaluations/:evaluationId/rubric',
    title: 'Rubric for Evaluation',
    component: RubricForEvaluationPage,
  },
  {
    path: '/evaluations/:evaluationId/califications',
    title: 'Calification',
    component: CalificationPage,
  }, 
  {
    path: '/evaluations/:evaluationId/califications/:enrollmentId',
    title: 'Calification Detail',
    component: CalificationDetailPage,
  },
  { 
    path: '/grades',
    title: 'Grades',
    component: GradesPage,
  }, 
  { 
    path: 'grades/:gradeId', 
    title: 'Grade Detail',
    component: GradeDetailPage,
  }
];

const routes = [...coreRoutes];
export default routes;
