import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from '../images/logo/logo.svg';
import SidebarLinkGroup from './SidebarLinkGroup';
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
  const [sidebarExpanded, setSidebarExpanded] = useState(
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
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/">
          <img src={Logo} alt="Logo" />
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
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
                
              {/* <!-- Menu Item Forms --> */}
              <SidebarLinkGroup
                activeCondition={
                  pathname === '/forms' || pathname.includes('forms')
                }
              >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${(pathname === '/forms' || pathname.includes('forms')) ? 'bg-graydark dark:bg-meta-4' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
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
                            d="M1.43425 7.5093H2.278C2.44675 7.5093 2.55925 7.3968 2.58737 7.31243L2.98112 6.32805H5.90612L6.27175 7.31243C6.328 7.48118 6.46862 7.5093 6.58112 7.5093H7.453C7.76237 7.48118 7.87487 7.25618 7.76237 7.03118L5.428 1.4343C5.37175 1.26555 5.3155 1.23743 5.14675 1.23743H3.88112C3.76862 1.23743 3.59987 1.29368 3.57175 1.4343L1.153 7.08743C1.0405 7.2843 1.20925 7.5093 1.43425 7.5093ZM4.47175 2.98118L5.3155 5.17493H3.59987L4.47175 2.98118Z"
                            fill=""
                          />
                          <path
                            d="M10.1249 2.5031H16.8749C17.2124 2.5031 17.5218 2.22185 17.5218 1.85623C17.5218 1.4906 17.2405 1.20935 16.8749 1.20935H10.1249C9.7874 1.20935 9.47803 1.4906 9.47803 1.85623C9.47803 2.22185 9.75928 2.5031 10.1249 2.5031Z"
                            fill=""
                          />
                          <path
                            d="M16.8749 6.21558H10.1249C9.7874 6.21558 9.47803 6.49683 9.47803 6.86245C9.47803 7.22808 9.75928 7.50933 10.1249 7.50933H16.8749C17.2124 7.50933 17.5218 7.22808 17.5218 6.86245C17.5218 6.49683 17.2124 6.21558 16.8749 6.21558Z"
                            fill=""
                          />
                          <path
                            d="M16.875 11.1656H1.77187C1.43438 11.1656 1.125 11.4469 1.125 11.8125C1.125 12.1781 1.40625 12.4594 1.77187 12.4594H16.875C17.2125 12.4594 17.5219 12.1781 17.5219 11.8125C17.5219 11.4469 17.2125 11.1656 16.875 11.1656Z"
                            fill=""
                          />
                          <path
                            d="M16.875 16.1156H1.77187C1.43438 16.1156 1.125 16.3969 1.125 16.7625C1.125 17.1281 1.40625 17.4094 1.77187 17.4094H16.875C17.2125 17.4094 17.5219 17.1281 17.5219 16.7625C17.5219 16.3969 17.2125 16.1156 16.875 16.1156Z"
                            fill="white"
                          />
                        </svg>
                        Forms
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${open ? 'rotate-180' : ''}`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${!open ? 'hidden' : ''}`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to="/forms/form-elements"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              Form Elements
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="/forms/form-layout"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              Form Layout
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Menu Item Forms --> */}

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

              {/* <!-- Menu Item Inscribir en Grupo (CU-07) --> */}
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

              {/* <!-- Menu Item Auth Pages --> */}
              <SidebarLinkGroup
                activeCondition={
                  pathname === '/auth' || pathname.includes('auth')
                }
              >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          (pathname === '/auth' || pathname.includes('auth')) &&
                          'bg-graydark dark:bg-meta-4'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="19"
                          viewBox="0 0 18 19"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_130_9814)">
                            <path
                              d="M12.7127 0.55835H9.53457C8.80332 0.55835 8.18457 1.1771 8.18457 1.90835V3.84897C8.18457 4.18647 8.46582 4.46772 8.80332 4.46772C9.14082 4.46772 9.45019 4.18647 9.45019 3.84897V1.88022C9.45019 1.82397 9.47832 1.79585 9.53457 1.79585H12.7127C13.3877 1.79585 13.9221 2.33022 13.9221 3.00522V15.0709C13.9221 15.7459 13.3877 16.2802 12.7127 16.2802H9.53457C9.47832 16.2802 9.45019 16.2521 9.45019 16.1959V14.2552C9.45019 13.9177 9.16894 13.6365 8.80332 13.6365C8.43769 13.6365 8.18457 13.9177 8.18457 14.2552V16.1959C8.18457 16.9271 8.80332 17.5459 9.53457 17.5459H12.7127C14.0908 17.5459 15.1877 16.4209 15.1877 15.0709V3.03335C15.1877 1.65522 14.0627 0.55835 12.7127 0.55835Z"
                              fill=""
                            />
                            <path
                              d="M10.4346 8.60205L7.62207 5.7333C7.36895 5.48018 6.97519 5.48018 6.72207 5.7333C6.46895 5.98643 6.46895 6.38018 6.72207 6.6333L8.46582 8.40518H3.45957C3.12207 8.40518 2.84082 8.68643 2.84082 9.02393C2.84082 9.36143 3.12207 9.64268 3.45957 9.64268H8.49395L6.72207 11.4427C6.46895 11.6958 6.46895 12.0896 6.72207 12.3427C6.83457 12.4552 7.00332 12.5114 7.17207 12.5114C7.34082 12.5114 7.50957 12.4552 7.62207 12.3145L10.4346 9.4458C10.6877 9.24893 10.6877 8.85518 10.4346 8.60205Z"
                              fill=""
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_130_9814">
                              <rect
                                width="18"
                                height="18"
                                fill="white"
                                transform="translate(0 0.052124)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        Authentication
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && 'rotate-180'
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && 'hidden'
                        }`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to="/auth/signin"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              Sign In
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="/auth/signup"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              Sign Up
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Menu Item Auth Pages --> */}
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default Sidebar;