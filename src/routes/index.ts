import { lazy } from 'react';

const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const TestUsers = lazy(() => import('../pages/TestUsers'));
const EvaluationPage = lazy(() => import('../pages/EvaluationPage'));
const PruebaMatricula = lazy(() => import('../pages/PruebaMatricula'));
const PruebaDocenteGrupo = lazy(() => import('../pages/PruebaDocenteGrupo'));

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
    path: '/prueba-matricula',
    title: 'Prueba Matrícula',
    component: PruebaMatricula,
  },
  {
    path: '/prueba-docente-grupo',
    title: 'Prueba Docente a Grupo',
    component: PruebaDocenteGrupo,
  },
  {
    path: '/evaluations',
    title: 'Evaluations',
    component: EvaluationPage,
  },
];

const routes = [...coreRoutes];
export default routes;


