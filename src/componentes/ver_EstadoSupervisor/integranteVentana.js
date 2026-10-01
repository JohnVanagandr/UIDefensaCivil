import * as api from "@/helpers/api";
import * as alerta from "@/helpers/alertas";

const integranteVentana = async (miembro, info) =>{

    console.log(miembro);
    
    
    const overlay = document.createElement("div");
    overlay.classList.add("overlay_verEstado");

    const ventana = document.createElement("div");
    ventana.classList.add("ventana", "ventana__supervisor");

    const btnCerrar = document.createElement("button");
    btnCerrar.classList.add("ri-close-line", "btn-cerrar-Estado");

    const btnCerrarCont = document.createElement("div");
    btnCerrarCont.classList.add("btn-cerrar-Cont");
    btnCerrarCont.append(btnCerrar)

    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-editar", "boton");
    btnEditar.textContent = "Editar";

    
    // NOMBRE Y APELLIDO _____________________________________________________________________________________________

    const nombreCont= document.createElement("div");
    nombreCont.classList.add("form_autorizacion", "form-column_autorization");

    const nombreTitulo = document.createElement("p");
    nombreTitulo.classList.add("form__texto");
    const userIcono = document.createElement("i");
    userIcono.classList.add("icono--pequeno", "ri-user-line");

    nombreTitulo.append(userIcono, " Nombre");

    const nombreIntegrante = document.createElement("p");
    nombreIntegrante.classList.add("form_autorizacion", "integrante--nombre");
    nombreIntegrante.textContent = miembro.full_name;

    nombreCont.append(nombreTitulo, nombreIntegrante);

    //


    // RELACION FAMILIAR _____________________________________________________________________________________________
    const relacionCont = document.createElement("div");
    relacionCont.classList.add("form_autorizacion", "form-column_autorization");

    const relacionTitulo = document.createElement("p");
    relacionTitulo.classList.add("form__texto");
    const relacionIcono = document.createElement("i");
    relacionIcono.classList.add("icono--pequeno", "ri-user-community-line");

    relacionTitulo.append(relacionIcono, " Relación Familiar");

    const relacionIntegrante = document.createElement("p");
    relacionIntegrante.classList.add("form_autorizacion");
    relacionIntegrante.textContent = miembro.kinship;

    relacionCont.append(relacionTitulo, relacionIntegrante);

    //


    // DOCUMENTOS _______________________________________________________________________________________________________
    const documentosCont = document.createElement("div");
    documentosCont.classList.add("form_autorizacion", "form-column_autorization");

    const documentosTitulo = document.createElement("p");
    documentosTitulo.classList.add("form__texto");
    const documentoIcono = document.createElement("i");
    documentoIcono.classList.add("icono--pequeno", "ri-id-card-line");
    documentosTitulo.append(documentoIcono, " Documentos");

    const documentoIdentidad = document.createElement("p");
    documentoIdentidad.classList.add("form_autorizacion");
    documentoIdentidad.textContent = `${miembro.document_acronym} ${miembro.document_number}`;

    documentosCont.append(documentosTitulo, documentoIdentidad);
    //


    // FECHA DE NACIMIENTO ______________________________________________________________________________________________
    const fechaNacimientoCont = document.createElement("div");
    fechaNacimientoCont.classList.add("form_autorizacion", "form-column_autorization");

    const fechaTitulo = document.createElement("p");
    fechaTitulo.classList.add("form__texto");
    const fechaIcono = document.createElement("i");
    fechaIcono.classList.add("icono--pequeno", "ri-calendar-line");
    fechaTitulo.append(fechaIcono, " Fecha de Nacimiento");

    const fechaNacimiento = document.createElement("p");
    fechaNacimiento.classList.add("form_autorizacion");
    fechaNacimiento.textContent = miembro.birth_date;

    fechaNacimientoCont.append(fechaTitulo, fechaNacimiento);
    //


    // NÚMERO DE TELÉFONO _____________________________________________________________________________________________
    const numeroTelefonoCont = document.createElement("div");
    numeroTelefonoCont.classList.add("form_autorizacion", "form-column_autorization");

    const telefonoTitulo = document.createElement("p");
    telefonoTitulo.classList.add("form__texto");
    const telefonoIcono = document.createElement("i");
    telefonoIcono.classList.add("icono--pequeno", "ri-phone-line");

    telefonoTitulo.append(telefonoIcono, " Número de Teléfono");

    const numeroTelefono = document.createElement("p");
    numeroTelefono.classList.add("form_autorizacion");
    numeroTelefono.textContent = miembro.phone;

    numeroTelefonoCont.append(telefonoTitulo, numeroTelefono);
    //


    // GÉNERO _________________________________________________________________________________________________________________
    const generoCont = document.createElement("div");
    generoCont.classList.add("form_autorizacion", "form-column_autorization");

    const generoTitulo = document.createElement("p");
    generoTitulo.classList.add("form__texto");
    const generoIcono = document.createElement("i");
    generoIcono.classList.add("icono--pequeno", "ri-genderless-line");
    generoTitulo.append(generoIcono, " Género");
    const genero = document.createElement("p");
    genero.classList.add("form_autorizacion");
    genero.textContent = miembro.gender;

    generoCont.append(generoTitulo, genero);
    //


    // NACIONALIDAD _____________________________________________________________________________________________________________
    const nacionalidadCont = document.createElement("div");
    nacionalidadCont.classList.add("form_autorizacion", "form-column_autorization");

    const nacionalidadTitulo = document.createElement("p");
    nacionalidadTitulo.classList.add("form__texto");
    const nacionalidadIcono = document.createElement("i");
    nacionalidadIcono.classList.add("icono--pequeno", "ri-flag-line");
    nacionalidadTitulo.append(nacionalidadIcono, " Nacionalidad");
    const nacionalidad = document.createElement("p");
    nacionalidad.classList.add("form_autorizacion");
    nacionalidad.textContent = miembro.nationality;

    nacionalidadCont.append(nacionalidadTitulo, nacionalidad);
    //


    // EPS _____________________________________________________________________________________________________________
    const epsCont = document.createElement("div");
    epsCont.classList.add("form_autorizacion", "form-column_autorization");

    const epsTitulo = document.createElement("p");
    epsTitulo.classList.add("form__texto");
    const epsIcono = document.createElement("i");
    epsIcono.classList.add("icono--pequeno", "ri-hospital-line");
    epsTitulo.append(epsIcono, " EPS");
    const eps = document.createElement("p");
    eps.classList.add("form_autorizacion");
    eps.textContent = miembro.eps;

    epsCont.append(epsTitulo, eps);
    //


    // AFECCIONES _____________________________________________________________________________________________________________
    const afeccionesCont = document.createElement("div");
    afeccionesCont.classList.add("form_autorizacion", "form-column_autorization");

    const afeccionesTitulo = document.createElement("p");
    afeccionesTitulo.classList.add("form__texto");
    const afeccionesIcono = document.createElement("i");
    afeccionesIcono.classList.add("icono--pequeno", "ri-stethoscope-line");
    afeccionesTitulo.append(afeccionesIcono, " Afecciones");

    const conditions = await api.get(`conditionMembers/member/${miembro.id}`);
        
    afeccionesCont.append(afeccionesTitulo);

    if (conditions.length === 0) {

        const sinAfecciones = document.createElement("p");
        sinAfecciones.classList.add("form_autorizacion");
        sinAfecciones.textContent = "Sin afecciones registradas";
        afeccionesCont.append(sinAfecciones);
    } else {
        
        conditions.forEach(condition => {

            const afeccion = document.createElement("p");
            afeccion.classList.add("form_autorizacion");
            afeccion.textContent = `${condition.condition_type.name} - ${condition.name}`;

            const tratamiento = document.createElement("p");
            tratamiento.classList.add("form_autorizacion");
            tratamiento.textContent = `Tratamiento: ${condition.dose}`;

            afeccionesCont.append(afeccion, tratamiento);
        });
    }
    //

    
    // TIPO DE SANGRE _____________________________________________________________________________________________________________
    const tipoSangreCont = document.createElement("div");
    tipoSangreCont.classList.add("form_autorizacion", "form-column_autorization");

    const tipoSangreTitulo = document.createElement("p");
    tipoSangreTitulo.classList.add("form__texto");
    const tipoSangreIcono = document.createElement("i");
    tipoSangreIcono.classList.add("icono--pequeno", "ri-drop-line");
    tipoSangreTitulo.append(tipoSangreIcono, " Tipo de Sangre");
    const tipoSangre = document.createElement("p");
    tipoSangre.classList.add("form_autorizacion");
    tipoSangre.textContent = miembro.blood_group;
    tipoSangreCont.append(tipoSangreTitulo, tipoSangre);
    //


    // Estructura Final DOM de la Ventana Modal de Información del Integrante ------------------------------------------------------ : >
    const contenidoVentana = document.createElement("div");
    contenidoVentana.classList.add("contenido-ventana")
    
    contenidoVentana.append(nombreCont, relacionCont, documentosCont, fechaNacimientoCont, generoCont, nacionalidadCont, numeroTelefonoCont, epsCont, afeccionesCont, tipoSangreCont);
    
    if (info.status_plan_id !== 6 && info.status_plan_id !== 7) {
        ventana.append(btnCerrarCont, contenidoVentana, btnEditar);
    } else {
        ventana.append(btnCerrarCont, contenidoVentana);
    }

    overlay.append(ventana);

    btnCerrar.onclick = () => overlay.remove();

    const container = document.querySelector(".container");
    container.appendChild(overlay);

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };


    btnEditar.addEventListener("click", () => {
        location.href = `#/supervisor/plan_familiar/integrantes/editar?familia_id=${info.id}&integrante_id=${miembro.id}`;
        overlay.remove();
    });
}

export default integranteVentana;