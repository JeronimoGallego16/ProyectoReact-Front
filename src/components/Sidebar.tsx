import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from '../images/logo/logo-uc2.png';
// SidebarLinkGroup removed (auth links were deleted)
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
  );

  const user = useSelector((state: RootState) => state.user.user);
  const isAdmin = user?.role === 'ADMIN';

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-center gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/">
          <img src={Logo} alt="Logo" className="h-[150px]" />
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="ml-auto block lg:hidden"
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              MENU
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Menu Item Dashboard */}
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`}
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 8.25L9 3l6 5.25V15a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15V8.25zM9 5.25L4.5 9V15h3v-3.75h3V15h3V9L9 5.25z" fill="" />
                  </svg>
                  Dashboard
                </NavLink>
              </li>
              {/* <!-- Menu Item Rubrics --> */}
              <li>
                  <NavLink
                      to="/rubrics"
                        className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`}
                  >
                      <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                          <path
                              d="M16.5 2.25H1.5C0.675 2.25 0 2.925 0 3.75V14.25C0 15.075 0.675 15.75 1.5 15.75H16.5C17.325 15.75 18 15.075 18 14.25V3.75C18 2.925 17.325 2.25 16.5 2.25ZM16.5 14.25H1.5V3.75H16.5V14.25ZM3 6.75H15V8.25H3V6.75ZM3 9.75H11.25V11.25H3V9.75Z"
                              fill=""
                          />
                      </svg>
                      Rúbricas
                  </NavLink>
              </li>

              {/* <!-- Menu Item Evaluations --> */}  
              <li>
                  <NavLink
                      to="/evaluations"
                        className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`}
                  >
                      <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                          <path
                              d="M16.5 2.25H1.5C0.675 2.25 0 2.925 0 3.75V14.25C0 15.075 0.675 15.75 1.5 15.75H16.5C17.325 15.75 18 15.075 18 14.25V3.75C18 2.925 17.325 2.25 16.5 2.25ZM16.5 14.25H1.5V3.75H16.5V14.25ZM3 6.75H15V8.25H3V6.75ZM3 9.75H11.25V11.25H3V9.75Z"
                              fill=""
                          />
                      </svg>
                      Evaluaciones
                  </NavLink>
              </li>

              {/* <!-- Menu Item Grades --> */}
              <li>
                  <NavLink
                      to="/grades"
                      className={({ isActive }) =>
                          `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                              isActive && 'bg-graydark dark:bg-meta-4'
                          }`
                      }
                  >
                      <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                          <path
                              d="M16.5 2.25H1.5C0.675 2.25 0 2.925 0 3.75V14.25C0 15.075 0.675 15.75 1.5 15.75H16.5C17.325 15.75 18 15.075 18 14.25V3.75C18 2.925 17.325 2.25 16.5 2.25ZM16.5 14.25H1.5V3.75H16.5V14.25ZM3 6.75H15V8.25H3V6.75ZM3 9.75H11.25V11.25H3V9.75Z"
                              fill=""
                          />
                      </svg>
                      Notas
                  </NavLink>
              </li>

              {isAdmin && (
                <>
                  {/* <!-- Menu Item Academic (Carreras y Semestres) --> */}
                  <li>
                    <NavLink
                      to="/academic"
                      className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`}
                    >
                      <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M2 2h14v3H2zM2 7h14v3H2zM2 12h14v3H2z" fill="" />
                      </svg>
                      Carreras y Semestres
                    </NavLink>
                  </li>

                  {/* <!-- Menu Item Academic (Asignaturas y Planes de estudio) --> */}
                  <li>
                    <NavLink
                      to="/academic/subjects"
                      className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`}
                    >
                      <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 3h10v3H4zM4 8h10v3H4zM4 13h10v2H4z" fill="" />
                      </svg>
                      Asignaturas
                    </NavLink>
                  </li>

                  {/* <!-- Menu Item Academic (Planes de estudio) --> */}
                  <li>
                    <NavLink
                      to="/academic/study-plans"
                      className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`}
                    >
                      <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M3 2h12v2H3zM3 5h12v2H3zM3 8h12v2H3zM3 11h12v2H3z" fill="" />
                      </svg>
                      Plan de estudios
                    </NavLink>
                  </li>
                </>
              )}

              {/* Menu Item Usuarios */}
              {isAdmin && (
                <li>
                  <NavLink
                    to="/usuarios"
                    className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname === '/usuarios' && 'bg-graydark dark:bg-meta-4'}`}
                  >
                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.8754 11.6719C15.5379 10.7781 13.9129 10.2875 12.2379 10.2875C10.7004 10.2875 9.31191 10.7313 8.1754 11.4625C8.05628 11.0313 7.3854 10.75 6.1879 10.75C4.90628 10.75 3.93066 11.0813 3.10316 11.5625C1.50066 12.5563 0.750049 14.3031 0.750049 16.2625V17.25C0.750049 17.8125 1.16191 18.25 1.75316 18.25H14.2504C14.8129 18.25 15.225 17.8281 15.225 17.2625V16.2625C15.225 15.05 14.9785 13.9625 14.5754 13.0938C13.5379 13.5406 12.3254 13.8344 11.025 13.8344C9.90941 13.8344 8.86566 13.6156 7.94066 13.2406C7.84691 13.4719 7.79316 13.7313 7.79316 14C7.79316 16.1219 9.42316 17.8344 11.5879 17.8344C13.7526 17.8344 15.3004 16.1219 15.3004 14C15.3004 13.2156 15.0848 12.4875 14.6992 11.875C14.8254 12.025 14.9629 12.1562 15.1129 12.2719C16.3879 13.3813 17.9754 13.8219 19.5129 13.8219C19.8879 13.8219 20.25 13.8031 20.6129 13.7625V11.75C20.6129 10.3969 19.6379 9.19688 18.3004 8.99063C18.7129 8.45938 19.0879 7.875 19.3129 7.23438C20.2879 4.60625 18.8379 1.76875 16.1254 1.25C13.4129 0.731251 10.5754 2.1875 9.60066 4.8125C9.37566 5.44375 9.2254 6.09375 9.1504 6.75C8.47316 6.54063 7.70316 6.40625 6.88128 6.40625C5.04066 6.40625 3.31191 7.00938 2.04316 8.05L0.838013 6.8375C0.315451 6.315 -0.0570489 5.8375 0.00184609 5.2375C0.060451 4.6375 0.435451 4.1562 0.957826 3.9375C0.957826 3.8625 0.962264 3.7875 0.962264 3.7125C0.962264 1.62188 2.61191 -0.0171875 4.70316 -0.0171875C6.79441 -0.0171875 8.44066 1.62188 8.44066 3.7125C8.44066 4.1281 8.39691 4.5375 8.31066 4.93437C8.96566 4.45312 9.77566 4.125 10.6629 4.125C11.6879 4.125 12.6379 4.43125 13.4004 4.94375L12.0379 6.30625C11.4004 5.84062 10.5629 5.5 9.60066 5.5C8.46566 5.5 7.47316 6.05938 6.88128 6.8875C5.95628 6.88437 5.07191 7.0125 4.26566 7.225C2.49441 7.6625 0.987264 8.60625 0.214139 10.0406C-0.569609 11.5375 -0.0850989 13.2687 1.36066 14.4875C2.29691 15.2938 3.45316 15.8094 4.6004 16.0875C5.86066 16.4 7.2379 16.5969 8.7254 16.5969C9.45628 16.5969 10.1629 16.55 10.8379 16.4563C10.8379 16.5937 10.8254 16.725 10.8254 16.85V17.2469C10.8254 17.8188 10.4379 18.25 9.85941 18.25H1.75316C1.16191 18.25 0.750049 17.8125 0.750049 17.25V16.2625C0.750049 14.3031 1.50066 12.5563 3.10316 11.5625C3.93066 11.0813 4.90628 10.75 6.1879 10.75C7.3854 10.75 8.05628 11.0313 8.1754 11.4625C9.31191 10.7313 10.7004 10.2875 12.2379 10.2875C13.9129 10.2875 15.5379 10.7781 16.8754 11.6719Z" fill="" />
                    </svg>
                    Usuarios
                  </NavLink>
                </li>
              )}

              {/* Menu Item Grupos */}
              {isAdmin && (
                <li>
                  <NavLink
                    to="/grupos"
                    className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname === '/grupos' && 'bg-graydark dark:bg-meta-4'}`}
                  >
                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 2.25C5.02031 2.25 1.875 5.39531 1.875 9.375C1.875 13.3547 5.02031 16.5 9 16.5C12.9797 16.5 16.125 13.3547 16.125 9.375C16.125 5.39531 12.9797 2.25 9 2.25ZM9 15C5.51016 15 2.75 12.2398 2.75 8.75C2.75 5.26016 5.51016 2.5 9 2.5C12.4898 2.5 15.25 5.26016 15.25 8.75C15.25 12.2398 12.4898 15 9 15Z" fill="" />
                      <path d="M9 5.5C8.47969 5.5 8 5.96484 8 6.5C8 7.03516 8.47969 7.5 9 7.5C9.52031 7.5 10 7.03516 10 6.5C10 5.96484 9.52031 5.5 9 5.5Z" fill="" />
                      <path d="M6.5 10C5.97969 10 5.5 10.4648 5.5 11C5.5 11.5352 5.97969 12 6.5 12C7.02031 12 7.5 11.5352 7.5 11C7.5 10.4648 7.02031 10 6.5 10Z" fill="" />
                      <path d="M11.5 10C10.9797 10 10.5 10.4648 10.5 11C10.5 11.5352 10.9797 12 11.5 12C12.0203 12 12.5 11.5352 12.5 11C12.5 10.4648 12.0203 10 11.5 10Z" fill="" />
                    </svg>
                    Grupos
                  </NavLink>
                </li>
              )}

              {/* Menu Item Matricula */}
              {isAdmin && (
                <li>
                  <NavLink
                    to="/matricula"
                    className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname === '/matricula' && 'bg-graydark dark:bg-meta-4'}`}
                  >
                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 2.25C5.02031 2.25 1.875 5.39531 1.875 9.375C1.875 13.3547 5.02031 16.5 9 16.5C12.9797 16.5 16.125 13.3547 16.125 9.375C16.125 5.39531 12.9797 2.25 9 2.25ZM9 15C5.51016 15 2.75 12.2398 2.75 8.75C2.75 5.26016 5.51016 2.5 9 2.5C12.4898 2.5 15.25 5.26016 15.25 8.75C15.25 12.2398 12.4898 15 9 15Z" fill="" />
                      <path d="M9 5.5C8.47969 5.5 8 5.96484 8 6.5C8 7.03516 8.47969 7.5 9 7.5C9.52031 7.5 10 7.03516 10 6.5C10 5.96484 9.52031 5.5 9 5.5Z" fill="" />
                      <path d="M6.5 10C5.97969 10 5.5 10.4648 5.5 11C5.5 11.5352 5.97969 12 6.5 12C7.02031 12 7.5 11.5352 7.5 11C7.5 10.4648 7.02031 10 6.5 10Z" fill="" />
                      <path d="M11.5 10C10.9797 10 10.5 10.4648 10.5 11C10.5 11.5352 10.9797 12 11.5 12C12.0203 12 12.5 11.5352 12.5 11C12.5 10.4648 12.0203 10 11.5 10Z" fill="" />
                    </svg>
                    Matricular Estudiante
                  </NavLink>
                </li>
              )}

              {isAdmin && (
                <li>
                  <NavLink
                    to="/academic/enroll-student"
                    className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname === '/academic/enroll-student' &&
                      'bg-graydark dark:bg-meta-4'
                      }`}
                  >
                    <svg
                      className="fill-current"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9 2.25C5.02031 2.25 1.875 5.39531 1.875 9.375C1.875 13.3547 5.02031 16.5 9 16.5C12.9797 16.5 16.125 13.3547 16.125 9.375C16.125 5.39531 12.9797 2.25 9 2.25ZM9 15C5.51016 15 2.75 12.2398 2.75 8.75C2.75 5.26016 5.51016 2.5 9 2.5C12.4898 2.5 15.25 5.26016 15.25 8.75C15.25 12.2398 12.4898 15 9 15Z" fill="" />
                      <path d="M6 7.5H12V9H6zM6 10.5H12V12H6z" fill="" />
                    </svg>
                    Inscribir en Grupo
                  </NavLink>
                </li>
              )}

              {/* Tables removed */}

              {/* Settings removed */}
            </ul>
          </div>

          {/* <!-- Others Group --> */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              OTHERS
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Chart removed */}

              {/* UI Elements removed */}

              {/* Authentication links removed */}
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default Sidebar;