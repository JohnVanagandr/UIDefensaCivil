/**
 * Controlador: Editar Datos Mascota y Gestión de Historial de Vacunación (planMascota/editarController.js)
 * Carga el perfil actual de la mascota y sus vacunas registradas en la base de datos.
 * Orquesta todos los eventos de actualización de perfil, creación de vacunas en tiempo real,
 * edición y eliminación con doble confirmación, y gestiona las redirecciones basadas en el rol.
 * Sigue la estructura de tarjeta_gestion donde el componente visual retorna el elemento DOM.
 * 
 * @module editarController
 */
import { api } from "@/helpers/index.js";
import { alertas as alerta } from "@/helpers/index.js";
import { VistaMascotas, VacunaModal } from "@/componentes/mascotas/index.js";
import { tarjetaChip } from "@/componentes/tarjetaChip.js";
import { validacionInputs as validacion, fechas, adjuntarOpciones as adjuntarOpc } from "@/helpers/index.js";
import { initTomSelectPortatil } from "@/helpers/tomSelectPortatil.js";
import { obtenerRol } from "@/helpers/obtenerRol.js";

/**
 * Inicializa el controlador de edición de mascota
 */
export default async () => {
  const hashQuery = location.hash.split("?")[1] ?? "";
  const params = new URLSearchParams(hashQuery);
  const {esSupervisor} = obtenerRol();

  const planId = params.get("familia_id");
  const mascotaId = params.get("mascota_id");

  /** @type {Array} Estado local mutable del listado de vacunas sincronizado con la BD */
  let vaccines = [];

  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = false;

  // Lógica Botón Atrás
  const botonBack = document.getElementById("botonBack");
  botonBack.onclick = () => {
    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
      return;
    }
    location.href = `#/voluntario/plan_familiar/mascotas?familia_id=${planId}`;
  };

  // Carga inicial del perfil de mascota y sus vacunas desde el servidor
  let petData = null;
  if (mascotaId) {
    petData = await api.get(`pets/${mascotaId}`);
    vaccines = await api.get(`petVaccines/pet/${mascotaId}`) || [];
  }

  // Instancia el componente visual de mascotas (retorna el nodo del formulario síncronamente)
  const form = VistaMascotas({
    esSupervisor: esSupervisor
  });

  // Obtener referencias de elementos del DOM internos del formulario
  const nombreInput = form.querySelector("#nombre");
  const razaInput = form.querySelector("#raza");
  const edadInput = form.querySelector("#edad");
  const especiesSelect = form.querySelector("#especies");
  const generosSelect = form.querySelector("#generos");
  const btnAgregarVacuna = form.querySelector("#btnAgregarVacuna");
  const listaDiv = form.querySelector(".gestionarAfecciones__lista");
  const btnGuardar = form.querySelector("#botonGuardar");

  const contenedorMascota = document.getElementById("contenedor-mascota");
  if (contenedorMascota) {
    contenedorMascota.innerHTML = ""; // Limpiar
    contenedorMascota.appendChild(form);
    
    // Carga de opciones de Dropdowns en el controlador
    await adjuntarOpc.adjuntar(especiesSelect, "species");
    await adjuntarOpc.adjuntarNoValida(generosSelect, "animalGenders");

    // Inyección de datos previos cargados
    if (petData) {
      nombreInput.value = petData.name || "";
      razaInput.value = petData.breed || "";
      if (petData.birth_date) {
        const isoDate = petData.birth_date.split("T")[0];
        edadInput.value = fechas.formatearFecha(isoDate);
        edadInput.dataset.isoDate = isoDate;
      } else {
        edadInput.value = "";
        edadInput.dataset.isoDate = "";
      }
      especiesSelect.value = petData.species_id || "";
      generosSelect.value = petData.animal_gender_id || "";
    }

    initTomSelectPortatil();

    // Inicializar calendarios AirDatepicker
    fechas.initFechas();
  }

  // Inicializar validador automático sobre el formulario
  validacion.validadorAutomatico.init(form);

  // Helper local para renderizar las vacunas
  const renderVaccines = (list) => {
    listaDiv.innerHTML = "";

    if (!list || list.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.classList.add("gestionarAfecciones__vacio");
      emptyMsg.textContent = "No hay vacunas registradas.";
      listaDiv.appendChild(emptyMsg);
      return;
    }

    list.forEach((vacuna) => {
      const tag = tarjetaChip({
        labelText: `${vacuna.name} - ${fechas.formatearFecha(vacuna.date)}`,
        id: vacuna.id,
        esSupervisor,
        onEdit: () => {
          // Callback al editar vacuna (en base de datos directamente)
          const modal = VacunaModal({
            initialData: vacuna,
            birthDate: edadInput.dataset.isoDate || edadInput.value
          });
          document.body.appendChild(modal);

          const formModal = modal.querySelector("form");
          const btnCancelar = modal.querySelector(".modal-edicion__btn--secundario");
          const btnGuardarVac = modal.querySelector(".modal-edicion__btn--primario");
          const inputNombre = modal.querySelector(".form__nombreVacuna");
          const inputFecha = modal.querySelector(".form__fechaVacuna");

          const closeModal = () => {
            modal.close();
            modal.remove();
          };
          btnCancelar.addEventListener("click", closeModal);
          modal.addEventListener("mousedown", (e) => {
            if (e.target.closest(".air-datepicker")) return;
            if (e.target === modal) closeModal();
          });

          const bDate = edadInput.dataset.isoDate || edadInput.value;
          let minDate = null;
          if (bDate) {
            const parts = bDate.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            d.setDate(d.getDate() + 1); // un día después del nacimiento
            minDate = d;
          }

          fechas.initModalDatepicker(inputFecha, {
            modal,
            formModal,
            maxDate: new Date(),
            minDate
          });
          validacion.validadorAutomatico.init(formModal);

          btnGuardarVac.addEventListener("click", async () => {
            const isValid = validacion.validadorAutomatico.validarTodo(formModal);
            if (!isValid) return;

            try {
              const res = await api.patch(`petVaccines/${vacuna.id}`, {
                name: inputNombre.value,
                date: inputFecha.value
              });
              if (res && res.success) {
                // Refresca la lista desde la API
                vaccines = await api.get(`petVaccines/pet/${mascotaId}`) || [];
                renderVaccines(vaccines);
                closeModal();
                await alerta.alertaOK(res.message);
              } else if (res) {
                alerta.alertaWarning(res.message, res.errors);
              }
            } catch (err) {
              alerta.alertaError(err.errors || err.message);
            }
          });

          modal.showModal();
        },
        onDelete: async () => {
          // Callback al eliminar vacuna (en base de datos directamente)
          const confirmacion = await alerta.alertaQuest(
            "¿Seguro que deseas eliminar esta vacuna de la mascota?"
          );
          if (!confirmacion.isConfirmed) return;

          try {
            const res = await api.delet(`petVaccines/${vacuna.id}`);
            if (res && res.success) {
              await alerta.alertaOK(res.message);
              // Refresca la lista local
              vaccines = await api.get(`petVaccines/pet/${mascotaId}`) || [];
              renderVaccines(vaccines);
            } else if (res) {
              alerta.alertaError(res.message);
            }
          } catch (err) {
            alerta.alertaError(err.errors || err.message);
          }
        }
      });
      listaDiv.appendChild(tag);
    });
  };

  if (!esSupervisor) {
    btnAgregarVacuna.addEventListener("click", () => {
      const modal = VacunaModal({
        birthDate: edadInput.dataset.isoDate || edadInput.value
      });
      document.body.appendChild(modal);

      const formModal = modal.querySelector("form");
      const btnCancelar = modal.querySelector(".modal-edicion__btn--secundario");
      const btnGuardarVac = modal.querySelector(".modal-edicion__btn--primario");
      const inputNombre = modal.querySelector(".form__nombreVacuna");
      const inputFecha = modal.querySelector(".form__fechaVacuna");

      const closeModal = () => {
        modal.close();
        modal.remove();
      };
      btnCancelar.addEventListener("click", closeModal);
      modal.addEventListener("mousedown", (e) => {
        if (e.target.closest(".air-datepicker")) return;
        if (e.target === modal) closeModal();
      });

      const bDate = edadInput.dataset.isoDate || edadInput.value;
      let minDate = null;
      if (bDate) {
        const parts = bDate.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() + 1); // un día después del nacimiento
        minDate = d;
      }

      fechas.initModalDatepicker(inputFecha, {
        modal,
        formModal,
        maxDate: new Date(),
        minDate
      });
      validacion.validadorAutomatico.init(formModal);

      btnGuardarVac.addEventListener("click", async () => {
        const isValid = validacion.validadorAutomatico.validarTodo(formModal);
        if (!isValid) return;

        try {
          const res = await api.post("petVaccines", {
            name: inputNombre.value,
            date: inputFecha.value,
            pet_id: mascotaId
          });
          if (res && res.success) {
            // Refresca la lista desde la API
            vaccines = await api.get(`petVaccines/pet/${mascotaId}`) || [];
            renderVaccines(vaccines);
            closeModal();
            await alerta.alertaOK(res.message);
          } else if (res) {
            alerta.alertaWarning(res.message, res.errors);
          }
        } catch (err) {
          alerta.alertaError(err.errors || err.message);
        }
      });

      modal.showModal();
    });
  }

  // Manejar el submit del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validar inputs
    const isValid = validacion.validadorAutomatico.validarTodo(form);
    if (!isValid) return;

    // Validar fechas de vacunas
    const birthDate = edadInput.dataset.isoDate || edadInput.value;
    if (birthDate) {
      const invalidVaccines = vaccines.filter(v => v.date <= birthDate);
      if (invalidVaccines.length > 0) {
        alerta.alertaWarning(
          "Conflicto en vacunas",
          `La fecha de las vacunas debe ser posterior al nacimiento (${birthDate}).`
        );
        return;
      }
    }

    if (window.procesoPeticion) return;
    window.procesoPeticion = true;
    btnGuardar.disabled = true;

    const datosRegistro = {
      name: nombreInput.value,
      breed: razaInput.value,
      birth_date: edadInput.dataset.isoDate || edadInput.value,
      species_id: especiesSelect.value,
      animal_gender_id: generosSelect.value,
    };

    try {
      // Ejecuta la actualización parcial del perfil
      const data = await api.patch(`pets/${mascotaId}`, datosRegistro);
      if (data && data.success) {
        await alerta.alertaOK(data.message);
        // Redirección según rol de usuario
        if (esSupervisor) {
          location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
        } else {
          location.href = `#/voluntario/plan_familiar/mascotas?familia_id=${planId}`;
        }
      } else if (data) {
        alerta.alertaWarning(data.message, data.errors);
      }
    } catch (error) {
      alerta.alertaError(error.errors || error.message);
    }

    btnGuardar.disabled = false;
    window.procesoPeticion = false;
  });

  // Render inicial de vacunas
  renderVaccines(vaccines);
};
