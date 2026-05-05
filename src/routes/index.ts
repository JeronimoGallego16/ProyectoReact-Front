import { lazy } from 'react';

const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
<<<<<<< HEAD
const TestUsers = lazy(() => import('../pages/TestUsers'));
=======
const EvaluationPage = lazy(() => import('../pages/EvaluationPage'));
>>>>>>> 51dd1296afdfe4165c436e45bab868124b455a9c

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
<<<<<<< HEAD
    path: '/test-users',
    title: 'Test Users',
    component: TestUsers,
=======
    path: '/evaluations',
    title: 'Evaluations',
    component: EvaluationPage,
>>>>>>> 51dd1296afdfe4165c436e45bab868124b455a9c
  },
];

const routes = [...coreRoutes];
export default routes;
