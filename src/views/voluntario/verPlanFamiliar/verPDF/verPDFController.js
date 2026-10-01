/**
 * Controlador de Vista Previa del PDF (verPDFController.js)
 * Carga el PDF del plan familiar de forma dinámica y lo renderiza dentro de un iframe.
 * Consume la petición binaria desde los helpers y el maquetado DOM desde el componente ver_pdf.
 */

import { api, alertas as alerta } from "@/helpers/index.js";
import { verPdfComponent } from "@/componentes/ver_pdf/verpdf.js";
import { obtenerRol } from "@/helpers/obtenerRol.js";

/**
 * Controlador principal para la visualización del PDF del Plan Familiar.
 * 
 * @async
 * @function VerPDFController
 * @param {Object} [parametros] - Parámetros provistos por el enrutador de la aplicación.
 * @param {string} [parametros.familia_id] - Identificador único del plan familiar.
 * @returns {Promise<void>} No retorna ningún valor. Inyecta el visualizador en el DOM.
 */
const VerPDFController = async (parametros) => {
    // Obtiene el ID de la familia. Se prioriza el objeto de parámetros del enrutador.
    // Si no está definido, se extrae del Hash de la URL actual (Ej: "#/voluntario/.../ver_pdf?familia_id=123" -> "123")
    const id = parametros?.familia_id || location.hash.split("=")[1];
    
    // Si no se encuentra un ID válido, se muestra una alerta de error y se regresa a la pantalla anterior
    if (!id) {
        alerta.alertaError("No se proporcionó el identificador del Plan Familiar.");
        window.history.back();
        return;
    }

    // Ubica el contenedor de la página principal en el layout común (index.html)
    const contenedor = document.querySelector(".container__paginas");
    if (!contenedor) return;
    contenedor.innerHTML = ""; // Limpia el contenido previo para evitar duplicados al recargar la vista

    // Configura el botón físico de retroceso (botonBack) en la barra superior común
    const botonBack = document.getElementById("botonBack");
    const {esSupervisor} = obtenerRol();
    const base = esSupervisor ? "supervisor" : "voluntario"; // Determina la base de la ruta según el rol
    
    if (botonBack) {
        botonBack.onclick = () => {
            // Evita clics múltiples mientras hay peticiones activas
            if (window.procesoPeticion) return; 
            // Retorna al menú principal de navegación de este plan familiar
            location.href = `#/${base}/plan_familiar/familia?familia_id=${id}`;
        };
    }

    try {
        // Consume el helper de API getPdfBlob para traer los bytes brutos en un Blob PDF limpio
        const blob = await api.getPdfBlob(`pdf/${id}`);

        if (!blob) {
            throw new Error("No se pudo descargar el archivo PDF desde el backend.");
        }

        // Crea dirección temporal segura en el navegador apuntando al Blob
        const urlBlob = window.URL.createObjectURL(blob);

        /**
         * LDescarga local del archivo PDF.
         * Genera dinámicamente una etiqueta de enlace virtual en el DOM y
         * gatilla la descarga rápida usando la referencia del Blob local.
         */
        const handleDownload = () => {
            const a = document.createElement("a");
            a.href = urlBlob;
            a.download = `Plan_Familiar_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        };

        // Generar la interfaz del visualizador llamando al componente responsivo (Pasándole la lógica como callback)
        const viewerContainer = verPdfComponent(urlBlob, handleDownload);

        // Inyección final del componente en la página
        contenedor.appendChild(viewerContainer);

    } catch (error) {
        console.error("Error al intentar renderizar el PDF:", error);
        alerta.alertaError("No fue posible generar o previsualizar el PDF de este plan familiar.");
    }
};

export default VerPDFController;
