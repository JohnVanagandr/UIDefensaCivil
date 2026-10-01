/**
 * Controlador: Perfil de Usuario (perfilController.js)
 * Gestiona la interfaz Mi Perfil, cargando los datos personales del usuario activo 
 * desde la API, y habilitando la edición controlada (con contraseñas de confirmación) 
 * de datos sensibles como Teléfono, Correo y Contraseña. 
 * También maneja el cierre de sesión seguro.
 */
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { alertas as alerta } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { api } from "@/helpers/index.js";
// Importación explícita desde index.js del directorio para asegurar la resolución de rutas en Vite.
import { cargarDatosHelper as cargarDatos } from "@/helpers/index.js";

export default async () => {
    // Referencias al DOM (Campos de Muestra)
    const rolId = parseInt(localStorage.getItem("role_id"));
    const esSupervisor = rolId === 2;

    const container = document.querySelector(".container");

    const nombres = document.getElementById("nombres");
    const apellidos = document.getElementById("apellidos");
    const tipoDocumento = document.getElementById("tipoDocumento");
    const numeroDocumento = document.getElementById("numeroDocumento");
    const fechaNacimiento = document.getElementById("fechaNacimiento");
    const genero = document.getElementById("genero");
    const seccional = document.getElementById("seccional");
    const organizacion = document.getElementById("organizacion");
    const telefono = document.getElementById("telefono");
    const correo = document.getElementById("correo");
    const contrasena = document.getElementById("contrasena");

    const botonCerrarSesion = document.getElementById("botonCerrarSesion");
    const botonBack = document.getElementById("botonBack");
    botonBack.onclick = () => {
        history.back();
    };

    if(esSupervisor){
        container.classList.add("container--supervisor");
    };

    const botonEditarTelefono = document.getElementById('botonEditarTelefono');
    const accionesTelefono = document.getElementById('accionesTelefono');
    const passwordTelefono = document.getElementById('passwordTelefono');
    const botonCancelarTelefono = document.getElementById('botonCancelarTelefono');
    const botonGuardarTelefono = document.getElementById('botonGuardarTelefono');


    const botonEditarCorreo = document.getElementById('botonEditarCorreo');
    const accionesCorreo = document.getElementById('accionesCorreo');
    const passwordCorreo = document.getElementById('passwordCorreo');
    const botonCancelarCorreo = document.getElementById('botonCancelarCorreo');
    const botonGuardarCorreo = document.getElementById('botonGuardarCorreo');

    const botonEditarPassword = document.getElementById('botonEditarPassword');
    const accionesPassword = document.getElementById('accionesPassword');
    const passwordOriginal = document.getElementById('passwordOriginal');
    const passwordNueva = document.getElementById('passwordNueva');
    const passwordNuevaRepeticion = document.getElementById('passwordNuevaRepeticion');
    const botonCancelarPassword = document.getElementById('botonCancelarPassword');
    const botonGuardarPassword = document.getElementById('botonGuardarPassword');


    const id = localStorage.getItem("id");
    await cargarDatos.cargarDatos(`users/${id}`,[nombres, apellidos,tipoDocumento,numeroDocumento,fechaNacimiento,genero,seccional,organizacion,telefono,correo], ["names", "last_names","document_type","document_number","birth_date","gender","sectional","organization","phone","email"],);

    const iniciales = document.getElementById('iniciales');
    const nombreCompleto = document.getElementById('nombreCompleto');
    const rangoDefensa = document.getElementById('rangoDefensa');
    iniciales.textContent = nombres.value[0]+apellidos.value[0];
    nombreCompleto.textContent = `${nombres.value} ${apellidos.value}`;
    rangoDefensa.textContent = `${seccional.value} •${organizacion.value}`;

    botonCerrarSesion.addEventListener("click", async () => {
        const pregunta = await alerta.alertaQuest(
            "¿Seguro que quieres cerrar sesion?",
        );
        if (pregunta.isConfirmed) {
            await api.post("logout");
            window.location.href = "#/";
            localStorage.clear();
        }
    });

    botonEditarTelefono.addEventListener("click", async () => {
        const guardado = telefono.value;
        telefono.disabled = false;
        accionesTelefono.classList.remove('invisible');
        passwordTelefono.parentElement.classList.remove('invisible');

        botonCancelarTelefono.addEventListener("click", async () => {
        accionesTelefono.classList.add('invisible');
        passwordTelefono.parentElement.classList.add('invisible');
        passwordTelefono.value = "";
        telefono.value = guardado;
        telefono.disabled = true;
    })
        botonGuardarTelefono.addEventListener("click", async () => {
            await alerta.alertaOK('Telefono guardado exitosamente');
            accionesTelefono.classList.add('invisible');
            passwordTelefono.parentElement.classList.add('invisible');
            passwordTelefono.value = "";
            telefono.disabled = true;
        })
    })

    botonEditarCorreo.addEventListener("click", async () => {
    const guardado = correo.value;

    correo.disabled = false;
    accionesCorreo.classList.remove('invisible');
    passwordCorreo.parentElement.classList.remove('invisible');

    botonCancelarCorreo.addEventListener("click", async () => {
        accionesCorreo.classList.add('invisible');
        passwordCorreo.parentElement.classList.add('invisible');
        passwordCorreo.value = "";
        correo.value = guardado;
        correo.disabled = true;
    });

    botonGuardarCorreo.addEventListener("click", async () => {
        await alerta.alertaOK('Correo guardado exitosamente');
        accionesCorreo.classList.add('invisible');
        passwordCorreo.parentElement.classList.add('invisible');
        passwordCorreo.value = "";
        correo.disabled = true;
    });
    });

    botonEditarPassword.addEventListener("click", async () => {
        contrasena.parentElement.classList.add('invisible');
        passwordOriginal.parentElement.classList.remove('invisible');
        passwordNueva.parentElement.classList.remove('invisible');
        passwordNuevaRepeticion.parentElement.classList.remove('invisible');
        accionesPassword.classList.remove('invisible');

        botonCancelarPassword.addEventListener("click", async () => {
            contrasena.parentElement.classList.remove('invisible');
            passwordOriginal.parentElement.classList.add('invisible');
            passwordNueva.parentElement.classList.add('invisible');
            passwordNuevaRepeticion.parentElement.classList.add('invisible');
            accionesPassword.classList.add('invisible');
            passwordOriginal.value = "";
            passwordNueva.value = "";
            passwordNuevaRepeticion.value = "";
        });

        botonGuardarPassword.addEventListener("click", async () => {
            await alerta.alertaOK('Contraseña guardada exitosamente');
            contrasena.parentElement.classList.remove('invisible');
            passwordOriginal.parentElement.classList.add('invisible');
            passwordNueva.parentElement.classList.add('invisible');
            passwordNuevaRepeticion.parentElement.classList.add('invisible');
            accionesPassword.classList.add('invisible');
            passwordOriginal.value = "";
            passwordNueva.value = "";
            passwordNuevaRepeticion.value = "";
    });
    });
};
