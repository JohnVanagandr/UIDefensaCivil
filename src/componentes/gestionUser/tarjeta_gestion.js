import * as api from "@/helpers/api";
import { estado_planes, estado_usuarios, getBadgeClase } from "@/helpers/cambioEstado";
import { obtenerRol } from "@/helpers/obtenerRol.js";

export const tarjetaEstados = (info) => {

    const { esSupervisor, esAdmin } = obtenerRol();

    const rolID = parseInt(info.rol_id); 
    
    // Contenedor principal de la tarjeta
    const tarjeta = document.createElement('div');
    // Guardamos el ID aquí para que sea accesible desde cualquier parte de la tarjeta, ya que se espera que al hacer click nos muestre el modal de rechazar o aceptar el acceso
    tarjeta.setAttribute("data-id", info.id);
    tarjeta.classList.add('tarjeta', 'tarjeta--notificacion');
    
    if (esSupervisor && rolID !== 3) {
      tarjeta.classList.add("oculto");
      return tarjeta;
    }

    if (esAdmin && rolID !== 3 && rolID !== 2) {
      tarjeta.classList.add("oculto");
      return tarjeta;
    }

    if (!esSupervisor && !esAdmin) {
      tarjeta.classList.add("oculto");
      return tarjeta;
    }

    //Header
    const tarjetaHeader = document.createElement('div');
    tarjetaHeader.classList.add('tarjeta__header');

    // Hijo 2: Contenedor del icono de perfil
    const tarjetaIconoCont = document.createElement('div');
    tarjetaIconoCont.classList.add('tarjeta__icono-contenedor', 'tarjeta__icono-contenedor--azul');
    const iconoPerfil = document.createElement('i');
    iconoPerfil.classList.add('ri-user-line');
    tarjetaIconoCont.append(iconoPerfil);

    // Hijo 3: Contenedor de información del usuario
    const tarjetaInfo = document.createElement('div');
    tarjetaInfo.classList.add('tarjeta__info');

    const tarjetaTitulo = document.createElement('p');
    tarjetaTitulo.classList.add('tarjeta__titulo-notificacion');
    tarjetaTitulo.textContent = info.full_name;

    // Sub-hijo: Rol
    const itemRol = document.createElement('div');
    itemRol.classList.add('tarjeta__iconoItem');
    const iconoRol = document.createElement('i');
    iconoRol.classList.add('ri-user-line');
    const textoRol = document.createElement('p');
    textoRol.classList.add('valor__rol');
    textoRol.textContent = `Rol: ${info.rol}`;
    itemRol.append(iconoRol, textoRol);

    // Sub-hijo: Seccional
    const itemSeccional = document.createElement('div');
    itemSeccional.classList.add('tarjeta__iconoItem');
    const iconoSeccional = document.createElement('i');
    iconoSeccional.classList.add('ri-map-pin-fill');
    const textoSeccional = document.createElement('p');
    textoSeccional.classList.add('valor__seccional');
    textoSeccional.textContent = `Seccional: ${info.sectional}`;
    itemSeccional.append(iconoSeccional, textoSeccional);

    // Sub-hijo: Organización
    const itemOrg = document.createElement('div');
    itemOrg.classList.add('tarjeta__iconoItem');
    const iconoOrg = document.createElement('i');
    iconoOrg.classList.add('ri-map-pin-fill');
    const textoOrg = document.createElement('p');
    textoOrg.classList.add('valor__organizacion');
    textoOrg.textContent = `Organizacion: ${info.organization}`;
    itemOrg.append(iconoOrg, textoOrg);

    // Sub-hijo: Correo
    const itemCorreo = document.createElement('div');
    itemCorreo.classList.add('tarjeta__iconoItem');
    const iconoCorreo = document.createElement('i');
    iconoCorreo.classList.add('ri-mail-line');
    const textoCorreo = document.createElement('p');
    textoCorreo.classList.add('valor__correo');
    textoCorreo.textContent = `Correo: ${info.email}`;
    itemCorreo.append(iconoCorreo, textoCorreo);

    // Unir hijos al contenedor de información
    tarjetaInfo.append(tarjetaTitulo, itemRol, itemSeccional, itemOrg, itemCorreo);

    // Hijo 4: Contenedor de estado
    const tarjetaEstado = document.createElement('div');
    tarjetaEstado.classList.add('tarjeta__estado');
    const tarjetaBadge = document.createElement('span'); 
    tarjetaBadge.className = getBadgeClase(info.status_id, estado_usuarios);
    tarjetaBadge.textContent = info.status;
    tarjetaEstado.append(tarjetaBadge);

    // Unir elementos al header
    tarjetaHeader.append(tarjetaIconoCont, tarjetaInfo, tarjetaEstado);
    // Unir el header al contenedor principal
    tarjeta.append(tarjetaHeader);

    return tarjeta;
};