# Inventario de Pruebas Unitarias — `@marxa/auth-ui`

Cada spec valida el comportamiento visible al usuario, guardrails de formulario y flujos de error de las vistas de autenticación y onboarding.

## 1. [auth-login.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/ui/src/lib/components/auth-login/auth-login.component.spec.ts) (3 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should warn the user that their account has no admin permissions after signing in with an unauthorized Google account` | Muestra alerta visible (`role="alert"`) cuando la cuenta Google no tiene permisos. |
| `should redirect an authorized administrator to the configured landing route right after Google sign-in` | Redirige al administrador autorizado a `postLoginRedirectUrl`. |
| `should display the unauthorized notice when redirected back to login with reason=unauthorized` | Muestra el aviso de acceso restringido al volver desde `authAdminGuard`. |

## 2. [accept-invite.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/ui/src/lib/components/accept-invite/accept-invite.component.spec.ts) (4 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should activate the invited user access and enter the app immediately when no profile completion is required` | Activa acceso y redirige directo cuando no se requiere completar perfil. |
| `should advise the user when the invitation link is expired or was already used` | Informa al usuario que el enlace expiró o ya fue utilizado. |
| `should advise the user to switch Google account when signed in with a different email than the invite` | Pide cambiar de cuenta Google si el correo autenticado no coincide con la invitación. |
| `should ask the invited user to complete their display name before activating access when profile completion is required` | Exige completar el nombre antes de activar el perfil cuando está configurado. |

## 3. [request-access.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/ui/src/lib/components/request-access/request-access.component.spec.ts) (1 spec)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should confirm to the applicant that their email access request was registered and is awaiting admin review` | Muestra banner de confirmación (`role="status"`) tras registrar la solicitud. |

## 4. [request-access-form.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/ui/src/lib/components/request-access-form/request-access-form.component.spec.ts) (3 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should clear previous submission errors when the applicant switches between Google and email tabs` | Emite cambio de tab para limpiar errores previos al alternar método. |
| `should prevent submitting an email request without a valid name and email format` | Bloquea envíos con nombre corto o correo inválido. |
| `should emit the email access request payload once required applicant details are valid` | Emite el payload válido para registrar la solicitud por correo. |
