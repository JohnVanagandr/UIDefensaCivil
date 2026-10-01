/**
 * Controlador: Edición de Factor de Riesgo y gestión de sus vulnerabilidades y acciones asociadas.
 * Permite actualizar el riesgo base y añadir/editar/eliminar sus relaciones secundarias.
 */
import { api, alertas as alerta, validacionInputs as validacion, adjuntarOpciones as adjuntarOpc, formatearFecha, fechas } from "@/helpers/index.js";
import { initTomSelectPortatil } from "@/helpers/tomSelectPortatil.js";
import { VistaRiesgo, agregarVulnerabilidadMemoria, agregarAccionMemoria } from "@/componentes/riesgo/index.js";
import { tarjetaChip } from "@/componentes/tarjetaChip.js";
import { obtenerRol } from "@/helpers/obtenerRol.js";

export default async () => {
    const hashQuery = location.hash.split("?")[1] ?? "";
    const params = new URLSearchParams(hashQuery);
    const {esSupervisor} = obtenerRol();

    const planId = params.get("familia_id");
    const riesgoId = params.get("riesgo_id");

    if (window.procesoPeticion === undefined) {
        window.procesoPeticion = true;
    }
    window.procesoPeticion = false;

    // Lógica Botón Atrás
    const botonBack = document.getElementById("botonBack");
    botonBack.onclick = async () => {
        if (window.procesoPeticion) return;
        if (esSupervisor) {
            location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
            return;
        }
        location.href = `#/voluntario/plan_familiar/factores_de_riesgo?familia_id=${planId}`;
    };

    // Cargar datos del factor de riesgo desde el servidor
    let riskData = null;
    if (riesgoId) {
        riskData = await api.get(`riskFactors/${riesgoId}`);
    }

    // Precargar catálogos necesarios para modales
    const vulnerabilityGradesList = await api.get("vulnerabilityGrades") || [];
    const vulnerabilitiesList = await api.get("vulnerabilities") || [];
    const membersList = await api.get(`members/familyPlan/select/${planId}`) || [];

    // Instancia el componente visual de factores de riesgo (retorna el nodo del formulario)
    const form = VistaRiesgo({
        esSupervisor: esSupervisor
    });

    // Inyectar datos en el formulario desde el controlador
    if (riskData) {
        form.querySelector("#descripcion").value = riskData.description || "";
        form.querySelector("#ubicacion").value = riskData.ubication || riskData.location || "";
        form.querySelector("#distancia").value = riskData.distance || "";
        form.querySelector("#botonGuardar").textContent = "Guardar";
    }

    const contenedor = document.getElementById("contenedor-riesgo");
    contenedor.innerHTML = ""; // Limpiar
    contenedor.appendChild(form);

    // Cargar opciones de Amenaza y configurar TomSelect
    const amenazaSelect = form.querySelector("#tiposAmenaza");
    await adjuntarOpc.adjuntar(amenazaSelect, "threatTypes");
    if (riskData) {
        amenazaSelect.value = riskData.threat_type_id || "";
    }
    initTomSelectPortatil();

    // Inicializar validador automático sobre el formulario
    validacion.validadorAutomatico.init(form);

    // Obtener referencias de elementos del DOM internos del formulario
    const descripcionTextarea = form.querySelector("#descripcion");
    const ubicacionInput = form.querySelector("#ubicacion");
    const distanciaInput = form.querySelector("#distancia");
    const btnAgregarVuln = form.querySelector("#btnAgregarVulnerabilidad");
    const btnAgregarAcc = form.querySelector("#btnAgregarAccion");
    const listaVulnDiv = form.querySelector("#vulnerabilidades-lista");
    const listaAccDiv = form.querySelector("#acciones-lista");
    const btnGuardar = form.querySelector("#botonGuardar");

    // Helper local para renderizar vulnerabilidades
    const cargarVulnerabilidades = async () => {
        const list = await api.get(`vulnerabilityFactors/riskFactor/${riesgoId}`) || [];
        listaVulnDiv.innerHTML = "";

        if (list.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.classList.add("gestionarAfecciones__mensajeVacio");
            emptyMsg.textContent = "No hay vulnerabilidades registradas.";
            listaVulnDiv.appendChild(emptyMsg);
            return;
        }

        list.forEach((vuln) => {
            // Pre-formatear el texto de visualización en el controlador
            const vName = vuln.vulnerability?.name || vuln.vulnerability_name || "";
            const gName = vuln.vulnerability_grade?.name || vuln.vulnerability_grade_name || vuln.grade_name || "";
            vuln.labelText = `${vName} - Grado: ${gName}`;

            const tag = tarjetaChip({
                labelText: vuln.labelText,
                id: vuln.id,
                esSupervisor,
                onEdit: () => {
                    // Instanciar modal visual nativo
                    const modal = agregarVulnerabilidadMemoria({
                        initialData: vuln,
                        vulnerabilities: vulnerabilitiesList,
                        vulnerabilityGrades: vulnerabilityGradesList
                    });
                    document.body.appendChild(modal);

                    const formModal = modal.querySelector("form");
                    const btnCancelar = modal.querySelector(".modal-edicion__btn--secundario");
                    const btnGuardarVuln = modal.querySelector(".modal-edicion__btn--primario");
                    const selectVulnerability = modal.querySelector(".form__vulnerability");
                    const selectGrade = modal.querySelector(".form__vulnerabilityGrade");

                    const closeModal = () => {
                        modal.close();
                        modal.remove();
                    };
                    btnCancelar.addEventListener("click", closeModal);
                    modal.addEventListener("mousedown", (e) => {
                        if (e.target === modal) closeModal();
                    });

                    // Iniciar validador y evento de envío a API
                    validacion.validadorAutomatico.init(formModal);
                    btnGuardarVuln.addEventListener("click", async () => {
                        const isValid = validacion.validadorAutomatico.validarTodo(formModal);
                        if (!isValid) return;

                        const res = await api.patch(`vulnerabilityFactors/${vuln.id}`, {
                            vulnerability_id: selectVulnerability.value,
                            vulnerability_grade_id: selectGrade.value
                        });
                        if (res.success) {
                            closeModal();
                            await alerta.alertaOK(res.message);
                            cargarVulnerabilidades();
                        } else {
                            alerta.alertaWarning(res.message, res.errors);
                        }
                    });

                    modal.showModal();
                    initTomSelectPortatil();
                },
                onDelete: async () => {
                    // Lógica del delete si es voluntario
                    const confirmacion = await alerta.alertaQuest("¿Seguro que deseas eliminar esta vulnerabilidad?");
                    if (!confirmacion.isConfirmed) return;

                    const res = await api.delet(`vulnerabilityFactors/${vuln.id}`);
                    if (res.success) {
                        await alerta.alertaOK(res.message);
                        cargarVulnerabilidades();
                    }
                }
            });
            listaVulnDiv.appendChild(tag);
        });
    };

    // Helper local para renderizar acciones de reducción
    const cargarAcciones = async () => {
        const list = await api.get(`riskReductionActions/riskFactor/${riesgoId}`) || [];
        listaAccDiv.innerHTML = "";

        if (list.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.classList.add("gestionarAfecciones__mensajeVacio");
            emptyMsg.textContent = "No hay acciones de reducción registradas.";
            listaAccDiv.appendChild(emptyMsg);
            return;
        }

        list.forEach((action) => {
            // Pre-formatear el texto de visualización en el controlador
            const actionText = action.action || "";
            const memberName = action.member ? `${action.member.names} ${action.member.last_names}` : (action.member_name || "Sin encargado");
            action.labelText = `${actionText} - ${memberName} - ${formatearFecha(action.end_date)}`;

            const tag = tarjetaChip({
                labelText: action.labelText,
                id: action.id,
                esSupervisor,
                onEdit: () => {
                    // Instanciar modal visual nativo
                    const modal = agregarAccionMemoria({
                        members: membersList,
                        initialData: action
                    });
                    document.body.appendChild(modal);

                    const formModal = modal.querySelector("form");
                    const btnCancelar = modal.querySelector(".modal-edicion__btn--secundario");
                    const btnGuardarAcc = modal.querySelector(".modal-edicion__btn--primario");
                    const inputAction = modal.querySelector(".form__action");
                    const selectMember = modal.querySelector(".form__member");
                    const inputDate = modal.querySelector(".form__date");

                    const closeModal = () => {
                        modal.close();
                        modal.remove();
                    };
                    btnCancelar.addEventListener("click", closeModal);
                    modal.addEventListener("mousedown", (e) => {
                        if (e.target.closest(".air-datepicker")) return;
                        if (e.target === modal) closeModal();
                    });

                    // Configurar AirDatepicker con límites
                    fechas.initModalDatepicker(inputDate, {
                        modal,
                        formModal,
                        minDate: new Date()
                    });

                    // Iniciar validador y evento de envío a API
                    validacion.validadorAutomatico.init(formModal);
                    btnGuardarAcc.addEventListener("click", async () => {
                        const isValid = validacion.validadorAutomatico.validarTodo(formModal);
                        if (!isValid) return;

                        const dateVal = inputDate.value;
                        if (!dateVal) {
                            validacion.mostrarError(inputDate, "La fecha de finalización es obligatoria.");
                            return;
                        }
                        const today = new Date();
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                        if (dateVal < todayStr) {
                            validacion.mostrarError(inputDate, "La fecha de la acción no puede ser anterior al día de hoy.");
                            return;
                        }

                        const res = await api.patch(`riskReductionActions/${action.id}`, {
                            action: inputAction.value,
                            member_id: selectMember.value,
                            end_date: dateVal
                        });
                        if (res.success) {
                            closeModal();
                            await alerta.alertaOK(res.message);
                            cargarAcciones();
                        } else {
                            alerta.alertaWarning(res.message, res.errors);
                        }
                    });

                    modal.showModal();
                    initTomSelectPortatil();
                },
                onDelete: async () => {
                    // Lógica del delete si es voluntario
                    const confirmacion = await alerta.alertaQuest("¿Seguro que deseas eliminar esta acción?");
                    if (!confirmacion.isConfirmed) return;

                    const res = await api.delet(`riskReductionActions/${action.id}`);
                    if (res.success) {
                        await alerta.alertaOK(res.message);
                        cargarAcciones();
                    }
                }
            });
            listaAccDiv.appendChild(tag);
        });
    };

    // Cargar listas iniciales
    cargarVulnerabilidades();
    cargarAcciones();

    // Click en agregar vulnerabilidad
    if (!esSupervisor) {
        btnAgregarVuln.addEventListener("click", () => {
            const modal = agregarVulnerabilidadMemoria({
                initialData: null,
                vulnerabilities: vulnerabilitiesList,
                vulnerabilityGrades: vulnerabilityGradesList
            });
            document.body.appendChild(modal);

            const formModal = modal.querySelector("form");
            const btnCancelar = modal.querySelector(".modal-edicion__btn--secundario");
            const btnGuardarVuln = modal.querySelector(".modal-edicion__btn--primario");
            const selectVulnerability = modal.querySelector(".form__vulnerability");
            const selectGrade = modal.querySelector(".form__vulnerabilityGrade");

            const closeModal = () => {
                modal.close();
                modal.remove();
            };
            btnCancelar.addEventListener("click", closeModal);
            modal.addEventListener("mousedown", (e) => {
                if (e.target === modal) closeModal();
            });

            validacion.validadorAutomatico.init(formModal);
            btnGuardarVuln.addEventListener("click", async () => {
                const isValid = validacion.validadorAutomatico.validarTodo(formModal);
                if (!isValid) return;

                const res = await api.post("vulnerabilityFactors", {
                    vulnerability_id: selectVulnerability.value,
                    vulnerability_grade_id: selectGrade.value,
                    risk_factor_id: riesgoId
                });
                if (res.success) {
                    closeModal();
                    await alerta.alertaOK(res.message);
                    cargarVulnerabilidades();
                } else {
                    alerta.alertaWarning(res.message, res.errors);
                }
            });

            modal.showModal();
            initTomSelectPortatil();
        });

        // Click en agregar acción
        btnAgregarAcc.addEventListener("click", () => {
            const modal = agregarAccionMemoria({
                members: membersList,
                initialData: null
            });
            document.body.appendChild(modal);

            const formModal = modal.querySelector("form");
            const btnCancelar = modal.querySelector(".modal-edicion__btn--secundario");
            const btnGuardarAcc = modal.querySelector(".modal-edicion__btn--primario");
            const inputAction = modal.querySelector(".form__action");
            const selectMember = modal.querySelector(".form__member");
            const inputDate = modal.querySelector(".form__date");

            const closeModal = () => {
                modal.close();
                modal.remove();
            };
            btnCancelar.addEventListener("click", closeModal);
            modal.addEventListener("mousedown", (e) => {
                if (e.target.closest(".air-datepicker")) return;
                if (e.target === modal) closeModal();
            });

            // Configurar AirDatepicker con límites
            fechas.initModalDatepicker(inputDate, {
                modal,
                formModal,
                minDate: new Date()
            });

            validacion.validadorAutomatico.init(formModal);
            btnGuardarAcc.addEventListener("click", async () => {
                const isValid = validacion.validadorAutomatico.validarTodo(formModal);
                if (!isValid) return;

                const dateVal = inputDate.value;
                if (!dateVal) {
                    validacion.mostrarError(inputDate, "La fecha de finalización es obligatoria.");
                    return;
                }
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                if (dateVal < todayStr) {
                    validacion.mostrarError(inputDate, "La fecha de la acción no puede ser anterior al día de hoy.");
                    return;
                }

                const res = await api.post("riskReductionActions", {
                    action: inputAction.value,
                    member_id: selectMember.value,
                    risk_factor_id: riesgoId,
                    end_date: dateVal
                });
                if (res.success) {
                    closeModal();
                    await alerta.alertaOK(res.message);
                    cargarAcciones();
                } else {
                    alerta.alertaWarning(res.message, res.errors);
                }
            });

            modal.showModal();
            initTomSelectPortatil();
        });
    }

    // Guardar cambios del factor de riesgo base
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validar inputs
        const isValid = validacion.validadorAutomatico.validarTodo(form);
        if (!isValid) return;

        if (window.procesoPeticion) return;
        window.procesoPeticion = true;
        btnGuardar.disabled = true;

        const datosRegistro = {
            threat_type_id: amenazaSelect.value,
            description: descripcionTextarea.value,
            location: ubicacionInput.value,
            distance: distanciaInput.value,
        };

        try {
            const data = await api.patch(`riskFactors/${riesgoId}`, datosRegistro);
            if (data.success) {
                await alerta.alertaOK(data.message);
                if (esSupervisor) {
                    location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
                } else {
                    location.href = `#/voluntario/plan_familiar/factores_de_riesgo?familia_id=${planId}`;
                }
            } else {
                alerta.alertaWarning(data.message, data.errors);
            }
        } catch (error) {
            alerta.alertaError(error.errors || error.message);
        }

        btnGuardar.disabled = false;
        window.procesoPeticion = false;
    });
};