/**
 * Controlador: Revisión de Plan Familiar (RevisionPlanController.js)
 * Facilita las acciones críticas para un Supervisor al evaluar un Plan Familiar.
 * Gestiona botones asíncronos para Aprobar, Rechazar (Definitivo/Cambios) y Ver PDF.
 */
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { factorRiesgoVentana, integranteVentana, mascotaVentana, recursosVentana } from "@/componentes/ver_EstadoSupervisor/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { alertas as alerta, api } from "@/helpers/index.js";
import { panel_planAccion } from "../../../../componentes/panel_planAccion/panel_planAccion";

const RevisionPlanController = async () => {

    const id = location.hash.split("=")[1];

    const info = await api.get(`familyPlans/${id}`);
    const familyMembers = await api.get(`members/familyPlan/${id}`);
    const sectors = await api.get(`sectors/`);
    const pets = await api.get(`pets/familyPlan/${id}`);
    const riskFactors = await api.get(`riskFactors/familyPlan/${id}`);
    const Resources = await api.get(`availableResources/familyPlan/${id}`);
    
    console.log("INFO",info);
    
    const principalCont = document.querySelector(".container");

    const contenedor = document.querySelector(".container__revision");

    const botonBack = document.getElementById("botonBack");

    const div = document.createElement("div");
    div.classList.add("tarjeta");

    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        location.href = `#/supervisor/plan_familiar`;
    };


    //INTRODUCCION DE LA TARJETA _____________________________________________________________________________________

    const tarjetaIntroduccion = document.createElement("div");
    tarjetaIntroduccion.classList.add("tarjeta--introduccion_supervisor");

    const introduccionCont = document.createElement("div");
    introduccionCont.classList.add("tarjeta-contenido");

    const imagenIcono = document.createElement("img");
    imagenIcono.src = "/icon/familyicon.svg";
    imagenIcono.alt = "iconofamilia";
    imagenIcono.classList.add("imagen--icono");

    const btnEditarDatos = document.createElement("button");
    btnEditarDatos.classList.add("ri-edit-fill", "boton--pequenio");

    const apellidoFamilia = document.createElement("div");
    apellidoFamilia.classList.add("tarjeta__titulo",);
    apellidoFamilia.textContent = "Familia " + info.last_names;

    const familiaCont = document.createElement("div");
    familiaCont.classList.add("form_autorizacion", "form-top_autorization");

    if (info.status_plan_id !== 6 && info.status_plan_id !== 7) {
        familiaCont.append(imagenIcono, apellidoFamilia, btnEditarDatos);
    } else {
        familiaCont.append(imagenIcono, apellidoFamilia);
    }

    btnEditarDatos.addEventListener("click", () => {
        location.href = `#/supervisor/plan_familiar/datos?familia_id=${info.id}`;
    });

    const tiposSector = sectors.find(sector => sector.id == info.sector_id);

    const departamento = document.createElement("div");
    departamento.classList.add("form_autorizacion");
    const ubicacionIcono = document.createElement("i");
    ubicacionIcono.classList.add("icono--pequeno", "ri-map-pin-2-line");

    departamento.append(ubicacionIcono, " " + info.address + ", " + (tiposSector?.name || "") + " " + info.sector_name + ", " + info.city + ", " + info.department);

    const telefonoFamilia = document.createElement("div");
    telefonoFamilia.classList.add("form_autorizacion");
    const telefonoIcono = document.createElement("i");
    telefonoIcono.classList.add("icono--pequeno", "ri-phone-line");
    telefonoFamilia.append(telefonoIcono, info.landline_phone ?? 'Sin número');

    const calidadVivienda = document.createElement("div");
    calidadVivienda.classList.add("form_autorizacion");
    const viviendaIcono = document.createElement("i");
    viviendaIcono.classList.add("icono--pequeno", "ri-home-2-line");
    calidadVivienda.append(viviendaIcono, " Calidad Vivienda: " + info.housing_quality);

    const tipoFamilia = document.createElement("div");
    tipoFamilia.classList.add("form_autorizacion");
    const tipoIcono = document.createElement("i");
    tipoIcono.classList.add("icono--pequeno", "ri-error-warning-line");
    tipoFamilia.append(tipoIcono, " Tipo Familia: " + info.family_type);

    const fechaRecibido = document.createElement("div");
    fechaRecibido.classList.add("form_autorizacion");
    const calendarioIcono = document.createElement("i");
    calendarioIcono.classList.add("icono--pequeno", "ri-calendar-line");
    fechaRecibido.append(calendarioIcono, " Recibido: " + info.created_at);

    const introduccionDiv = document.createElement("div");
    introduccionDiv.classList.add("introduccionDiv");

    introduccionCont.append(familiaCont, departamento, telefonoFamilia, calidadVivienda, tipoFamilia, fechaRecibido);

    introduccionDiv.append(introduccionCont);

    const botonVerPDF = document.createElement("button");
    botonVerPDF.classList.add("boton");
    botonVerPDF.id = "verPDF";
    botonVerPDF.textContent = "Ver PDF";

    tarjetaIntroduccion.append(introduccionDiv, botonVerPDF);

    //Navegación al Visor de Vista Previa PDF
    botonVerPDF.addEventListener("click", () => {
        location.href = `#/supervisor/plan_familiar/ver_pdf?familia_id=${id}`;
    });

    //CONTENIDO DE LA TARJETA _____________________________________________________________________________________

    const tarjetaContenido = document.createElement("div");
    tarjetaContenido.classList.add("tarjeta--contenido");

    //Integrantes
    const integrantesCont = document.createElement("div");
    integrantesCont.classList.add("tarjeta-contenido_flex");

    const integrantesHumanos = document.createElement("div");
    integrantesHumanos.classList.add("tarjeta-contenido");

    const subtituloIntegrantes = document.createElement("div");
    // subtituloIntegrantes.classList.add("form__texto");
    const teamIcono = document.createElement("i");
    teamIcono.classList.add("icono--pequeno", "ri-team-line");
    subtituloIntegrantes.append(teamIcono, " Integrantes");

    integrantesHumanos.append(subtituloIntegrantes);

    familyMembers.forEach(async (miembro) => {

        const integranteCont = document.createElement("div");
        integranteCont.classList.add("integrante__container");

        const nombreCont = document.createElement("div");
        nombreCont.classList.add("form_autorizacion");

        const Integrante = document.createElement("div");
        Integrante.classList.add("form_autorizacion", "integrante--nombre");

        Integrante.textContent = `• ${miembro.full_name} - ${miembro.kinship}`;

        const btnVisualizar = document.createElement("button");
        btnVisualizar.classList.add("ri-eye-line", "boton--pequenio");

        nombreCont.append(Integrante, btnVisualizar);
        integranteCont.append(nombreCont);
        integrantesHumanos.append(integranteCont);

        btnVisualizar.addEventListener("click", () => {
            integranteVentana(miembro, info);
        });

    });

    const integrantesMascotas = document.createElement("div");
    integrantesMascotas.classList.add("tarjeta-contenido");

    const subtituloMascotas = document.createElement("div");
    // subtituloMascotas.classList.add("form__texto");
    const mascotaIcono = document.createElement("i");
    mascotaIcono.classList.add("icono--pequeno", "ri-team-line");
    subtituloMascotas.append(mascotaIcono, " Mascotas");

    integrantesMascotas.append(subtituloMascotas);
        
    pets.forEach(async mascota => {

        const especie = await api.get(`species/${mascota.species_id}`);

        const mascotaCont = document.createElement("div");
        mascotaCont.classList.add("form_autorizacion");

        const mascota_p = document.createElement("p");
        mascota_p.classList.add("form_autorizacion");
        mascota_p.textContent = `• ${mascota.name} - ${especie.name}`;

        const btnVisualizar = document.createElement("button");
        btnVisualizar.classList.add("ri-eye-line", "boton--pequenio");

        mascotaCont.append(mascota_p, btnVisualizar);

        integrantesMascotas.append(mascotaCont);

        btnVisualizar.addEventListener("click", () => {
            // Invoca la ventana modal para visualizar los detalles y vacunas de la mascota seleccionada.
            // Esto es muy importante para permitirle al supervisor auditar la información del animal doméstico.
            mascotaVentana(mascota, info);
        });
    });

    integrantesCont.append(integrantesHumanos, integrantesMascotas);

    //factores de riesgo

    const FactoresRiesgoCont = document.createElement("div");
    FactoresRiesgoCont.classList.add("tarjeta-contenido");

    const subtituloRiesgo = document.createElement("div");
    // subtituloRiesgo.classList.add("form__texto");
    const riesgoIcono = document.createElement("i");
    riesgoIcono.classList.add("icono--pequeno", "ri-alert-line");
    subtituloRiesgo.append(riesgoIcono, " Factores de Riesgo");

    FactoresRiesgoCont.append(subtituloRiesgo);

    let contadorRiesgos = 0;

    // factoresRiesgo.forEach(async factor => 
    for (const factor of riskFactors) {

        contadorRiesgos++;

        const tiposRiesgo = await api.get(`threatTypes/${factor.threat_type_id}`);

        const factorCont = document.createElement("div");
        factorCont.classList.add("form_autorizacion");

        const factor_p = document.createElement("p");
        factor_p.classList.add("form_autorizacion");
        factor_p.textContent = `${contadorRiesgos}. ${tiposRiesgo.name}`;

        const btnVisualizar = document.createElement("button");
        btnVisualizar.classList.add("ri-eye-line", "boton--pequenio");

        factorCont.append(factor_p, btnVisualizar);

        FactoresRiesgoCont.append(factorCont);

        btnVisualizar.addEventListener("click", () => {

            factorRiesgoVentana(factor, familyMembers, info);
        });
    };

    tarjetaContenido.append(integrantesCont, FactoresRiesgoCont);

    //recursos disponibles

    const recursosCont = document.createElement("div");
    recursosCont.classList.add("tarjeta-contenido");

    const subtituloRecursos = document.createElement("div");
    // subtituloRecursos.classList.add("form__texto");
    const recursoIcono = document.createElement("i");
    recursoIcono.classList.add("icono--pequeno", "ri-hand-coin-line");
    subtituloRecursos.append(recursoIcono, " Recursos Disponibles");

    recursosCont.append(subtituloRecursos);

    let contadorRecursos = 0;

    for (const recurso of Resources) {

        contadorRecursos++;

        const recursoCont = document.createElement("div");
        recursoCont.classList.add("form_autorizacion");

        const recurso_p = document.createElement("p");
        recurso_p.classList.add("form_autorizacion");
        recurso_p.textContent = `${contadorRecursos}. ${recurso.resource_name} - ${recurso.distance} m`;

        const btnVisualizar = document.createElement("button");
        btnVisualizar.classList.add("ri-eye-line", "boton--pequenio");

        recursoCont.append(recurso_p, btnVisualizar);

        recursosCont.append(recursoCont);

        btnVisualizar.addEventListener("click", () => {

            recursosVentana(recurso, info);
        });
    };

    tarjetaContenido.append(recursosCont);

    const contenedorBotonesExtra = document.createElement("div");
    contenedorBotonesExtra.classList.add("tarjeta-botones-extra");

    // 📍 Georreferenciación
    const btnGeo = document.createElement("button");
    btnGeo.classList.add("boton", "boton--height");
    btnGeo.textContent = "Georreferenciación";

    // Grafico Entorno
    const btnEntorno = document.createElement("button");
    btnEntorno.classList.add("boton", "boton--height");
    btnEntorno.textContent = "Gráfico Entorno";

    // 🏠 Gráficos de vivienda
    const btnGraficos = document.createElement("button");
    btnGraficos.classList.add("boton", "boton--height");
    btnGraficos.textContent = "Gráficos Vivienda";

    // 📋 Plan de acción
    const btnPlanAccion = document.createElement("button");
    btnPlanAccion.classList.add("boton", "boton--height");
    btnPlanAccion.textContent = "Plan de Acción";

    contenedorBotonesExtra.append(btnGeo, btnEntorno, btnGraficos, btnPlanAccion);

    // 📍 Georreferenciación
    btnGeo.addEventListener("click", () => {
        location.hash = `#/supervisor/plan_familiar/georeferenciacion?familia_id=${info.id}`;
    });

    // 🏠 Gráficos de vivienda
    btnGraficos.addEventListener("click", () => {
        location.hash = `#/supervisor/plan_familiar/grafico_vivienda?familia_id=${info.id}`;
    });

    // Grafico Entorno
    btnEntorno.addEventListener("click", () => {
        location.hash = `#/supervisor/plan_familiar/grafico_del_entorno?familia_id=${info.id}`;
    });

    // 📋 Plan de acción
    btnPlanAccion.addEventListener("click", () => {
        location.hash = `#/supervisor/plan_familiar/plan_de_accion?familia_id=${info.id}`;
    });

    tarjetaContenido.append(contenedorBotonesExtra);

    // 📋 Plan de acción
    // const panelAccion = document.createElement("div");
    // panelAccion.classList.add("tarjeta-panel_accion");

    // const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);

    // panel_planAccion(panelAccion, idPlanAccion, true, info.id);

    // tarjetaContenido.append(panelAccion);


    //BOTONES DE ACCION _____________________________________________________________________________________

    const aprobar = document.createElement("button");
    aprobar.classList.add("boton", "boton--height", "badge--aprobado");
    aprobar.textContent = "Aprobar Plan";

    const rechazarCambios = document.createElement("button");
    rechazarCambios.classList.add("boton", "boton--height");
    rechazarCambios.textContent = "Requiere Cambios";

    const rechazarDefinitivo = document.createElement("button");
    rechazarDefinitivo.classList.add("boton", "boton--height", "badge--rechazado");
    rechazarDefinitivo.textContent = "Rechazar Definitivamente";

    const botonesContenedor = document.createElement("div");
    botonesContenedor.classList.add("tarjeta__flex--row");
    botonesContenedor.append(aprobar, rechazarCambios, rechazarDefinitivo);

    if (info.status_plan_id == 7 || info.status_plan_id == 6) {
        botonesContenedor.classList.add("oculto");
    }

    div.append(tarjetaIntroduccion, tarjetaContenido);

    // Callback del botón 'Aprobar'
    aprobar.addEventListener("click", async () => {
        try {
            // Impacta directamente al ID de estado del Plan 7 (Probablemente "Aprobado")
            const data = await api.patch(`familyPlans/${info.id}/change-status`, {
                status_plan_id: 7,
            });
            // Condominio de respuesta
            if (data.success) {
                await alerta.alertaOK(data.message); // Banner verde Confirmación
                window.location.href = `#/supervisor/plan_familiar`; // Expulsa devuelta a la lista principal
            } else alerta.alertaWarning(data.message, data.errors);
        } catch (error) {
            // Previene caídas totales
            alerta.alertaError(error.errors);
        }
    });

    // Callback del botón de negación y cierre
    rechazarDefinitivo.addEventListener("click", async () => {
        try {
            // Estado 6 (Rechazo absoluto o sin posibilidad de appeal momentáneo)
            const data = await api.patch(`familyPlans/status/${info.id}`, {
                status_plan_id: 6,
            });
            // Branching
            if (data.success) {
                await alerta.alertaOK(data.message);
                window.location.href = `#/supervisor/plan_familiar`; // Retorno lista
            } else alerta.alertaWarning(data.message, data.errors);
        } catch (error) {
            alerta.alertaError(error.errors);
        }
    });

    // Callback del botón de Requiere Observaciones (Feedback workflow)
    rechazarCambios.addEventListener("click", async () => {
        // Delega el flujo visual y de API a un helper complejo en alertas.js que pide la razón del rechazo
        const cambios = await alerta.rechazarCambios(info.id);

        // Confirmación post-interacción con el popup de SweetAlert text
        if (cambios.isConfirmed) {
            window.location.href = `#/supervisor/plan_familiar`; // Volver
        }
    });

    contenedor.append(botonesContenedor, div);

};

export default RevisionPlanController;
