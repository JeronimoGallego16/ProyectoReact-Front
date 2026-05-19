import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import SecurityService from '../../services/segurity.service';
import SocialAuthService from '../../services/socialAuth.service';
import { LoginCredentials } from '../../models/user';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Logo from '../../images/logo/logo-uc2.png';

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const response = await SecurityService.login(credentials);
      toast.success(`¡Bienvenido, ${response?.profile?.first_name || response?.email}!`);
      navigate("/");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Email o contraseña inválidos';
      toast.error(errorMessage);
      console.error('Error al iniciar sesión:', error);
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await SocialAuthService.loginWithGoogle();
      toast.success('¡Bienvenido!');
      navigate("/");
    } catch (error: any) {
      const errorMessage = error?.message || 'No se pudo iniciar sesión con Google';
      toast.error(errorMessage);
      console.error('Error en Google login:', error);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await SocialAuthService.loginWithGithub();
      toast.success('¡Bienvenido!');
      navigate("/");
    } catch (error: any) {
      const errorMessage = error?.message || 'No se pudo iniciar sesión con GitHub';
      toast.error(errorMessage);
      console.error('Error en GitHub login:', error);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await SocialAuthService.loginWithMicrosoft();
      toast.success('¡Bienvenido!');
      navigate("/");
    } catch (error: any) {
      const errorMessage = error?.message || 'No se pudo iniciar sesión con Microsoft';
      toast.error(errorMessage);
      console.error('Error en Microsoft login:', error);
    }
  };
  return (
    <>
      <Breadcrumb pageName="Acceso" />

      <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-stretch">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="flex h-full flex-col items-center justify-start gap-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-10 py-12 text-center dark:from-boxdark dark:via-boxdark dark:to-meta-4">
              <div className="flex flex-col items-center gap-4">
                <img
                  className="w-64 max-w-full drop-shadow-sm"
                  src={Logo}
                  alt="Universidad de Caldas"
                />

                <p className="max-w-lg text-lg leading-8 text-slate-600 dark:text-bodydark">
                  Accede al sistema académico para administrar carreras, planes de estudio,
                  semestres y procesos institucionales desde un solo lugar.
                </p>
              </div>

              <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-strokedark dark:bg-boxdark/60">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Portal académico
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-white">Planes</p>
                    <p className="text-sm text-body dark:text-bodydark">Versiones por año y semestre</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-white">Grupos</p>
                    <p className="text-sm text-body dark:text-bodydark">Control de oferta activa</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black dark:text-white">Matrículas</p>
                    <p className="text-sm text-body dark:text-bodydark">Acceso rápido y seguro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full p-6 sm:p-12 xl:p-16">
              <span className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Acceso seguro
              </span>
              <h2 className="mb-3 text-3xl font-bold text-black dark:text-white sm:text-title-xl2">
                Inicia sesión en el portal
              </h2>
              <p className="mb-8 max-w-xl text-sm leading-6 text-body dark:text-bodydark">
                Usa tu correo institucional o una cuenta autorizada para entrar al sistema académico.
              </p>

              <Formik
                initialValues={{
                  email: '',
                  password: '',
                }}
                validationSchema={Yup.object({
                  email: Yup.string().email('Correo inválido').required('El correo es obligatorio'),
                  password: Yup.string().required('La contraseña es obligatoria'),
                })}
                onSubmit={(values) => {
                  handleLogin(values);
                }}
              >
                {({ handleSubmit }) => (
                  <Form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark sm:p-8">
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Correo electrónico
                      </label>
                      <Field
                        type="email"
                        name="email"
                        placeholder="correo@ucaldas.edu.co"
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:text-white"
                      />
                      <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-500" />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Contraseña
                      </label>
                      <Field
                        type="password"
                        name="password"
                        placeholder="Ingresa tu contraseña"
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:text-white"
                      />
                      <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-500" />
                    </div>

                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-xl border border-primary bg-primary px-4 py-3.5 font-medium text-white transition hover:bg-opacity-90"
                    >
                      Ingresar
                    </button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-stroke dark:border-strokedark" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.18em] text-body dark:bg-boxdark dark:text-bodydark">
                          O continúa con
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex w-full items-center justify-center gap-3.5 rounded-xl border border-stroke bg-gray px-4 py-3.5 font-medium text-black transition hover:bg-opacity-70 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-70"
                    >
                      <span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_191_13499)">
                            <path d="M19.999 10.2217C20.0111 9.53428 19.9387 8.84788 19.7834 8.17737H10.2031V11.8884H15.8266C15.7201 12.5391 15.4804 13.162 15.1219 13.7195C14.7634 14.2771 14.2935 14.7578 13.7405 15.1328L13.7209 15.2571L16.7502 17.5568L16.96 17.5774C18.8873 15.8329 19.9986 13.2661 19.9986 10.2217" fill="#4285F4" />
                            <path d="M10.2055 19.9999C12.9605 19.9999 15.2734 19.111 16.9629 17.5777L13.7429 15.1331C12.8813 15.7221 11.7248 16.1333 10.2055 16.1333C8.91513 16.1259 7.65991 15.7205 6.61791 14.9745C5.57592 14.2286 4.80007 13.1801 4.40044 11.9777L4.28085 11.9877L1.13101 14.3765L1.08984 14.4887C1.93817 16.1456 3.24007 17.5386 4.84997 18.5118C6.45987 19.4851 8.31429 20.0004 10.2059 19.9999" fill="#34A853" />
                            <path d="M4.39899 11.9777C4.1758 11.3411 4.06063 10.673 4.05807 9.99996C4.06218 9.32799 4.1731 8.66075 4.38684 8.02225L4.38115 7.88968L1.19269 5.4624L1.0884 5.51101C0.372763 6.90343 0 8.4408 0 9.99987C0 11.5589 0.372763 13.0963 1.0884 14.4887L4.39899 11.9777Z" fill="#FBBC05" />
                            <path d="M10.2059 3.86663C11.668 3.84438 13.0822 4.37803 14.1515 5.35558L17.0313 2.59996C15.1843 0.901848 12.7383 -0.0298855 10.2059 -3.6784e-05C8.31431 -0.000477834 6.4599 0.514732 4.85001 1.48798C3.24011 2.46124 1.9382 3.85416 1.08984 5.51101L4.38946 8.02225C4.79303 6.82005 5.57145 5.77231 6.61498 5.02675C7.65851 4.28118 8.9145 3.87541 10.2059 3.86663Z" fill="#EB4335" />
                          </g>
                          <defs>
                            <clipPath id="clip0_191_13499">
                              <rect width="20" height="20" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </span>
                      Continuar con Google
                    </button>

                    <button
                      type="button"
                      onClick={handleGithubLogin}
                      className="flex w-full items-center justify-center gap-3.5 rounded-xl border border-stroke bg-gray px-4 py-3.5 font-medium text-black transition hover:bg-opacity-70 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-70"
                    >
                      <span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.891 1.529 2.341 1.544 2.914 1.181.092-.916.349-1.544.635-1.9-2.22-.252-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.722a9.593 9.593 0 012.502.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.167 20 14.42 20 10c0-5.523-4.477-10-10-10z" fill="currentColor" />
                        </svg>
                      </span>
                      Continuar con GitHub
                    </button>

                    <button
                      type="button"
                      onClick={handleMicrosoftLogin}
                      className="flex w-full items-center justify-center gap-3.5 rounded-xl border border-stroke bg-gray px-4 py-3.5 font-medium text-black transition hover:bg-opacity-70 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-70"
                    >
                      <span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 2h7v7H2z" fill="#00A4EF" />
                          <path d="M11 2h7v7h-7z" fill="#7FBA00" />
                          <path d="M2 11h7v7H2z" fill="#FFB900" />
                          <path d="M11 11h7v7h-7z" fill="#F25022" />
                        </svg>
                      </span>
                      Continuar con Microsoft
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="mt-6 text-center" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;