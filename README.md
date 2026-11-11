# Un buen plan

Invitación interactiva estática en español, preparada para GitHub Pages. Primera etapa: simulación, sin correos ni persistencia.

## Probar

Ejecutar `python3 -m http.server 5511` en esta carpeta y abrir http://localhost:5511.

Flujo: aceptar → elegir uno de cinco planes → seleccionar fecha y horario → confirmar → ver objeto de prueba en un diálogo. El objeto también está disponible en `window.invitationDraft`. Se pierde al recargar; no se usa localStorage ni se envían datos a ningún servidor.

## Configuración

`app.js` contiene `CONFIG`: planes, horarios provisionales, zona horaria y días bloqueados. Calendario fijo de noviembre de 2026; se bloquean días anteriores al actual y 12, 13, 18, 19, 27, 28, 29. Se permiten los demás días, incluidos días entre semana. Horarios: de 06:00 a 23:00 cada media hora. En el día actual no se aceptan horas pasadas. La disponibilidad comercial de las fincas no se ha verificado.

## GitHub Pages

Subir `index.html`, `style.css`, `app.js`, `.nojekyll` y `LICENSE` a un repositorio propio. En Settings → Pages seleccionar Deploy from a branch, la rama publicada y la carpeta raíz. No requiere compilación. No publicar claves de API.

## Segunda etapa pendiente

Añadir correo de la invitada, validación en servidor y una función externa que use Brevo. En esta etapa no se solicita correo ni se envía ninguna notificación.

## Créditos

Adaptación de la plantilla de Proyash40/Date. Se conserva su licencia MIT en LICENSE.

## Cambios locales y despliegue automático

GitHub Pages está configurado en `gerchay/un-buen-plan` con **Deploy from a branch → main → / (root)**. Cada push a `main` vuelve a publicar el sitio mediante el flujo de Pages de GitHub; no hace falta un workflow adicional. Los cambios locales no aparecen hasta hacer commit y push. Consultar Actions si el despliegue demora.

Horarios actuales: 35 opciones cada media hora, de 06:00 a 23:00 inclusive. La disponibilidad real de los establecimientos aún debe confirmarse.

## Brevo (preparado, desactivado)

`CONFIG.emailEndpoint` en `app.js` está vacío: no se envía nada. Al configurarlo aparece el campo de correo. La confirmación solo avanza si el Worker informa que Brevo aceptó el mensaje, no garantiza entrega en bandeja de entrada.

1. Crear y verificar el remitente en Brevo y habilitar correo transaccional.
2. En Cloudflare Workers, desplegar `backend/worker.mjs` con `backend/wrangler.jsonc` (por ejemplo, desde backend con `npx wrangler deploy`).
3. Configurar como secretos `BREVO_API_KEY`, `SENDER_EMAIL`, `HOST_EMAIL` (con `npx wrangler secret put NOMBRE`). No pegar secretos en los archivos ni en el chat. Para la primera prueba, escribe tu propio correo en el formulario o déjalo vacío; los destinatarios se deduplican.
4. Configurar ALLOWED_ORIGIN como `https://gerchay.github.io`; para probar desde el servidor local, usar `http://localhost:5511`. Es un origen, sin ruta ni slash final.
5. Poner la URL `https://TU-WORKER.workers.dev/invite` en CONFIG.emailEndpoint.

Se validan también en el servidor plan, fechas bloqueadas, horas pasadas y los intervalos. El correo de la invitada es opcional: vacío envía solo a HOST_EMAIL; informado envía a ella y copia oculta a HOST_EMAIL. INVITEE_EMAIL ya no se usa. Antes del despliegue real, configurar limitación de solicitudes en Cloudflare para evitar envíos repetidos. CORS no sustituye esa protección. No hay almacenamiento ni deduplicación persistente: ante errores de conexión revisar el correo antes de repetir. Brevo mantiene sus propios registros de envío.

Pruebas del Worker con Node 24 (Brevo simulado, no envían correos): `node --test backend/worker.test.mjs`.

## Revisión local: correo obligatorio y confirmación

Para revisar sin enviar, configurar `CONFIG.simulateEmail` en `true`: el campo de correo es obligatorio, se muestra un diálogo para revisar plan/fecha/hora/correo, y confirmar NO realiza solicitudes al Worker. Permite volver a corregir. La pantalla final indica que es una simulación.

Flujo aprobado: `simulateEmail` está en `false` para producción. Desplegar el Worker actualizado (también exige correo) y publicar frontend en main. Estos cambios todavía no se han desplegado desde esta tarea. Este comportamiento sustituye la opción anterior de enviar solo al anfitrión con correo vacío.
