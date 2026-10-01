/**
 * Controlador: Editar Miembro y Gestionar Afecciones (planIntegrante/editarController.js)
 * Permite cambiar los datos Demográficos Base usando validadores.
 * Además implementa en la parte inferior un Accordion (Acordeón HTML) expansible
 * para Listar, Añadir y Gestionar las "Enfermedades Médicas / Afecciones" Específicas del Sujeto.
 */
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { api } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { alertas as alerta } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { cargarDatosHelper as cargarDatos } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { adjuntarOpciones as adjuntarOpc } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { integrante as modalIntegrante } from "@/helpers/modales/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { initTomSelectPortatil } from "@/helpers/tomSelectPortatil";
import { obtenerRol } from "@/helpers/obtenerRol.js";

export default async () => {
  // Selectores UI Básicos Control
  const botonBack = document.getElementById("botonBack");
  const botonGuardar = document.getElementById("botonGuardar"); // Activa Patch Member Data
  const form = document.querySelector(".form");
  
  // PARSING DOBLE URL
  //Teniendo en las nuevas rutas el formato de URL con query params cambia.
  const hashQuery = location.hash.split("?")[1] ?? ""; // Si no hay query params, asigna string vacío para evitar errores al crear URLSearchParams
  const params = new URLSearchParams(hashQuery); // Crea instancia URLSearchParams para extraer parámetros específicos de la URL despues del signo de interrogación. Ejemplo URL: #/voluntario/plan_familiar/integrantes/editar?familia_id=123&integrante_id=456
  
  const planId = params.get("familia_id"); // Extrae el valor del parámetro "familia_id" de la URL, que identifica a qué familia pertenece el integrante que se está editando. Este ID es crucial para las operaciones de carga y actualización de datos específicas de ese integrante dentro de su familia.
  const integranteId = params.get("integrante_id"); // Extrae el valor del parámetro "integrante_id" de la URL, que identifica al miembro específico que se está editando. Este ID se utiliza para cargar los datos actuales del integrante en el formulario y para enviar las actualizaciones correctas al backend cuando se guarden los cambios.
  
  // Nodos UI Submódulo Enfermedades
  const contenedorAfecciones = document.querySelector(".gestionarAfecciones__lista",);
  const botonAñadir = document.querySelector(".gestionarAfecciones__boton"); // Trigger Modal
  
  const {esSupervisor} = obtenerRol();

  if (esSupervisor) {
    botonAñadir.classList.add("oculto");
  }

  // Bloqueo Concurrencia
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;


  // Lógica de Atrás normal Muro View
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;

    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
      return;
    }

    location.href = `#/voluntario/plan_familiar/integrantes?familia_id=${planId}`;
  };

  // Nodos Text Inputs Identidades Persona
  const nombres = document.getElementById('nombres');
  const apellidos = document.getElementById('apellidos');
  const numDocumento = document.getElementById('numeroDocumento');
  const eps = document.getElementById('eps');
  const celularPersonal = document.getElementById('celularPersonal');
  const nacimiento = document.getElementById('nacimiento');

  // Nodos Select Diccionarios App
  const tipoDocumento = document.getElementById('tiposDocumento');
  const genero = document.getElementById('generos');
  const parentesco = document.getElementById('parentescos');
  const grupoSanguineo = document.getElementById('grupoSanguineos');
  const nacionalidad = document.getElementById('nacionalidades');

  // Precarga Inyección de DOM Diccionarios DropDowns Web Opciones List Llenado (GETs)
  await adjuntarOpc.adjuntar(tipoDocumento, "documentTypes");
  await adjuntarOpc.adjuntarNoValida(genero, "genders");
  await adjuntarOpc.adjuntarNoValida(parentesco, "kinships");
  await adjuntarOpc.adjuntarNoValida(eps, "eps");
  await adjuntarOpc.adjuntarNoValida(grupoSanguineo, "bloodGroups");
  await adjuntarOpc.adjuntarNoValida(nacionalidad, "nationalities");

  // MAGIA HELPER -> Dispara 1 Get a member/$id, y mapéa automáticamente cada Propiedad JSON a su Nodo Input HTML Vainilla 
  await cargarDatos.cargarDatos(`members/${integranteId}`,
    [nombres, apellidos, numDocumento, eps, celularPersonal, nacimiento, tipoDocumento, genero, parentesco, grupoSanguineo, nacionalidad,], // Array Doms
    ["names", "last_names", "document_number", "eps_id", "phone", "birth_date", "document_type_id", "gender_id", "kinship_id", "blood_group_id", "nationality_id",], // Array DB Columns Strings
  );

  /**
   * Rutina Aislada Carga Listado Miniatura Afecciones ("Diabético", "Perro Peligoros"...) 
   */
  const cargarAfecciones = async () => {
    const afecciones = await api.get(`conditionMembers/member/${integranteId}`); // Fetcher endpoint
    contenedorAfecciones.innerHTML = ""; // Clear Layout

    afecciones.forEach((item) => {
      const boton = document.createElement("button"); // Mini badge list view clickeable !
      boton.className = "gestionarAfecciones__afeccion";
      boton.dataset.id = item.id; // PK Afeccion para Borrar/Editar luego

      const span = document.createElement("span");
      span.className = "gestionarAfecciones__tipoNombre";
      const icon = document.createElement("i");
      icon.className = "ri-eye-fill";
      span.appendChild(icon);
      span.appendChild(document.createTextNode(` ${item.condition_type.name} - ${item.name}`));
      boton.appendChild(span);
      contenedorAfecciones.appendChild(boton); // Anexar 
    });
  };

  // Ejecutar carga de Enfermedades inicial
  cargarAfecciones();

  window.procesoPeticion = false; // UX libre
  botonGuardar.disabled = false;

  // Escuchador Afeccion: Al presionar 'Añadir Discapac/Enfer', Inicia Popup (Modal Complex SweetAlert Custom HTML Injection!)
  botonAñadir.addEventListener("click", async () => {
    // Le manda por referencia quien es el 'Dueño', y la funcion delegada a ejecutar para autorefrescarse la pantalla cuando termine.
    modalIntegrante.afeccionCrear(integranteId, cargarAfecciones);
  });

  // Escuchador Burbujeante Lista Afecciones Muro List : Ver/Modificar/Borrar Enfermedad Especifica
  contenedorAfecciones.addEventListener("click", async (e) => {
    const id = e.target.closest(".gestionarAfecciones__afeccion").dataset.id; // Target Target UUID Item
    // Activa Popup Modal Custom Especial Version Action Compleja.
    modalIntegrante.verEditarEliminar(id, integranteId, cargarAfecciones, esSupervisor);
  });

  initTomSelectPortatil();

  // Listener Submit Core Form Data Personales 'PUT Update Completo'
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true;
    botonGuardar.disabled = true; // No btn se llama boton, error var? -> check below the error de 'boton' not exist vs botonGuardar. Use 'botonGuardar' directly

    // Contrato Constructor DB API PATCH/PUT Payload Array DTO
    const datosRegistro = {
      names: nombres.value,
      last_names: apellidos.value,
      birth_date: nacimiento.value,
      blood_group_id: grupoSanguineo.value,
      document_type_id: tipoDocumento.value,
      document_number: numDocumento.value,
      nationality_id: nacionalidad.value,
      gender_id: genero.value,
      kinship_id: parentesco.value,
      eps_id: eps.value,
      // Bug here en codigo Base: Se esta llamando celular.value cuando Node de arriba es celularPersonal (Posible NullPtr Reference!). Dejado intacto por politica.
      phone: celularPersonal.value,
    };

    try {
      // API Full update row 
      const data = await api.put(`members/${integranteId}`, datosRegistro);

      if (data.success) {
        await alerta.alertaOK(data.message); // Notificar exito en pantalla. NO redirige adrede para dejarlos editar enfermedades. Mantiene state UI vivo.
      } else alerta.alertaWarning(data.message, data.errors);
    } catch (error) {
      alerta.alertaError(error.errors);
    }

    // Recovery Fallbacks
    botonGuardar.disabled = false;
    window.procesoPeticion = false;
  });
};
