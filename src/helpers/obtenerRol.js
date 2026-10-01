export const obtenerRol = () => {
    const hash = window.location.hash.endsWith("/") ? window.location.hash : window.location.hash + "/";
    const rolId = parseInt(localStorage.getItem("role_id"));

    return {
        esAdmin: rolId === 1 && hash.includes("/administrador/"),
        esSupervisor: rolId === 2 && hash.includes("/supervisor/"),
        esVoluntario: rolId === 3 && hash.includes("/voluntario/"),
    };
};