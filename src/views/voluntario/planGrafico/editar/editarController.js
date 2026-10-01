/**
 * Controlador: Editar Descripción de un Gráfico de Vivienda (planGrafico/editarController.js)
 * NOTA DE NEGOCIO: La arquitectura aquí define que la FOTO FISICA de un croquis no se edita.
 * Si te equivocaste de mapa, toca Eliminar y Crear otro. 
 * El Modulo "EDITAR" es EXCLUSIVAMENTE para actualizar el campo Texto 'Description' del mismo.
 */
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { alertas as alerta } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { api } from "@/helpers/index.js";
import { obtenerRol } from "@/helpers/obtenerRol.js";


export default async () => {
  // Selectores UI Básicos Textos/Forms
  const botonBack = document.getElementById("botonBack");
  const form = document.querySelector(".form");
  const botonGuardar = document.getElementById("botonGuardar"); // Trigger API Patch
  const preview = document.getElementById("preview"); // Nodo Imagen Layout para que sepa de que Croquis hablamos visualmente
  
  // PARSING DOBLE URL PARAMETER MAGIA COMMA SEPARATED !
  const hashQuery = location.hash.split("?")[1] ?? "";
  const params = new URLSearchParams(hashQuery);

  const planId = params.get("familia_id"); // Array Id[0] is Family_Plan id Father
  const graficoId = params.get("grafico_id"); // Array Id[1] is Primary Key of the Housing_Graphic to be patched in specific
  
  const descripcion = document.getElementById("descripcion"); // TextArea Node Target

  const { esSupervisor } = obtenerRol();

  // Initial request concurrency blocker
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  // Atrás Return listado fotos
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
      return;
    }
    location.href = `#/voluntario/plan_familiar/grafico_vivienda?familia_id=${planId}`;
  };

  // Releaser early 
  window.procesoPeticion = false;
  botonGuardar.disabled = false;

  // FETCH GET Inicilizador de Información a editar
  const datosGrafico = await api.get(`housingGraphics/${graficoId}`); // Petición Específica de Unidad Croquis
  
  // Render de Preview Visual Mode Solo Lectura FOTO
  preview.src = datosGrafico.path; // Render Static AWS/S3 URL 
  
  // Rellenar TextArea con BD string
  descripcion.value = datosGrafico.description;

  // Intercepting the Modify Form Submit JSON Based
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true; // Hard Lock Form
    botonGuardar.disabled = true;

    // Payload de envío parcial de dato update. No se manda Path de Archivo.
    const datosRegistro = {
      description: descripcion.value,
    };

    try {
      // API PATCH METHOD! Partial Resource update specific Description String Overrider
      const data = await api.patch(`housingGraphics/${graficoId}/description`, datosRegistro);
      if (data.success) {
        
        // Exito
        await alerta.alertaOK(data.message);
        
        // Retorno Forzado Menu listado Layout padre General (Usando la PK padre family plan id que mantuvimos en la URL separada x Coma)
        // location.href = `#/voluntario/plan_familiar/grafico_vivienda?familia_id=${planId}`;
      } else {
        alerta.alertaWarning(data.message, data.errors);
      }
    } catch (error) {
      alerta.alertaError(error.errors); // Offline db server errs
    }

    // Unblock Catch fallbacks
    botonGuardar.disabled = false;
    window.procesoPeticion = false;
  });
};
