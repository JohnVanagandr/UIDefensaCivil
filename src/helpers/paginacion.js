/**
 * Helper de Paginación de Registros (paginacion.js)
 * Controlador central para manejar listas largas de datos traídos del backend.
 * Genera dinámicamente los botones de página (1, 2, 3... Siguiente) y renderiza
 * las tarjetas (cards) de datos a medida que el usuario navega, evitando sobrecargar la RAM.
 */
import * as api from "./api";
import { obtenerRol } from "@/helpers/obtenerRol.js";

// Recibe la URL de la api, el texto a mostrar si hay 0 resultados, y la función 'carta' que construye el HTML visual.
const paginacion = async (peticion, mensajeVacio, carta) => {
    // Contenedor mayor donde van las tarjetas (cards)
    const container = document.querySelector(".container__paginas");
    // Barra inferior donde van los numeritos de página
    const containerPaginador = document.querySelector(".container__paginador");

    containerPaginador.classList.add("oculto");
    
    const { esSupervisor, esVoluntario } = obtenerRol();

    let paginaActual = 1;

    // 1. Averigua el tamaño de la metadata preguntando al endpoint
    const paginas = await api.getPaginacion(peticion);
    const cantidad = paginas.paginate.last_page; // Total de hojas/páginas

    // 2. Comprueba si hay al menos 1 registro
    const evaluacion = await evaluarDatos();

    if (!evaluacion) {
        // 3. Renderiza números y la página default (1)
        await paginador();
        await cargarPagina();

        // 4. Si sobran números para llenar 1 página base, oculta la barra de paginación por innecesaria
        // if (paginas.paginate.total <= paginas.paginate.per_page) {
        //     containerPaginador.classList.add("invisible");
        // }

        // 4. MOSTRAR EL PAGINADOR SOLO SI HAY MÁS DE 1 PÁGINA
        if (paginas.paginate.total > paginas.paginate.per_page) {
            containerPaginador.classList.remove("oculto");
        }

        window.procesoPeticion = false
    }
    else {
        // Alternativa: Si hay cero, imprime el warning de vacío inyectando el msj
        const divVacio = document.createElement("div");
        divVacio.classList.add("noCantidad");
        divVacio.textContent = mensajeVacio;
        container.replaceChildren(divVacio);
        window.procesoPeticion = false;
    }

    // 5. Escucha activa (Event Delegation). Espera clicks en los numeritos inferiores.
    containerPaginador.addEventListener("click", async (e) => {
        // Si hace click en un botón de clase válido y no estamos a medio descargar 
        if (e.target.classList.contains("paginador__numero") && !window.procesoPeticion) {
            if (paginaActual == e.target.id) return; // Evita re-cargar la misma pestaña en la que ya está
            paginaActual = e.target.id;
            paginador(); // Re-dibuja cintillo numerado
            cargarPagina(); // Re-descarga JSON de registros
        }
    });


    // ==========================================
    // LOGICA QUE PINTA LOS BOTONES NUMÉRICOS INFERIORES
    // ==========================================
    async function paginador() {

        containerPaginador.innerHTML = ""; // Limpia la barra numerada 

        // Caso simple: Menos de 10 hojas de datos totales
        if (cantidad <= 10) {
            for (let cont = 1; cont <= cantidad; cont++) {
                const contenedor = document.createElement("button");
                contenedor.classList.add("paginador__numero");
                // Selecciona en CSS el botón actual para iluminarlo
                cont == paginaActual ? contenedor.classList.add("paginador__numero--activo") : "";
                contenedor.id = cont;
                contenedor.textContent = cont;
                containerPaginador.appendChild(contenedor);
            }
        }
        else { // Caso Complejo: Mas de 10 páginas (Se achica mostrando '<<' ATRÁS y ADELANTE '>>')

            // Construye Botón 'Atrás'
            const botonAtras = document.createElement("button");
            botonAtras.classList.add("paginador__numero");
            botonAtras.id = paginaActual != 1 ? Number(paginaActual) - 1 : paginaActual;
            const iconoAtras = document.createElement("i");
            iconoAtras.classList.add("ri-arrow-left-wide-line");
            botonAtras.append(iconoAtras);
            containerPaginador.appendChild(botonAtras);

            let numeroCasillas = 0;
            let numeroEmpieza = 0;

            if (paginaActual != 1) {
                numeroEmpieza = paginaActual; // Corre el cursor para la derecha
                numeroCasillas = Number(numeroEmpieza) + 9;

                // Limite truncado si se acerca al final del último bloque de 10
                if (numeroCasillas > cantidad) {
                    numeroCasillas = cantidad;
                    numeroEmpieza = Number(cantidad) - 9
                }
            }
            else {
                numeroCasillas = 10;
                numeroEmpieza = 1;
            }

            // Dibuja los números del bloque actual
            for (numeroEmpieza; numeroEmpieza <= numeroCasillas; numeroEmpieza++) {
                const contenedor = document.createElement("button");
                contenedor.classList.add("paginador__numero");
                numeroEmpieza == paginaActual ? contenedor.classList.add("paginador__numero--activo") : "";
                contenedor.id = numeroEmpieza;
                contenedor.textContent = numeroEmpieza;
                containerPaginador.appendChild(contenedor);
            }

            // Construye Botón 'Adelante'
            const botonSiguiente = document.createElement("button");
            botonSiguiente.classList.add("paginador__numero");
            botonSiguiente.id = (Number(paginaActual) + 1) > cantidad ? cantidad : Number(paginaActual) + 1;
            const iconoSiguiente = document.createElement("i");
            iconoSiguiente.classList.add("ri-arrow-right-wide-line");
            botonSiguiente.append(iconoSiguiente); 
            containerPaginador.appendChild(botonSiguiente);
        }
    }

    // ==========================================
    // LOGICA QUE DESCARGA LA INFO Y LLAMA EL MOLDE
    // ==========================================
    async function cargarPagina() {
        container.innerHTML = ""; // Limpia la parrilla vieja de datos
        // Vuelve a pegarle a la API anexando explícitamente el parámetro ?page=XX que manda Laravel
        const datos = await api.get(`${peticion}?page=${paginaActual}`);

        // Ejecuta el Inversor de Control sobre cada record, delegando al archivo Controlador 
        // original (VoluntarioController por ej.) el como dibujar y mutar su `cartaInfo` específica.
        for (const dato in datos) {

            let info = datos[dato];

            const cartaInfo = await carta(info);

            if (esSupervisor && (info.status_id == 5 || info.status_id == 3 || info.status_id == 2 || info.status_id == 1)) {
                cartaInfo.querySelectorAll("button").forEach(btn => btn.style.display = "none");

            } else if (esVoluntario && (info.status_id == 4 || info.status_id == 6 || info.status_id == 7)) {
                cartaInfo.querySelectorAll("button").forEach(btn => btn.style.display = "none");
            }

            container.appendChild(cartaInfo); // Ensambla pieza
        }
    }

    // Auxiliar para veredicto vacío
    async function evaluarDatos() {
        if (paginas.paginate.total == 0) {
            return true
        }

        return false;
    }
}

export default paginacion;
