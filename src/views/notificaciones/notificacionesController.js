// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { api } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { paginacion } from "@/helpers/index.js";
import tiempoRelativo from "@/componentes/tiempos/tiempoRelativo";
import { obtenerRol } from "@/helpers/obtenerRol.js";

const notificacionesController = async () => {

    const { esSupervisor } = obtenerRol();

    const userId = localStorage.getItem('id');
    const contenedor = document.querySelector(".container__paginas");

    const mensajeVacio = "No tienes ninguna notificación.";

    const carta = (notificacion) => {

        const notificacionCont = document.createElement("div");
        notificacionCont.classList.add("tarjeta", "tarjeta--notificacion");

        if (!notificacion.is_read) {
            notificacionCont.classList.add("tarjeta--notificacion__noread");
        }

        const header = document.createElement("div");
        header.classList.add("tarjeta__header");

        const iconoCont = document.createElement("div");
        iconoCont.classList.add("tarjeta__icono-contenedor", "tarjeta__icono-contenedor--azul");

        let icono = document.createElement("i");

        let infoCont = document.createElement("div");
        infoCont.classList.add("tarjeta__info");

        let titulo = document.createElement("p");
        titulo.classList.add("tarjeta__titulo-notificacion");

        const estadoCont = document.createElement("div");
        estadoCont.classList.add("tarjeta__estado");

        const tiempo = document.createElement("p");
        tiempo.classList.add("tarjeta__tiempo");
        tiempo.textContent = tiempoRelativo(notificacion.created_at);

        let estado = document.createElement("p");
        estado.classList.add("badge");

        let tarjetaCuerpo = "";

        if (notificacion.entidad.tipo === "Plan Familiar") {

            icono.classList.add('ri-parent-fill');
            titulo.textContent = "Familia " + notificacion.entidad.apellidos;

            const tituloItem = document.createElement("div");
            tituloItem.classList.add("tarjeta__iconoItem");

            const iconoUbicacion = document.createElement("i");
            iconoUbicacion.classList.add("ri-map-pin-fill");

            const textoUbicacion = document.createElement("p");
            textoUbicacion.textContent = notificacion.entidad.direccion;

            tituloItem.append(iconoUbicacion, textoUbicacion);

            const usuarioCont = document.createElement("div");
            usuarioCont.classList.add("tarjeta__iconoItem");

            const usuarioIcono = document.createElement("i");
            usuarioIcono.classList.add("ri-user-line");

            const usuarioNombre = document.createElement("p");
            usuarioNombre.textContent = `${notificacion.audit.user} (${notificacion.audit.role})`;

            usuarioCont.append(usuarioIcono, usuarioNombre);
            infoCont.append(titulo, tituloItem, usuarioCont);

            estado.textContent = notificacion.entidad.estado;

            if (notificacion.entidad.estado_id === 4) estado.classList.add("badge--enviado");
            else if (notificacion.entidad.estado_id === 5) estado.classList.add("badge--devuelto");
            else if (notificacion.entidad.estado_id === 6) estado.classList.add("badge--rechazado");
            else if (notificacion.entidad.estado_id === 7) estado.classList.add("badge--aprobado");

            notificacionCont.addEventListener("click", async () => {
                await api.patch(`notifications/${notificacion.id}`, { is_read: true });
                location.href = esSupervisor ? `#/supervisor/plan_familiar/revision?familia_id=${notificacion.entidad.id}` 
                : `#/voluntario/plan_familiar/familia?id=${notificacion.entidad.id}`;
            });

            if (notificacion.entidad.comentario !== null) {
                tarjetaCuerpo = document.createElement("div");
                tarjetaCuerpo.classList.add("tarjeta__cuerpo");

                const iconoComentario = document.createElement("i");
                iconoComentario.classList.add("ri-message-2-line");

                const mensajeComentario = document.createElement("div");
                mensajeComentario.classList.add("tarjeta__mensaje-texto");

                const mensajeTitulo = document.createElement("span");
                mensajeTitulo.classList.add("tarjeta__mensaje-titulo");
                mensajeTitulo.textContent = 'Motivo de devolución';

                const mensajeContenido = document.createElement("p");
                mensajeContenido.classList.add("tarjeta__mensaje-contenido");
                mensajeContenido.textContent = notificacion.entidad.comentario;

                mensajeComentario.append(mensajeTitulo, mensajeContenido);
                tarjetaCuerpo.append(iconoComentario, mensajeComentario);
            }

        } else if (notificacion.entidad.tipo === "Usuario") {

            icono.classList.add('ri-user-settings-line');
            titulo.textContent = notificacion.entidad.nombre;
            estado.textContent = notificacion.audit.status_change;

            const tituloItem = document.createElement("div");
            tituloItem.classList.add("tarjeta__iconoItem");

            if (notificacion.audit.status_change.includes("Inactivo → Activo") || notificacion.audit.status_change.includes("Peticion → Activo")) {
                tituloItem.textContent = `El usuario ha sido activado`;
                estado.classList.add("badge--aprobado");
            } else if (notificacion.audit.status_change.includes("Activo → Inactivo")) {
                tituloItem.textContent = `El usuario ha sido inactivado`;
                estado.classList.add("badge--rechazado");
            } else if (notificacion.audit.status_change.includes("→ Peticion")) {
                tituloItem.textContent = `Nuevo usuario pendiente a ser aprobado`;
                estado.classList.add("badge--pendiente");
            }

            if (!notificacion.audit.status_change.includes("→ Peticion")) {
                const usuarioCont = document.createElement("div");
                usuarioCont.classList.add("tarjeta__iconoItem");

                const usuarioIcono = document.createElement("i");
                usuarioIcono.classList.add("ri-user-line");

                const usuarioNombre = document.createElement("p");
                usuarioNombre.textContent = `Acción por: ${notificacion.audit.user} (${notificacion.audit.role})`;

                usuarioCont.append(usuarioIcono, usuarioNombre);
                infoCont.append(titulo, tituloItem, usuarioCont);
            } else {
                infoCont.append(titulo, tituloItem);
            }

            notificacionCont.addEventListener("click", async () => {
                await api.patch(`notifications/${notificacion.id}`, { is_read: true });
                const esGestion = notificacion.entidad.estado_id === 1 || notificacion.entidad.estado_id === 2;
                if (esSupervisor) {
                    location.href = esGestion ? `#/supervisor/usuarios/gestion` : `#/supervisor/usuarios/peticiones`;
                } else {
                    location.href = esGestion ? `#/administrador/usuarios/gestion` : `#/administrador/usuarios/peticiones`;
                }
            });
        }

        iconoCont.append(icono);
        estadoCont.append(tiempo, estado);
        header.append(iconoCont, infoCont, estadoCont);
        notificacionCont.append(header, tarjetaCuerpo);

        return notificacionCont;
    };

    const recargarContainer = async () => {
        contenedor.innerHTML = "";
        await paginacion(`notifications/user/${userId}`, mensajeVacio, carta);
    };

    await paginacion(`notifications/user/${userId}`, mensajeVacio, carta);
};

export default notificacionesController;