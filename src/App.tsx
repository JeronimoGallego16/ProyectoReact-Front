import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Loader from './common/Loader';
import routes from './routes';
import ProtectedRoute from './components/Auth/ProtectedRoute'; // ajusta la ruta si es diferente

const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

function App() {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />
      <Routes>
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/unauthorized" element={
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold">🚫 Acceso denegado</h1>
            <p className="text-gray-500 mt-2">No tienes permisos para ver esta página</p>
          </div>
        } />
        <Route element={<DefaultLayout />}>
          <Route index element={<div className="py-10 text-center">Welcome</div>} />
          {routes.map((route, index) => {
            const { path, component: Component, roles } = route;
            return (
              <Route
                key={index}
                path={path}
                element={
                  <ProtectedRoute roles={roles}>
                    <Suspense fallback={<Loader />}>
                      <Component />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            );
          })}
        </Route>
      </Routes>
    </>
  );
}

export default App;