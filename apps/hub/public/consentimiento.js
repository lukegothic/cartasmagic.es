// Aviso de cookies con Consent Mode basico: hasta que el visitante elige no se carga
// gtag.js ni sale ninguna peticion a Google, y si rechaza no sale nunca.
//
// gtag existe siempre, pero solo apunta mientras hay consentimiento. Los scripts de
// medicion de la pagina comprueban si existe al cargar y, si no, no se enganchan: sin
// esto, quien acepta en su primera visita perderia los eventos de esa misma pagina. Por
// eso este fichero va sin async en el head, antes que ellos.
//
// vender tiene una copia de este fichero: son dos despliegues sin nada compartido.
(function () {
    var CLAVE = 'consentimiento-cookies';
    var VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;
    var ELECCIONES = ['aceptar', 'rechazar'];

    var eleccionVigente = function (guardado, ahora) {
        if (!guardado) return null;
        var datos;
        try {
            datos = JSON.parse(guardado);
        } catch (e) {
            return null;
        }
        if (!datos || ELECCIONES.indexOf(datos.eleccion) === -1) return null;
        // Sin fecha la resta da NaN y no cumple ninguna de las dos condiciones, asi que
        // cuenta como caducada. Una fecha futura tampoco vale: no caducaria nunca.
        var edad = ahora - datos.fecha;
        if (!(edad >= 0 && edad < VIGENCIA_MS)) return null;
        return datos.eleccion;
    };

    var serializarEleccion = function (eleccion, ahora) {
        return JSON.stringify({ eleccion: eleccion, fecha: ahora });
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = { eleccionVigente: eleccionVigente, serializarEleccion: serializarEleccion };
        return;
    }

    var idGa = document.currentScript.getAttribute('data-ga');
    var activo = false;
    var cargado = false;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        if (activo) window.dataLayer.push(arguments);
    };

    // Con el almacenamiento bloqueado, leer o escribir lanza. Entonces no hay eleccion
    // guardada y el aviso sale en cada pagina, que es lo correcto sin poder recordarla.
    var leer = function () {
        try {
            return localStorage.getItem(CLAVE);
        } catch (e) {
            return null;
        }
    };

    var escribir = function (eleccion) {
        try {
            localStorage.setItem(CLAVE, serializarEleccion(eleccion, Date.now()));
        } catch (e) {}
    };

    var cargarGa = function () {
        activo = true;
        // Quien rechaza y vuelve a aceptar en la misma pagina ya tiene gtag.js cargado.
        if (cargado) {
            gtag('consent', 'update', { analytics_storage: 'granted' });
            return;
        }
        cargado = true;
        gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
        });
        // Solo se pide analitica: la publicidad se queda denegada aunque se acepte.
        gtag('consent', 'update', { analytics_storage: 'granted' });
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + idGa;
        document.head.appendChild(script);
        gtag('js', new Date());
        gtag('config', idGa);
    };

    // Retirar el consentimiento tiene que costar lo mismo que darlo: gtag deja de apuntar
    // en esta pagina, gtag.js deja de cargarse en las siguientes y se borran las cookies
    // que ya dejo Google Analytics.
    var retirarGa = function () {
        if (cargado) gtag('consent', 'update', { analytics_storage: 'denied' });
        activo = false;
        var dominio = location.hostname.replace(/^www\./, '');
        document.cookie.split('; ').forEach(function (cookie) {
            var nombre = cookie.split('=')[0];
            if (nombre.indexOf('_ga') !== 0) return;
            ['', '; domain=.' + dominio].forEach(function (ambito) {
                document.cookie = nombre + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + ambito;
            });
        });
    };

    var eleccion = eleccionVigente(leer(), Date.now());
    if (eleccion === 'aceptar') cargarGa();

    document.addEventListener('DOMContentLoaded', function () {
        var aviso = document.getElementById('aviso-cookies');

        // La barra va fija abajo: sin este hueco taparia el final de la pagina hasta elegir.
        var mostrar = function () {
            aviso.hidden = false;
            document.body.style.paddingBottom = aviso.offsetHeight + 'px';
        };
        var ocultar = function () {
            aviso.hidden = true;
            document.body.style.paddingBottom = '';
        };

        if (!eleccion) mostrar();

        Array.prototype.forEach.call(aviso.querySelectorAll('[data-consentimiento]'), function (boton) {
            boton.addEventListener('click', function () {
                var elegida = boton.getAttribute('data-consentimiento');
                escribir(elegida);
                if (elegida === 'aceptar') cargarGa();
                else retirarGa();
                ocultar();
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-abrir-cookies]'), function (enlace) {
            enlace.addEventListener('click', function () {
                mostrar();
                aviso.querySelector('[data-consentimiento]').focus();
            });
        });
    });
})();
