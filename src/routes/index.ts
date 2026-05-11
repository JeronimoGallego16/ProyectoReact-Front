import { lazy } from 'react';

const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const TestUsers = lazy(() => import('../pages/TestUsers'));
const EvaluationPage = lazy(() => import('../pages/EvaluationPage'));
const TableTest = lazy(() => import('../pages/TableTest'));
const RubricsPage = lazy(() => import('../pages/Evaluation/Rubrics'));
const CriteriaByRubricPage = lazy(() => import('../pages/Evaluation/CriteriaByRubric'));
const ScalesByCriterionPage = lazy(() => import('../pages/Evaluation/ScalesByCriterion'));

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
    path: '/evaluations',
    title: 'Evaluations',
    component: EvaluationPage,
  },
  {
    path: '/table-test',
    title: 'Table Test',
    component: TableTest,
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
  }
];

const routes = [...coreRoutes];
export default routes;
