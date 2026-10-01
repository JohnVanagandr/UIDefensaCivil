/**
 * Controlador: Listar y Gestionar Factores de Riesgo (verPlanRiesgo.js)
 * Fetcher asíncrono para renderizar las tarjetas de cada amenaza registrada 
 * en el entorno de la familia. Permite eliminar y abrir modal de detalles avanzados.
 */
import { api, alertas as alerta, formatearFecha } from "@/helpers/index.js";
import { verRiesgo } from "@/componentes/riesgo/index.js";
import { paginacion } from "@/helpers/index.js";
import { obtenerRol } from "@/helpers/obtenerRol.js";

export default async () => {

    // Nodos Interfaz Nav Superior
    const crear = document.getElementById("crear"); // Redirige a Nuevo
    const botonBack = document.getElementById("botonBack"); // Regresa a Menu Principal
    const id = location.hash.split("=")[1]; // PK Plan Familiar DB ID

    // Contenedor Inyección Grilla Dom
    const contenedor = document.querySelector(".container__paginas");

    const {esSupervisor} = obtenerRol();

    // Concurrency Lock Avoid Double clicks
    if (window.procesoPeticion === undefined) window.procesoPeticion = true;
    window.procesoPeticion = true;

    // Acción Volver atrás
    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        if (esSupervisor) {
            location.href = `#/supervisor/plan_familiar/familia?id=${id}`;
        }
        location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
    };

    // Acción redirigir Crear factor de riesgo
    crear.addEventListener("click", () => {
        location.href = `#/voluntario/plan_familiar/factores_de_riesgo/crear?id=${id}`;
    });

    const mensajeVacio = "No tienes ningun factor de riesgo registrado en la familia...";

    /**
     * Componente UI Card Factory Riesgo 
     * Inyecta HTML plano construyendo el layout de información.
     */
    const carta = async (info) => {

        const div = document.createElement("div");
        div.classList.add("verRiesgos");

        const divTipo = document.createElement("div");
        divTipo.classList.add("verRiesgos__tipoRiesgo");
        const iTipo = document.createElement("i");
        iTipo.classList.add("ri-error-warning-line");
        divTipo.appendChild(iTipo);
        divTipo.appendChild(document.createTextNode(info.threat_type_name));
        div.appendChild(divTipo);

        const divUbicacion = document.createElement("div");
        divUbicacion.classList.add("verRiesgos__ubicacion");
        const iUbicacion = document.createElement("i");
        iUbicacion.classList.add("ri-map-2-line");
        divUbicacion.appendChild(iUbicacion);
        divUbicacion.appendChild(document.createTextNode(info.ubication));
        div.appendChild(divUbicacion);

        const divDistancia = document.createElement("div");
        divDistancia.classList.add("verRiesgos__distancia");
        const iDistancia = document.createElement("i");
        iDistancia.classList.add("ri-map-pin-line");
        divDistancia.appendChild(iDistancia);
        divDistancia.appendChild(document.createTextNode(`${info.distance} m`));
        div.appendChild(divDistancia);

        const divDescripcion = document.createElement("div");
        divDescripcion.classList.add("verRiesgos__descripcion");
        const pDesc = document.createElement("p");
        pDesc.textContent = "Descripción:";
        divDescripcion.appendChild(pDesc);
        divDescripcion.appendChild(document.createTextNode(info.description));
        div.appendChild(divDescripcion);

        const btnEditar = document.createElement("button");
        btnEditar.classList.add("boton", "boton--azul", "verRiesgos__boton--editar");
        btnEditar.dataset.id = info.id;
        btnEditar.textContent = "Editar";
        div.appendChild(btnEditar);

        const btnEliminar = document.createElement("button");
        btnEliminar.classList.add("boton", "boton--azul", "verRiesgos__boton--eliminar");
        btnEliminar.dataset.id = info.id;
        btnEliminar.textContent = "Eliminar";
        div.appendChild(btnEliminar);

        const btnVerMas = document.createElement("button");
        btnVerMas.classList.add("boton", "verRiesgos__boton--verMas");
        btnVerMas.dataset.id = info.id;
        btnVerMas.textContent = "Ver más";
        div.appendChild(btnVerMas);

        return div;
    };

    /**
     * HELPER Paginate Fetch: Limpia el Grid e invoca la API pasandole 'carta' para parsear. 
     */
    const recargarContainer = async () => {
        contenedor.innerHTML = "";
        await paginacion(`riskFactors/familyPlan/${id}`, mensajeVacio, carta);
    };

    // DELEGADOR MAESTRO 
    contenedor.addEventListener("click", async (e) => {

        const boton = e.target.closest("button"); // Caza solo elements 'button'
        if (!boton) return;

        const riskId = boton.dataset.id; // DB PK Extraído HTML Attr

        //Modificar/Anexar Elemento Riesgo
        if (boton.classList.contains("verRiesgos__boton--editar")) {

            if (esSupervisor) {
                location.href = `#/supervisor/plan_familiar/factores_de_riesgo/editar?familia_id=${id}&riesgo_id=${riskId}`;
            }
            location.href = `#/voluntario/plan_familiar/factores_de_riesgo/editar?familia_id=${id}&riesgo_id=${riskId}`;
        }

        // Borrar Riesgo 
        if (boton.classList.contains("verRiesgos__boton--eliminar")) {

            const confirmacion = await alerta.alertaQuest(
                "¿Seguro que deseas eliminar este factor de riesgo?"
            );

            if (!confirmacion.isConfirmed) return;

            const eliminado = await api.delet(`riskFactors/${riskId}`);

            if (eliminado.success) {
                await alerta.alertaOK(eliminado.message);
                await recargarContainer();
            } else {
                alerta.alertaError(eliminado.message);
            }
        }

        // Ver detalles completos (ReadOnly de Relaciones Acción y Vulnerab)
        if (boton.classList.contains("verRiesgos__boton--verMas")) {
            const riskData = await api.get(`riskFactors/${riskId}`);
            if (!riskData) return;
            const actions = await api.get(`riskReductionActions/riskFactor/${riskId}`) || [];
            const vulnerabilities = await api.get(`vulnerabilityFactors/riskFactor/${riskId}`) || [];

            // Formatear acciones de reducción de riesgo en el controlador
            const actionsText = actions.map(accion => {
                const encName = accion.member ? `${accion.member.names} ${accion.member.last_names}` : (accion.member_name || "Sin encargado");
                return `${accion.action} - Encargado: ${encName} - Fin: ${formatearFecha(accion.end_date)}`;
            }).join(", ") || "ninguna";

            // Formatear vulnerabilidades en el controlador
            const vulnerabilitiesText = vulnerabilities.map(v => {
                const vName = v.vulnerability?.name || v.vulnerability_name || "";
                const gName = v.vulnerability_grade?.name || v.grade_name || "";
                return `${vName} - Grado: ${gName}`;
            }).join(", ") || "ninguna";

            // Payload puramente de texto/datos sin lógica
            const payload = {
                threatTypeName: riskData.threat_type?.name || riskData.threat_type_name || "",
                description: riskData.description || "",
                location: riskData.ubication || riskData.location || "",
                distanceText: `${riskData.distance || 0} m`,
                actionsText,
                vulnerabilitiesText
            };

            // Crear y mostrar modal
            const modal = verRiesgo(payload);
            document.body.appendChild(modal);

            const btnCerrar = modal.querySelector(".modal-edicion__btn--secundario");
            const closeModal = () => {
                modal.close();
                modal.remove();
            };
            btnCerrar.addEventListener("click", closeModal);
            modal.addEventListener("mousedown", (e) => {
                if (e.target === modal) closeModal();
            });

            modal.showModal();
        }
    });

    await recargarContainer();
};