import { lazy } from 'react';

const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const TestUsers = lazy(() => import('../pages/TestUsers'));
const EvaluationsPage = lazy(() => import('../pages/Evaluation/Evaluations'));
const RubricsPage = lazy(() => import('../pages/Evaluation/Rubrics'));
const CriteriaByRubricPage = lazy(() => import('../pages/Evaluation/CriteriaByRubric'));
const ScalesByCriterionPage = lazy(() => import('../pages/Evaluation/ScalesByCriterion'));
const RubricForEvaluationPage = lazy(() => import('../pages/Evaluation/RubricForEvaluation'));
const CalificationPage = lazy(() => import('../pages/Evaluation/Calification'));
const GradesPage = lazy(() => import('../pages/Evaluation/Grades'));
const GradeDetailPage = lazy(() => import('../pages/Evaluation/GradeDetail'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const GroupsPage = lazy(() => import('../pages/GroupsPage'));
const CareersPage = lazy(() => import('../pages/CareersPage'));
const EnrollmentPage = lazy(() => import('../pages/EnrollmentPage'));

const coreRoutes = [
  {
    path: '/profile',
    title: 'Profile',
    component: Profile,
  },
  {
    path: '/forms/form-elements',
    title: 'Forms Elements',
    component: FormElements,
  },
  {
    path: '/forms/form-layout',
    title: 'Form Layouts',
    component: FormLayout,
  },
  {
    path: '/test-users',
    title: 'Test Users',
    component: TestUsers,
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
    path: '/carreras',
    title: 'Carreras',
    component: CareersPage,
  },
  {
    path: '/matricula',
    title: 'Matricular Estudiante',
    component: EnrollmentPage,
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
