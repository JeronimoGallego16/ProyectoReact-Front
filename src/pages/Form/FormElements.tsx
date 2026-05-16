import { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import CheckboxFive from '../../components/CheckboxFive';
import CheckboxFour from '../../components/CheckboxFour';
import CheckboxOne from '../../components/CheckboxOne';
import CheckboxThree from '../../components/CheckboxThree';
import CheckboxTwo from '../../components/CheckboxTwo';
import VerticalTextFormCard, { type VerticalTextFormField } from '../../components/VerticalTextFormCard';
import ModalLauncher from '../../components/ModalLauncher';
import SwitcherFour from '../../components/SwitcherFour';
import SwitcherOne from '../../components/SwitcherOne';
import SwitcherThree from '../../components/SwitcherThree';
import SwitcherTwo from '../../components/SwitcherTwo';

// Datos de prueba para VerticalTextFormCard con campos de tipo select
const subjectsOptions = [
  { id: 1, label: 'Matemáticas I', value: 'math-1' },
  { id: 2, label: 'Matemáticas II', value: 'math-2' },
  { id: 3, label: 'Física General', value: 'physics-1' },
  { id: 4, label: 'Programación I', value: 'prog-1' },
  { id: 5, label: 'Programación II', value: 'prog-2' },
  { id: 6, label: 'Base de Datos', value: 'db-1' },
  { id: 7, label: 'Ingeniería de Software', value: 'se-1' },
  { id: 8, label: 'Cálculo Diferencial', value: 'calc-1' },
];

const semesterOptions = [
  { id: 1, label: 'Primer Semestre', value: 'semester-1' },
  { id: 2, label: 'Segundo Semestre', value: 'semester-2' },
  { id: 3, label: 'Tercer Semestre', value: 'semester-3' },
  { id: 4, label: 'Cuarto Semestre', value: 'semester-4' },
  { id: 5, label: 'Quinto Semestre', value: 'semester-5' },
  { id: 6, label: 'Sexto Semestre', value: 'semester-6' },
  { id: 7, label: 'Séptimo Semestre', value: 'semester-7' },
  { id: 8, label: 'Octavo Semestre', value: 'semester-8' },
];

const creditsOptions = [
  { id: 1, label: '1 Crédito', value: '1' },
  { id: 2, label: '2 Créditos', value: '2' },
  { id: 3, label: '3 Créditos', value: '3' },
  { id: 4, label: '4 Créditos', value: '4' },
];

const selectableFields: VerticalTextFormField[] = [
  {
    name: 'subject',
    label: 'Asignatura',
    kind: 'select',
    options: subjectsOptions,
    placeholder: 'Selecciona una asignatura',
    required: true,
  },
  {
    name: 'semester',
    label: 'Semestre Sugerido',
    kind: 'select',
    options: semesterOptions,
    placeholder: 'Selecciona un semestre',
    required: true,
  },
  {
    name: 'credits',
    label: 'Créditos',
    kind: 'select',
    options: creditsOptions,
    placeholder: 'Selecciona los créditos',
    required: true,
  },
];

const anotherSelectableFields: VerticalTextFormField[] = [
  {
    name: 'career',
    label: 'Carrera',
    kind: 'select',
    options: [
      { id: 1, label: 'Ingeniería en Sistemas', value: 'sys-eng' },
      { id: 2, label: 'Ingeniería Civil', value: 'civ-eng' },
      { id: 3, label: 'Ingeniería Mecánica', value: 'mech-eng' },
    ],
    placeholder: 'Selecciona una carrera',
    required: true,
  },
  {
    name: 'status',
    label: 'Estado',
    kind: 'select',
    options: [
      { id: 1, label: 'Activo', value: 'active' },
      { id: 2, label: 'Inactivo', value: 'inactive' },
    ],
    required: true,
  },
];

const FormElements = () => {
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);

  return (
    <>
      <Breadcrumb pageName="FormElements" />

      <div className="mb-9 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Formulario de carrera</h3>
            <p className="mt-1 text-sm text-body dark:text-bodydark">Se abre como modal con campos de texto y textarea.</p>
          </div>
<<<<<<< HEAD
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            Abrir modal
          </button>
          <ModalLauncher isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
=======
          <ModalLauncher
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
              >
                Abrir modal
              </button>
            )}
          >
>>>>>>> 30dc716ceb9a5057a59ad2d05c2fa23c73d28ea3
            {(close) => (
              <VerticalTextFormCard
                title="Formulario de carrera"
                description="Código, nombre y descripción, con acciones al final."
                fields={[
                  {
                    name: 'codigo_carrera',
                    label: 'Código',
                    placeholder: 'Escribe el código de la carrera',
                  },
                  {
                    name: 'nombre_carrera',
                    label: 'Nombre',
                    placeholder: 'Escribe el nombre de la carrera',
                  },
                  {
                    name: 'descripcion_carrera',
                    label: 'Descripción',
                    kind: 'textarea',
                    rows: 5,
                    placeholder: 'Escribe la descripción de la carrera',
                  },
                ]}
                onSave={(values) => {
                  console.log('Formulario guardado', values);
                  close();
                }}
                onCancel={() => {
                  console.log('Edición cancelada');
                  close();
                }}
              />
            )}
          </ModalLauncher>
        </div>
      </div>

      <div className="mb-9 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Formulario de asignatura</h3>
            <p className="mt-1 text-sm text-body dark:text-bodydark">Se abre como modal con campos de texto y textarea.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSubjectModalOpen(true)}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            Abrir modal
          </button>
        </div>

        {isSubjectModalOpen ? (
          <VerticalTextFormCard
            title="Formulario de asignatura"
            description="Incluye código, nombre, descripción y créditos."
            fields={[
              {
                name: 'codigo_asignatura',
                label: 'Código',
                placeholder: 'Escribe el código de la asignatura',
              },
              {
                name: 'nombre_asignatura',
                label: 'Nombre',
                placeholder: 'Escribe el nombre de la asignatura',
              },
              {
                name: 'descripcion_asignatura',
                label: 'Descripción',
                kind: 'textarea',
                rows: 5,
                placeholder: 'Escribe la descripción de la asignatura',
              },
              {
                name: 'creditos_asignatura',
                label: 'Créditos',
                placeholder: 'Escribe los créditos de la asignatura',
              },
            ]}
            onSave={(values) => {
              console.log('Formulario guardado', values);
              setIsSubjectModalOpen(false);
            }}
            onCancel={() => {
              console.log('Edición cancelada');
              setIsSubjectModalOpen(false);
            }}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
        <div className="flex flex-col gap-9">
          {/* <!-- Input Fields --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Input Fields
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Default Input
                </label>
                <input
                  type="text"
                  placeholder="Default Input"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Active Input
                </label>
                <input
                  type="text"
                  placeholder="Active Input"
                  className="w-full rounded-lg border-[1.5px] border-primary bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
                />
              </div>

              <div>
                <label className="mb-3 block font-medium text-black dark:text-white">
                  Disabled label
                </label>
                <input
                  type="text"
                  placeholder="Disabled label"
                  disabled
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary dark:disabled:bg-black"
                />
              </div>
            </div>
          </div>

          {/* <!-- Toggle switch input --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Toggle switch input
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <SwitcherOne />
              <SwitcherTwo />
              <SwitcherThree />
              <SwitcherFour />
            </div>
          </div>

          {/* <!-- Time and date --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Time and date
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Date picker
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="custom-input-date custom-input-date-1 w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Select date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="custom-input-date custom-input-date-2 w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* <!-- File upload --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                File upload
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Attach file
                </label>
                <input
                  type="file"
                  className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Attach file
                </label>
                <input
                  type="file"
                  className="w-full rounded-md border border-stroke p-3 outline-none transition file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-[#EEEEEE] file:py-1 file:px-2.5 file:text-sm file:font-medium focus:border-primary file:focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-strokedark dark:file:bg-white/30 dark:file:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-9">
          {/* <!-- Textarea Fields --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Textarea Fields
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Default textarea
                </label>
                <textarea
                  rows={6}
                  placeholder="Default textarea"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                ></textarea>
              </div>

              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Active textarea
                </label>
                <textarea
                  rows={6}
                  placeholder="Active textarea"
                  className="w-full rounded-lg border-[1.5px] border-primary bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
                ></textarea>
              </div>

              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Disabled textarea
                </label>
                <textarea
                  rows={6}
                  disabled
                  placeholder="Disabled textarea"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary dark:disabled:bg-black"
                ></textarea>
              </div>
            </div>
          </div>

          {/* <!-- Checkbox and radio --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Checkbox and radio
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <CheckboxOne />
              <CheckboxTwo />
              <CheckboxThree />
              <CheckboxFour />
              <CheckboxFive />
            </div>
          </div>

          {/* <!-- Select input --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Select input
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Select Country
                </label>
                <div className="relative z-20 bg-white dark:bg-form-input">
                  <span className="absolute top-1/2 left-4 z-30 -translate-y-1/2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g opacity="0.8">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.0007 2.50065C5.85852 2.50065 2.50065 5.85852 2.50065 10.0007C2.50065 14.1428 5.85852 17.5007 10.0007 17.5007C14.1428 17.5007 17.5007 14.1428 17.5007 10.0007C17.5007 5.85852 14.1428 2.50065 10.0007 2.50065ZM0.833984 10.0007C0.833984 4.93804 4.93804 0.833984 10.0007 0.833984C15.0633 0.833984 19.1673 4.93804 19.1673 10.0007C19.1673 15.0633 15.0633 19.1673 10.0007 19.1673C4.93804 19.1673 0.833984 15.0633 0.833984 10.0007Z"
                          fill="#637381"
                        ></path>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M0.833984 9.99935C0.833984 9.53911 1.20708 9.16602 1.66732 9.16602H18.334C18.7942 9.16602 19.1673 9.53911 19.1673 9.99935C19.1673 10.4596 18.7942 10.8327 18.334 10.8327H1.66732C1.20708 10.8327 0.833984 10.4596 0.833984 9.99935Z"
                          fill="#637381"
                        ></path>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.50084 10.0008C7.55796 12.5632 8.4392 15.0301 10.0006 17.0418C11.5621 15.0301 12.4433 12.5632 12.5005 10.0008C12.4433 7.43845 11.5621 4.97153 10.0007 2.95982C8.4392 4.97153 7.55796 7.43845 7.50084 10.0008ZM10.0007 1.66749L9.38536 1.10547C7.16473 3.53658 5.90275 6.69153 5.83417 9.98346C5.83392 9.99503 5.83392 10.0066 5.83417 10.0182C5.90275 13.3101 7.16473 16.4651 9.38536 18.8962C9.54325 19.069 9.76655 19.1675 10.0007 19.1675C10.2348 19.1675 10.4581 19.069 10.6159 18.8962C12.8366 16.4651 14.0986 13.3101 14.1671 10.0182C14.1674 10.0066 14.1674 9.99503 14.1671 9.98346C14.0986 6.69153 12.8366 3.53658 10.6159 1.10547L10.0007 1.66749Z"
                          fill="#637381"
                        ></path>
                      </g>
                    </svg>
                  </span>
                  <select className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-12 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input">
                    <option value="">USA</option>
                    <option value="">UK</option>
                    <option value="">Canada</option>
                  </select>
                  <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g opacity="0.8">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                          fill="#637381"
                        ></path>
                      </g>
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-black dark:text-white">
                  Multiselect Dropdown
                </label>
                <div className="relative z-20 w-full rounded border border-stroke p-1.5 pr-8 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input">
                  <div className="flex flex-wrap items-center">
                    <span className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30">
                      Design
                      <span className="cursor-pointer pl-2 hover:text-danger">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </span>
                    </span>
                    <span className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30">
                      Development
                      <span className="cursor-pointer pl-2 hover:text-danger">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </span>
                    </span>
                  </div>
                  <select
                    name=""
                    id=""
                    className="absolute top-0 left-0 z-20 h-full w-full bg-transparent opacity-0"
                  >
                    <option value="">Option</option>
                    <option value="">Option</option>
                  </select>
                  <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g opacity="0.8">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                          fill="#637381"
                        ></path>
                      </g>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VerticalTextFormCard con campos select */}
      <div className="mb-9 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Campos Seleccionables con Dropdown</h3>
            <p className="mt-1 text-sm text-body dark:text-bodydark">Ejemplo con 3 campos mezclando el mismo formulario base.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            Abrir modal
          </button>
        </div>

        {isModalOpen ? (
          <VerticalTextFormCard
            title="Campos Seleccionables con Dropdown"
            description="Ejemplo 1: 3 campos (Asignatura, Semestre, Créditos) usando kind: 'select'"
            fields={selectableFields}
            onSave={(values) => {
              console.log('Formulario guardado:', values);
              alert(`Valores guardados:\n${JSON.stringify(values, null, 2)}`);
              setIsModalOpen(false);
            }}
            onCancel={() => {
              console.log('Edición cancelada');
              setIsModalOpen(false);
            }}
          />
        ) : null}
      </div>

      <div className="mb-9 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Ejemplo modal extra</h3>
            <p className="mt-1 text-sm text-body dark:text-bodydark">Otro array de campos, también en modal.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsExtraModalOpen(true)}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            Abrir modal
          </button>
        </div>

        {isExtraModalOpen ? (
          <VerticalTextFormCard
            title="Otro Ejemplo: 2 campos diferentes"
            description="Ejemplo 2: 2 campos (Carrera, Estado) - mismo componente, otro array de fields"
            fields={anotherSelectableFields}
            onSave={(values) => {
              console.log('Formulario guardado:', values);
              alert(`Carrera: ${values.career}\nEstado: ${values.status}`);
              setIsExtraModalOpen(false);
            }}
            onCancel={() => {
              setIsExtraModalOpen(false);
            }}
          />
        ) : null}
      </div>
    </>
  );
};

export default FormElements;
