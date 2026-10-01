/**
 * Controlador: Editor Update de Recurso Disponible (planRecurso/editarController.js)
 * Pre-rellena todo un formulario con datos existentes (Hospital 2, 2Km..)
 * para corregirlos y actualizalos en base de datos.
 * Emplea set estricto de Validaciones Client Side Keydown Event Native.
 */
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { api } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { alertas as alerta } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { validacionInputs as validacion } from "@/helpers/index.js"; // Suite Validacion Estricta Vainilla DOM
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { cargarDatosHelper as cargarDatos } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { adjuntarOpciones as adjuntarOpc } from "@/helpers/index.js";

import { initTomSelectPortatil } from "@/helpers/tomSelectPortatil";

import { obtenerRol } from "@/helpers/obtenerRol.js";


export default async () => {
  // Manejo Base DOM Window Document
  const botonBack = document.getElementById("botonBack");
  const botonGuardar = document.getElementById("botonGuardar"); // Action Patcher Update Method Trigger Handler Element 
  const form = document.querySelector(".form");

  // PARSING DOBLE URL
  const hashQuery = location.hash.split("?")[1] ?? ""; // Get 'id=PlanID,RecursoID' String Formater Style
  const params = new URLSearchParams(hashQuery);

  const planId = params.get("familia_id"); // Target URL Regreso Plan Padre
  const recursoId = params.get("recurso_id"); // Target ID EndPoint Target
  
  const {esSupervisor} = obtenerRol();
  
  // Lock Flow Concurrency
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;



  // Abort and Return 
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
      return;
    }
    location.href = `#/voluntario/plan_familiar/recursos?familia_id=${planId}`;
  };

  // Nodos Inputs HTML Targets
  const telefono = document.getElementById("telefono");
  const descripcion = document.getElementById("descripcion");
  const distancia = document.getElementById("distancia"); // En Metros!
  const ubicacion = document.getElementById("ubicacion"); // Addr

  // Nodos Data Selectors Linked 
  const recurso = document.getElementById("recursos");
  const servicio = document.getElementById("servicio");

  // Carga Lista Selectora Cascading Dependencies Array Map Function Helper (e.g. Si escoges Hospital, abajo sale Sub-list Servicio: Urgencias, Sangre, Etc)
  await adjuntarOpc.adjuntarDouble(recurso, "resources", servicio, 'service');

  // Auto-Fill Form from Server Response API GET Model By ID
  await cargarDatos.cargarDatos(`availableResources/${recursoId}`, [telefono, descripcion, distancia, ubicacion, recurso, servicio], ["phone", "description", "distance", "location", "resource_id", "resource_name"]);

  /**
   * --- VALIDATORS NATIVE LISTENERS EN TIEMPO REAL EVENT-DRIVEN ---
   * Escucha "KeyDown" y detiene la propagacion (e.preventDefault interno en helper)
   * Si rompen las reglas (eg presionar 'a' en un telefono)
   */
  telefono.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 10);
    validacion.keyboard_numero(e);
  });
  descripcion.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 200);
  });
  ubicacion.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 100);
  });
  distancia.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 5); // 5 digits maxmts
    validacion.keyboard_numero(e);
  });

  // Blurs: Quitar Border Box Error CSS State on Out-Focus After Error Type 
  telefono.addEventListener("blur", () => {
    validacion.limpiarError(telefono);
  });
  descripcion.addEventListener("blur", () => {
    validacion.limpiarError(descripcion);
  });
  ubicacion.addEventListener("blur", () => {
    validacion.limpiarError(ubicacion);
  });
  distancia.addEventListener("blur", () => {
    validacion.limpiarError(distancia);
  });
  recurso.addEventListener("change", () => {
    validacion.limpiarError(recurso);
  });
  servicio.addEventListener("blur", () => {
    validacion.limpiarError(servicio);
  });

  window.procesoPeticion = false;
  botonGuardar.disabled = false;

  initTomSelectPortatil();

  // Intercepting The User Update Push Intent Local Block Action And Verification Server Push Update. 
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true; // Hardlock Multiple form clicks Network Request Spams Prevent
    botonGuardar.disabled = true;

    // --- ASERCIONES Y RESTRICCIONES REQUERIMIENTOS MINIMOS ---
    // Fuerza longitud Minima caracteres. Si no, resalta rojo y aborta Front.
    let validarDescripcion = validacion.validar_minimo(descripcion, 15); // Descripciones elaboradas, no "ok"
    let validarUbicacion = validacion.validar_minimo(ubicacion, 5);
    let validarDistancia = validacion.validar_minimo(distancia, 1);
    let validarTelefono = validacion.validar_minimo(telefono, 5);
    let validarRecurso = validacion.validar_select(recurso);
    let validarServicio = validacion.validar_vacio(servicio);

    // Check If all Truthy Assertions Valid Passed Through Array Check Values
    if (
      validarDescripcion &&
      validarUbicacion &&
      validarDistancia &&
      validarTelefono &&
      validarRecurso &&
      validarServicio
    ) {
      // JSON Constructor For Patch Payload Formater 
      const datosRegistro = {
        resource_id: recurso.value,
        description: descripcion.value,
        location: ubicacion.value,
        distance: distancia.value, // number Format Metters Wait Db Type Casting Numeric Cast
        phone: telefono.value,
      };

      try {
        // Ejecución Real del Query Patch / Update Controller Method Route Endpoints Application
        const data = await api.patch(`availableResources/${recursoId}`, datosRegistro);

        if (data.success) {
          // Si DB Respondió Code 200.. OK Redirect..
          await alerta.alertaOK(data.message);
          window.location.href = `#/voluntario/plan_familiar/recursos?familia_id=${planId}`; // Bug detected in code here 'planRecursos' instead 'planRecurso'? Ignoring as its outside instruction 
        } else alerta.alertaWarning(data.message, data.errors);
      } catch (error) {
        alerta.alertaError(error.errors); // Connection DB loss Net Down Timeout Axios API Generic Wrapper Class 
      }
    }

    // Free the form interaction UI States Recovery Error Release Finally Loop Method Scope Exit Points And Event Resets 
    botonGuardar.disabled = false;
    window.procesoPeticion = false;
  });
};
