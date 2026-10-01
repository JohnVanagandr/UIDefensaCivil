/**
 * Módulo de Enrutamiento principal (router.js)
 * Controlador estilo SPA (Single Page Application) basado en el "hash" de la URL.
 * Se encarga de procesar la URL, validar el acceso del usuario, y cargar dinámicamente
 * el HTML de las vistas ("views") junto con la ejecución de sus controladores JS.
 */

// Importa el árbol de rutas configuradas para toda la aplicación
import { routes } from "./routers";
// Importa utilidades gráficas para el display de alertas en pantalla
import * as alerta from "../helpers/alertas";
import { isAuth, isAuthorize } from "../helpers/auth";
import * as api from "../helpers/api";
import { obtenerRol } from "@/helpers/obtenerRol.js";

const viewTemplates = import.meta.glob("../views/**/*.html", { as: "raw" });

export const router = async (main) => {

    // Encontrar la ruta desde el hash (#)
    const hash = location.hash.slice(1);

    let arregloHash = hash.split("/");

    let residuo = arregloHash.pop();

    // Separar la ruta URL de los queryParams
    arregloHash = [...arregloHash, ...residuo.split("?")];

    // recorrer todas las rutas
    const [ruta, parametros] = recorrerRutas(routes, arregloHash);

    // si el usuario esta autenticado devolvera al home respectivo de cada rol, de lo contrario devolvera al "/"
    if (isAuth()) {

        const rutasPublicas = ["", "/", "/#", "/login", "/register"];
        if (rutasPublicas.includes(hash)) {
            volverHome(hash);
            return;
        }
        
    } else {

        const rutasPublicas = ["", "/", "/#", "/login", "/register", "/forgotPassword", "/verificar_codigo", "/cambiar_password"];
            if (!rutasPublicas.includes(hash)) {
            window.location.hash = "";
            return;
        }
    }
    
    // si la ruta no es encontrada:
    if (!ruta) {
        volverHome(hash);
        alerta.alertaMensaje(`Error 404: Página no encontrada. Serás redirigido a tu página de inicio.`)
        return;
    }

    //deestructurar la configuracion (objeto config)
    const { private: esPrivada, layout: tieneLayout, permissions } = ruta.config;

    if (esPrivada && !isAuth()) {
        console.log("Error")
    }

    // verificar que el usuario tenga permisos especificos
    if (!tienePermisos(permissions)) {
        limpiarLayout(main);
        const h2 = document.createElement("h2");
        h2.textContent = "No tienes permisos para acceder a esta sección";
        main.appendChild(h2);
        return;
    }

    // VALIDACIONES DE RUTAS ESPECIFICAS Y SEGURIDAD ADICIONAL
    
    corregirQueryParams(hash);
    
    validarRol(hash);
    
    removerBotonHeader(arregloHash);

    if(await ocultarEditarUrl(hash)) return;

    if(await ocultarUrlFamilia(hash)) return;
    

    // --------------------------------------------------------

    // Si la route tiene guard y este no cumple con la condicion me llevara a una dirección especifica
    if (ruta.guard && !ruta.guard()) {
        window.location.hash = `#/${ruta.guardRedirect}`;
        return;
    }

    if (ruta.path) {
        await cargarVista(ruta.path, main);
    }

    // Asegurar que las vistas del supervisor tengan la clase container--supervisor para el padding lateral del aside
    const { esSupervisor } = obtenerRol();

    const container = document.querySelector(".container");
    if (container) {
        if (esSupervisor) {
            container.classList.add("container--supervisor");
        } else {
            container.classList.remove("container--supervisor");
        }
    }

    await ruta.controlador(parametros);

}

// funcion encargada de limpiar toda la vista
const limpiarLayout = (main) => {
    main.innerHTML = "";
}

const corregirQueryParams = (hash) => {

    const segmentos = hash.split("/"); // Divide el hash en segmentos por "/" Ej: "/plan_familiar/datos/familia_id=1" → ["/plan_familiar", "datos", "familia_id=1"]

    const indice = segmentos.findIndex(segmento => segmento.includes("=") && !segmento.includes("?")); // Busca el índice del primer segmento que tenga "=" pero no tenga "?" Ej: "familia_id=1" tiene "=" y no tiene "?" → es un param mal formado

    if (indice !== -1) {

        const ruta = segmentos.slice(0, indice).join("/"); // Toma todos los segmentos antes del índice y los une como la ruta Ej: ["/plan_familiar", "datos"] → "/plan_familiar/datos"

        const params = segmentos.slice(indice).join("&");  // Toma todos los segmentos desde el índice y los une con "&" como query params Ej: ["familia_id=1", "otro_id=2"] → "familia_id=1&otro_id=2"

        const corregido = `${ruta}?${params}`;  // Une la ruta y los params con "?" para formar la URL corregida Ej: "/plan_familiar/datos?familia_id=1&otro_id=2"

        window.location.hash = `#${corregido}`; // Actualiza el hash con la URL corregida

        return true; // Retorna true para indicar que hubo corrección y detener la ejecución del router
    }

    return false;
}

const ocultarEditarUrl = async (hash) => {

    const { esSupervisor, esVoluntario } = obtenerRol();

    const segmentos = hash.split("/");
    const tieneEditar = segmentos.some(segmento => segmento.split("?")[0] === 'editar');
    const estaEnPlan = hash.includes("plan_familiar/");

    if (!estaEnPlan || !tieneEditar) return;

    const queryString = hash.split("?")[1] || "";
    const params = new URLSearchParams(queryString);
    const familia_id = params.get("familia_id");

    if (!familia_id) return true;

    const plan = await api.get(`familyPlans/${familia_id}`);

    if (plan.status_plan_id === 6 || plan.status_plan_id === 7) {
        if (esSupervisor) {
            window.location.hash = "#/supervisor/plan_familiar";
            alerta.alertaMensaje(`Este plan familiar ya fue aprobado o rechazado definitivamente y no se puede editar, te redirigiremos al listado de planes familiares`);
            return true; // Detener flujo
        }
        
        if (esVoluntario) {
            window.location.hash = "#/voluntario/plan_familiar";
            alerta.alertaMensaje(`Este plan familiar ya fue aprobado o rechazado definitivamente y no se puede editar, te redirigiremos al listado de planes familiares`);
            return true; // Detener flujo
        }
    }
    return false; // no hubo redirección, continuar
}

const ocultarUrlFamilia = async (hash) => {

    const { esSupervisor, esVoluntario } = obtenerRol();

    if (!hash.includes("familia_id") && !hash.includes("plan_familiar/")) return;

    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    const familiaId = params.get("familia_id") ?? params.get("id");

    if (!familiaId) return;

    const plan = await api.get(`familyPlans/${familiaId}`);

    if (esVoluntario) {
        if (plan.status_plan_id === 4 || plan.status_plan_id === 6 || plan.status_plan_id === 7) {
            alerta.alertaMensaje(`Este plan familiar ya fue enviado por voluntario y no se puede acceder directamente`);
            location.replace("#/voluntario/plan_familiar");
            return true;
        }
    }

    if (esSupervisor) {
        if (plan.status_plan_id === 1 || plan.status_plan_id === 2 || plan.status_plan_id === 3 || plan.status_plan_id === 5) {
            alerta.alertaMensaje(`Este plan familiar aún no ha sido enviado por el voluntario, no se puede acceder directamente hasta que el voluntario lo envíe para revisión`);
            location.replace("#/supervisor/plan_familiar");
            return true;
        }
    }
    return false;
}

const volverHome = async (hash) => {
    const roleId = parseInt(localStorage.getItem('role_id'));

    const homes = {
        1: "#/administrador",
        2: "#/supervisor",
        3: "#/voluntario"
    };

    if (homes[roleId]) window.location.hash = homes[roleId];
};

const validarRol = async (hash) => {

    const roleId = parseInt(localStorage.getItem('role_id'));

    const homes = {
        1: "#/administrador",
        2: "#/supervisor",
        3: "#/voluntario"
    };

    const rolEnURL = [
        { segmento: "voluntario", roleId: 3 },
        { segmento: "supervisor", roleId: 2 },
        { segmento: "administrador", roleId: 1 },
    ];

    const rolEncontrado = rolEnURL.find(rol => {
        return hash.includes(rol.segmento);
    });

    if (rolEncontrado && rolEncontrado.roleId !== roleId) {

        window.location.hash = homes[roleId];
        alerta.alertaMensaje(`Esta página no está disponible para tu perfil. Te redirigimos a tu página de inicio.`)
        return false;
    }

    return true;
};

// funcion encargada de cargar una vista. params: la ruta de la vista y el elemento HTML donde se inyecta el contenido de la vista
const cargarVista = async (path, elemento) => {

    const viewKey = `../views/${path}`;
    const loader = viewTemplates[viewKey];

    if (!loader) {
        console.error(`No se encontró la vista: ${viewKey}`);
        throw new Error(`No se encontró la vista: ${path}`);
    }

    const html = await loader();
    
    elemento.innerHTML = html;
};

// función encargada de verificar si el usuario tiene uno o varios permisos.
const tienePermisos = (permisosRequeridos) => {
    if (!permisosRequeridos || permisosRequeridos.length === 0) {
        return true; // Ruta pública
    }

    // Si es un solo permiso, verificarlo directamente
    if (permisosRequeridos.length === 1) {
        return isAuthorize(permisosRequeridos[0]);
    }

    // Si son múltiples permisos, verificar que tenga todos
    return permisosRequeridos.every(permiso => isAuthorize(permiso));
};

// funcion encargada de recorrer todas las rutas y verificar si hay una coincidencia con la actual
const recorrerRutas = (routes, arregloHash, esLlamadaRecursiva = false) => {
    let parametros = {};

    // Procesar parámetros solo en la primera llamada
    if (!esLlamadaRecursiva && arregloHash.length > 0) {
        const ultimoElemento = arregloHash[arregloHash.length - 1];

        // Verificar si el último elemento contiene parámetros (tiene =)
        if (ultimoElemento && ultimoElemento.includes("=")) {
            let parametrosSeparados = ultimoElemento.split("&");

            parametrosSeparados.forEach((parametro) => {
                let claveValor = parametro.split("=");
                parametros[claveValor[0]] = claveValor[1];
            });

            arregloHash = [...arregloHash]; // Crear copia para no mutar el original
            arregloHash.pop(); // Remover los parámetros del array
        }
    }

    // Ruta raíz vacía (#/ o #)
    if ((arregloHash.length == 1 && arregloHash[0] == "") ||
        (arregloHash.length == 2 && arregloHash[0] == "" && arregloHash[1] == "") ||
        arregloHash.length == 0) {
        return [routes[""], parametros];
    }

    // Obtener la ruta real (ignorando el primer elemento vacío si existe)
    const rutaActual = arregloHash[0] === "" ? arregloHash[1] : arregloHash[0];
    const resto = arregloHash[0] === "" ? arregloHash.slice(2) : arregloHash.slice(1);

    // Buscar ruta
    for (const key in routes) {
        if (key == rutaActual) {

            // Si es una ruta con sub-rutas (contenedor)
            if (typeof routes[key] === "object" && !routes[key].path && !routes[key].controlador) {
                const [rutaRecursiva, parametrosRecursivos] = recorrerRutas(routes[key], resto, true);
                // Combinar parámetros de ambas llamadas
                return [rutaRecursiva, { ...parametros, ...parametrosRecursivos }];
            }
            return [routes[key], parametros];
        }
    }
    return [null, parametros];
};

const removerBotonHeader = (arregloHash) => {

    const botonBack = document.getElementById("botonBack");

    if (!botonBack) return;

    const currentHash = location.hash.slice(1);

    const rutasHome = [

        "/administrador/", 
        "/supervisor/", 
        "/voluntario/"
    ];

    const hashSinParams = currentHash.split('?')[0];

    if (rutasHome.includes(hashSinParams) || arregloHash.length <= 2) {
        botonBack.classList.add("invisible");
    } else {
        botonBack.classList.remove("invisible");
    }
}
