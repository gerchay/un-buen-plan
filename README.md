# Un buen plan

Invitación interactiva estática en español, preparada para GitHub Pages. Primera etapa: simulación, sin correos ni persistencia.

## Probar

Ejecutar `python3 -m http.server 5511` en esta carpeta y abrir http://localhost:5511.

Flujo: aceptar → elegir uno de cinco planes → seleccionar fecha y horario → confirmar → ver objeto de prueba en un diálogo. El objeto también aparece en la consola y en `window.invitationDraft`. Se pierde al recargar; no se usa localStorage ni se envían datos a ningún servidor.

## Configuración

`app.js` contiene `CONFIG`: planes, horarios provisionales, zona horaria y días bloqueados. Calendario fijo de noviembre de 2026; se bloquean días anteriores al actual y 12, 13, 18, 19, 27, 28, 29. Se permiten los demás días, incluidos días entre semana. Horarios provisionales: 10:00, 12:00, 15:00, 17:00, 19:00. En el día actual no se aceptan horas pasadas. La disponibilidad comercial de las fincas no se ha verificado.

## GitHub Pages

Subir `index.html`, `style.css`, `app.js`, `.nojekyll` y `LICENSE` a un repositorio propio. En Settings → Pages seleccionar Deploy from a branch, la rama publicada y la carpeta raíz. No requiere compilación. No publicar claves de API.

## Segunda etapa pendiente

Añadir correo de la invitada, validación en servidor y una función externa que use Brevo. En esta etapa no se solicita correo ni se envía ninguna notificación.

## Créditos

Adaptación de la plantilla de Proyash40/Date. Se conserva su licencia MIT en LICENSE.
