import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom'; // ← quita useNavigate
import { Toaster } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { clearUser } from './store/userSlice';

import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Loader from './common/Loader';
import routes from './routes';
import ProtectedRoute from './components/Auth/ProtectedRoute';

const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp < now) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch(clearUser());
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(clearUser());
      }
    } else {
      dispatch(clearUser());
    }

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