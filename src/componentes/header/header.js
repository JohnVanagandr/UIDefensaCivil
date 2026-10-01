// Header: barra superior con logo, notificaciones y perfil; además inyecta sidebar y bottom nav para supervisores
import * as api from "@/helpers/api";
import { crearAsideSupervisor, crearAsideMobile, marcarActivo } from "@/componentes/navegacion/aside";
import { crearNotificationPanel } from "./notificationPanel";

export const componenteHeader = async () => {
    
    const headerCont = document.createElement("header");
    headerCont.classList.add("headerCont");

    const header = document.createElement("div");
    header.classList.add("header"); 

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {

        const currentY = window.scrollY;

        if(currentY > lastScrollY && currentY > 60) {

            header.classList.add("header--hidden");
        } else {

            header.classList.remove("header--hidden");
        }

        lastScrollY = currentY;
    });
    
    const botonAtras = document.createElement("button");
    botonAtras.classList.add("header__boton", "header__boton--atras");
    botonAtras.id = "botonBack";
    const iconBack = document.createElement("i");
    iconBack.classList.add("header__icono", "ri-arrow-left-s-line");
    botonAtras.append(iconBack);
    
    const home = document.createElement("div");
    home.classList.add("header__contenedor");
    
    const logo = document.createElement("img");
    logo.classList.add("header__imagen-logo");
    logo.src="/logo.png";
    
    const headerTexto = document.createElement("div");
    headerTexto.classList.add("header__texto");
    
    const textoUno = document.createElement("p");
    textoUno.classList.add("header__subtitulo");
    textoUno.textContent='PLAN FAMILIAR DE';
    
    const textoDos = document.createElement("p");
    textoDos.classList.add("header__titulo");
    textoDos.textContent='EMERGENCIA';
    
    headerTexto.append(textoUno, textoDos);
    
    home.append(logo, headerTexto);
    
    
    const rightHeader = document.createElement("div");
    rightHeader.classList.add("header__contenedor");
    
    const botonNoti = document.createElement("button");
    botonNoti.classList.add("header__boton", "header__boton--notificacion");
    const iconNoti = document.createElement("i");
    iconNoti.classList.add("header__icono", "ri-notification-2-fill");
    const indicador = document.createElement("span");
    indicador.classList.add("header__indicador");
    botonNoti.append(iconNoti, indicador);

    const botonPerfil = document.createElement("button");
    botonPerfil.classList.add("header__boton", "header__boton--usuario");
    const iconPerfil = document.createElement("i");
    iconPerfil.classList.add("header__icono", "ri-user-3-fill");
    botonPerfil.appendChild(iconPerfil);

    rightHeader.append(botonNoti, botonPerfil);

    header.append(botonAtras, home, rightHeader);

    headerCont.appendChild(header);

    
    const rolId = localStorage.getItem("role_id");
    const userId = localStorage.getItem("id");
    const hash = location.hash.slice(2);
    
    if (rolId === '2') {
        const aside = crearAsideSupervisor();
        aside.classList.add("sidebar--flotante");
        headerCont.appendChild(aside);

        const rutasPublicas = ['/login', '/register', '/forgotPassword', '/verificar_codigo', '/cambiar_password'];
        const hashActual = window.location.hash.replace('#', '').split('?')[0];
        const esPaginaPublica = rutasPublicas.some(r => hashActual === r || hashActual.startsWith(r + '/'));
        if (!esPaginaPublica) {
            const mobileNav = crearAsideMobile();
            document.body.appendChild(mobileNav);

            let lastScrollY = 0;
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        const currentY = window.scrollY;
                        if (currentY > lastScrollY && currentY > 60) {
                            mobileNav.classList.add('sidebar-mobile--hidden');
                        } else {
                            mobileNav.classList.remove('sidebar-mobile--hidden');
                        }
                        lastScrollY = currentY;
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });

            window.addEventListener('hashchange', () => {
                marcarActivo(mobileNav, window.location.hash);
            });
        }
    }

    const esVoluntarioDashboard = location.hash === '#/voluntario' || location.hash === '#/voluntario/';
    let panelCtrl = null;
    if (!esVoluntarioDashboard) {
      panelCtrl = crearNotificationPanel(headerCont, rolId, userId);
    }

    const cargarIndicador = async () => {

        if (!userId) return;
        
        const data = await api.get(`notifications/user/count/${userId}`);
        const count = data?.unread_notifications ?? 0;

        if (count === 0) {
            indicador.classList.add('invisible');
        } else {
            indicador.classList.remove('invisible');
            indicador.textContent = count >= 10 ? '9+' : count;
        }
    };

    // botón HOME: se agregó una validacion antes del evento ya que primero cargaba el controller y no el html lo cual hacia que el boton en ese instante no existiera, lo cual no nos dejaba cargar la pagina correctamente
    if(home){
    home.addEventListener("click", () => {
        if (rolId == 1) location.href = `#/administrador`
        else if(rolId == 2) location.href = `#/supervisor`
        else if(rolId == 3)location.href = `#/voluntario`
    });
    }

    // botón PERFIL
    if(botonPerfil){
        botonPerfil.addEventListener("click", () => {
        if (hash == 'usuarios/perfil') return
        location.hash = "#/usuarios/perfil";
    });
    }

    if(botonNoti){
    botonNoti.addEventListener("click", () => {
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop && panelCtrl && !esVoluntarioDashboard) {
            panelCtrl.toggle();
        } else {
            if (rolId == 1) {
                location.hash = "#/administrador/notificaciones";
            } else if (rolId == 2) {
                location.hash = "#/supervisor/notificaciones";
            } else if (rolId == 3) {
                location.hash = "#/voluntario/notificaciones";
            }
        }
    });
    }

    const layout = document.querySelector(".layout");

    if (layout) {
        layout.insertAdjacentElement("afterbegin", headerCont);
    }

    await cargarIndicador();

    return headerCont;

};