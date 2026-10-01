/**
 * Controlador: Editar Entorno/Foto Vivienda (planEntorno/editarController.js)
 * Permite al usuario subir una nueva imagen del entorno de la vivienda 
 * (como fachada o riesgos aledaños), revisar que cumpla con el peso y formato
 * permitido, y reemplazar cualquier foto anterior vinculada al plan familiar.
 */
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { alertas as alerta } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { api } from "@/helpers/index.js";
import { obtenerRol } from "@/helpers/obtenerRol.js";

export default async () => {

  // Referencias a los contenedores y botones de la pantalla
  const botonBack = document.getElementById("botonBack"); // Botón superior de volver
  const id = location.hash.split("=")[1]; // Extracción del número interno del plan familiar

  const btnSubir = document.querySelector(".subir_btn");
  const form = document.querySelector(".form"); // Zona o sección que agrupa la carga del archivo
  const boton = document.querySelector(".form__boton"); // Botón principal inferior para registrar la foto

  const id_HousingInfoType = 2; //2 = grafico Entorno

  const familyPlan = await api.get(`familyPlans/${id}`);
  
  const { esSupervisor } = obtenerRol();

  if (familyPlan.status_plan_id === 6 || familyPlan.status_plan_id === 7) {

    boton.classList.add("oculto");

    btnSubir.classList.add("oculto");
  }

  // Elementos individuales centrados en manipular la imagen
  const input = document.getElementById("imagenInput"); // El cajón invisible original donde se seleccionan archivos
  const preview = document.getElementById("preview"); // Área reservada para pintar una vista previa de la foto seleccionada
  const imagenTitulo = document.querySelector(".imagen__titulo"); // Letrero explicativo posicionado encima de la foto

  // Reglas fijas y constantes permitidas para no congestionar el sistema con imágenes extra peadas
  const TAMANO_MAX_MB = 2; // Límite máximo establecido en Megabytes
  const TAMANO_MAX_BYTES = TAMANO_MAX_MB * 1024 * 1024; // Conversión matemática estricta a Bytes exactos (medida digital básica)
  const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"]; // Filtro permitiendo estrictamente fotografías

  // Mecanismo preventivo para que el usuario no colapse el sistema si toca varias veces la pantalla
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  // Lógica funcional al tocar la flecha superior de ir hacia atrás
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return; // Si algo está cargando de fondo, se interrumpe y previene la salida

    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
      return;
    }
    location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
  };

  // Primera consulta: El sistema revisa si el usuario ya le había asignado una foto previa a esta vivienda
  const existeData = await api.get(`housingInfo/${id}/type/${id_HousingInfoType}`);
  const existe = existeData !== null && existeData !== undefined;

  if (existe) {
    preview.src = existeData.path;
    preview.style.display = "block";
    imagenTitulo.textContent = "Vista previa de la imagen actual";
  } else {
    imagenTitulo.textContent = "No se ha agregado una imagen aún";
  }

  window.procesoPeticion = false;
  boton.disabled = false;

  // Vigilante dinámico: Alerta cuando el usuario abre la ventana y escoge con su celular o escritorio una foto nueva
  input.addEventListener("change", async () => {
    const file = input.files[0]; // Captura temporalmente la foto que el usuario acaba de seleccionar
    if (!file) return; // Si al final de cuentas el usuario cerró la ventana sin escoger nada, anulamos el proceso

    // Primer filtro: Prohibir a la fuerza cualquier formato raro o no visual como PDFs o audios
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      input.value = ""; // Vacia la memoria borrando un posible archivo fallido contenido adentro
      preview.style.display = "none";
      return alerta.alertaWarning(
        "Formato no permitido. Solo JPG, PNG o WEBP.",
      );
    }

    // Segundo filtro: Evitar fotografías inmensas que pasen el límite definido arriba
    if (file.size > TAMANO_MAX_BYTES) {
      input.value = ""; // Borramos y denegamos
      preview.style.display = "none";
      return alerta.alertaWarning(
        `La imagen no puede superar los ${TAMANO_MAX_MB}MB`,
      );
    }

    // Si el archivo pasa los escrutinios: Se pinta provisionalmente un adelanto usando funciones locales en el explorador
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block"; // Habilita su visibilidad
    imagenTitulo.textContent = "Vista previa de la imagen seleccionada"; // Actualiza el mensaje hacia el usuario
  });

  // Operación a ejecutar cuando presiona contundentemente el botón grande "Enviar" o "Guardar"
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true;
    boton.disabled = true; // Bloquea momentáneamente el uso del botón para no accionar envíos paralelos

    const file = input.files[0];

    // Verificación final del archivo, en dado caso que un astuto haya borrado o ignorado lo anterior
    if (!file) {
      boton.disabled = false;
      window.procesoPeticion = false;
      return alerta.alertaWarning("Selecciona un archivo primero");
    }
    if (file.size > TAMANO_MAX_BYTES) {
      boton.disabled = false;
      window.procesoPeticion = false;
      return alerta.alertaWarning(
        `La imagen no puede superar los ${TAMANO_MAX_MB}MB`,
      );
    }

    // Estructura envolvente requerida tecnicamente para trasladar la fotografía pesada desde la pantalla hacia el servidor web
    const formData = new FormData();
    formData.append("path", file); // Asignando como valor de ruta el archivo real pesado
    formData.append("family_plan_id", id); // Integrando secretamente el código numérico de identificación
    formData.append("housing_info_type_id", id_HousingInfoType);

    try {
      // Regla de reemplazo: Si anteriormente dedujimos que existía una foto, la eliminaremos del servidor 
      const existeAhoraData = await api.get(`housingInfo/${id}/type/${id_HousingInfoType}`);
      const existeAhora = existeAhoraData !== null && existeAhoraData !== undefined;

      const data = existeAhora
        ? await api.postImagen(`housingInfo/${id}/type/${id_HousingInfoType}`, formData)
        : await api.postImagen(`housingInfo`, formData);

      // Subida forjada usando el conducto especializado para información multimedia
      // const data = await api.postImagen(`housingInfo`, formData);

      // Retroalimentación visual evaluando éxito
      if (data.success) {
        await alerta.alertaOK(data.message);
        // Devolvemos al usuario a su menú particular forzando un redireccionamiento
        location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
      } else {
        alerta.alertaWarning(data.message, data.errors);
      }
    } catch (error) {
      alerta.alertaError(error.errors); // Problema súbito posiblemente debido a desconexión al momento del envío
    }

    // Retiro de bloqueos
    boton.disabled = false;
    window.procesoPeticion = false;
  });

};
