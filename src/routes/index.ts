import { lazy } from 'react';

const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const EvaluationPage = lazy(() => import('../pages/EvaluationPage'));
const TableTest = lazy(() => import('../pages/TableTest'));

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
    path: '/evaluations',
    title: 'Evaluations',
    component: EvaluationPage,
  },
  {
    path: '/table-test',
    title: 'Table Test',
    component: TableTest,
  },
];

const routes = [...coreRoutes];
export default routes;
