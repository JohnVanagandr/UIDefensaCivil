import { api } from "@/helpers/index.js";

import { planAccion as modalPlanAccion } from "@/helpers/modales/index.js";

export const panel_planAccion = async (panelCont, idPlanAccion, esSupervisor, familyPlanId) => {

    const botonera = document.createElement('div');
    botonera.classList.add('planAccion__botonera');
    
    const antesBtn = document.createElement('button');
    antesBtn.textContent = 'Antes';
    
    const duranteBtn = document.createElement('button');
    duranteBtn.textContent = 'Durante';
    
    const despuesBtn = document.createElement('button');
    despuesBtn.textContent = 'Despues';
    
    botonera.append(antesBtn, duranteBtn, despuesBtn);
    panelCont.append(botonera);
    
    // ---- Sección de contenedores (uno por fase) ----
    const accionSection = document.createElement('div');
    accionSection.classList.add('gestionarPlanAccion__secciones');
    panelCont.append(accionSection);
    
    // Crea el contenido interno de un contenedor de fase: botón "+Agregar" + lista de tarjetas
    const crearContenidoFase = (tipoEstado) => {
    
        const contenedor = document.createElement('div');
    
        const botonAñadir = document.createElement('button');
        botonAñadir.classList.add('boton');
        botonAñadir.type = 'button';
        botonAñadir.textContent = '+ Agregar acción';
        if (esSupervisor) botonAñadir.classList.add('oculto');
    
        const lista = document.createElement('div');
        lista.classList.add('gestionarAfecciones__lista');
    
        const cargarAfecciones = async () => {
    
            const afecciones = await api.get(`actionPlanActions/actionPlan/${idPlanAccion.id}`);
    
            lista.innerHTML = '';
    
            const afeccionesFiltradas = afecciones.filter(item => tipoEstado == item.action_type_id);
    
            if (afeccionesFiltradas.length === 0) {
                const mensajeVacio = document.createElement('p');
                mensajeVacio.classList.add('gestionarAfecciones__mensajeVacio');
                mensajeVacio.textContent = "No hay registros disponibles para esta fase.";
                lista.appendChild(mensajeVacio);
                return;
            }
    
            afeccionesFiltradas.forEach((item) => {
                const tarjeta = document.createElement('button');
                tarjeta.classList.add('gestionarAfecciones__afeccion');
                tarjeta.dataset.id = item.id;
    
                const Descripcion = document.createElement('div');
                Descripcion.classList.add('gestionarAfecciones__descripcion');
    
                const icon = document.createElement('i');
                icon.classList.add('ri-hammer-line');
    
                const descripcionText = document.createElement('p');
                descripcionText.textContent = item.description;
    
                Descripcion.append(icon, descripcionText)
                // span.appendChild(document.createTextNode(` ${item.member_name} - ${item.description}`));
    
                const Responsable = document.createElement('div');
                Responsable.classList.add('gestionarAfecciones__Responsable');
    
                const responsableSpan = document.createElement('span');
                responsableSpan.textContent = 'Responsable:';
    
                const responsableName = document.createElement('p');
                responsableName.textContent = item.member_name;
    
                Responsable.append(responsableSpan, responsableName);
    
                tarjeta.append(Descripcion, Responsable);
                    lista.appendChild(tarjeta);
            });
    
        };
    
        botonAñadir.addEventListener('click', () => {
            modalPlanAccion.crear(familyPlanId, tipoEstado, cargarAfecciones, idPlanAccion.id);
        });
    
        lista.addEventListener('click', (e) => {
            const target = e.target.closest('.gestionarAfecciones__afeccion');
            if (!target) return;
            modalPlanAccion.verEditarEliminar(target.dataset.id, familyPlanId, cargarAfecciones, esSupervisor);
        });
    
        contenedor.append(botonAñadir, lista);
    
        return { contenedor, cargarAfecciones };
    };
    
    const antes = crearContenidoFase(1);
    const durante = crearContenidoFase(2);
    const despues = crearContenidoFase(3);
    
    antes.contenedor.classList.add('gestionarPlanAccion__fase',);
    durante.contenedor.classList.add('gestionarPlanAccion__fase', 'oculto');
    despues.contenedor.classList.add('gestionarPlanAccion__fase', 'oculto');
    
    accionSection.append(antes.contenedor, durante.contenedor, despues.contenedor);
    
    // Carga las tarjetas de las 3 fases desde el inicio
    await Promise.all([
        antes.cargarAfecciones(),
        durante.cargarAfecciones(),
        despues.cargarAfecciones(),
    ]);
    
    // ---- Lógica de cambio de pestaña ----
    const fases = [
        { boton: antesBtn, contenedor: antes.contenedor },
        { boton: duranteBtn, contenedor: durante.contenedor },
        { boton: despuesBtn, contenedor: despues.contenedor },
    ];
    
    const mostrarFase = (faseSeleccionada) => {
        fases.forEach(({ boton, contenedor }) => {
            const esLaSeleccionada = contenedor === faseSeleccionada.contenedor;
            contenedor.classList.toggle('oculto', !esLaSeleccionada);
            boton.classList.toggle('activo', esLaSeleccionada);
        });
    };
    
    antesBtn.addEventListener('click', () => mostrarFase(fases[0]));
    duranteBtn.addEventListener('click', () => mostrarFase(fases[1]));
    despuesBtn.addEventListener('click', () => mostrarFase(fases[2]));
    
    antesBtn.classList.add('activo'); // Pestaña inicial
    
    // ---- Bloqueo si el plan ya fue aprobado/cerrado ----
    const familyPlan = await api.get(`familyPlans/${familyPlanId}`);
    
    if (familyPlan.status_plan_id === 6 || familyPlan.status_plan_id === 7) {
    
        panelCont.querySelectorAll('.gestionarAfecciones__afeccion').forEach((btn) => {
            btn.disabled = true;
        });
    
        panelCont.querySelectorAll('.gestionarAfecciones__boton').forEach((btn) => {
            btn.classList.add('oculto');
        });
    
        form.querySelectorAll('.boton').forEach((btn) => {
            btn.classList.add('oculto');
        });
    
        form.querySelectorAll('.selector').forEach((select) => {
            select.disabled = true;
        });
    }

    // panelCont.append(botonera, accionSection);

}