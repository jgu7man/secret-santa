# Inventario de Pruebas Unitarias — `@marxa/auth-engine`

Cada spec valida de forma independiente una regla de negocio o seguridad del motor de autenticación, RBAC y onboarding.

## 1. [access-onboarding.service.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/engine/src/lib/services/access-onboarding.service.spec.ts) (11 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should consider an invitation available for redemption while it is pending and within its validity window` | Permite canjear invitaciones `PENDING` antes de `expiresAt`. |
| `should treat an invitation as unavailable once its expiration deadline has passed` | Bloquea tokens vencidos aunque sigan en estado `PENDING`. |
| `should prevent reusing an invitation that was already accepted or revoked by an admin` | Impide reutilizar tokens `ACCEPTED` o `REVOKED`. |
| `should hydrate access requests and invitations preserving the Firestore document ID` | Garantiza que el `id` canónico provenga del documento de Firestore. |
| `should reject corrupted onboarding records with unknown roles or missing email before exposing them` | Falla rápido ante documentos corruptos antes de llegar a la UI. |
| `should reject a Google access request when the Google account has no valid email` | Impide solicitudes sin correo electrónico utilizable. |
| `should reject an email access request when displayName or email is missing` | Exige nombre y correo válidos antes de registrar una solicitud manual. |
| `should return null without querying when an invitation token is blank` | Evita consultas innecesarias con tokens vacíos. |
| `should require an active admin session before creating a direct invitation` | Garantiza trazabilidad (`createdBy`) exigiendo sesión activa. |
| `should refuse redeeming an expired or already-used invitation` | Bloquea el canje en el servicio incluso si la UI fue manipulada. |
| `should block invitation redemption when the signed-in Google email does not match the invited email` | Impide que otra cuenta de Google consuma una invitación ajena. |

## 2. [auth-session.service.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/engine/src/lib/services/auth-session.service.spec.ts) (6 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should identify a visitor without an active session as unauthenticated without forcing a sign-out` | Distingue visitantes anónimos sin disparar `logout()`. |
| `should grant admin panel access to an active user whose role is authorized for the app` | Permite el acceso a administradores activos. |
| `should automatically sign out an authenticated user who lacks administrative privileges` | Cierra sesión automáticamente a usuarios sin rol autorizado. |
| `should revoke session and deny access to a suspended administrator` | Bloquea administradores en estado `SUSPENDED`. |
| `should deny access and sign out when the authenticated user has no profile record in the directory` | Bloquea cuentas de Firebase Auth sin perfil en `users`. |
| `should allow access to roles dynamically enabled in runtime app configuration` | Respeta cambios dinámicos de `allowedAdminRoles` desde `apps/{appId}.auth`. |

## 3. [auth-runtime-config.service.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/engine/src/lib/services/auth-runtime-config.service.spec.ts) (2 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should preserve boot fallback settings before Firestore overrides are applied` | Asegura valores de arranque antes de hidratar Firestore. |
| `should apply updated runtime auth settings immediately without losing appId` | Aplica configuración dinámica preservando el `appId` de la aplicación. |

## 4. [auth-guards.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/auth/engine/src/lib/guards/auth-guards.spec.ts) (5 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should allow access to protected admin routes for authorized sessions` | Permite navegar a rutas protegidas con sesión autorizada. |
| `should redirect unauthenticated visitors to the configured login route` | Redirige a `loginRoute` dinámico cuando no hay sesión. |
| `should redirect unauthorized signed-in users to login with an unauthorized reason notice` | Agrega `?reason=unauthorized` para mostrar aviso de acceso denegado. |
| `should skip the login screen and send already-authorized admins straight to the app home` | Evita mostrar `/login` a un admin ya autenticado (`postLoginRedirectUrl`). |
| `should allow unauthenticated visitors to view the login screen` | Permite acceso a `/login` cuando no hay sesión activa. |
