# Inventario de Pruebas Unitarias — `@marxa/crew-ui`

Cada spec valida reglas operativas de administración de equipo, filtros combinados y resiliencia ante fallos.

## 1. [crew-manager.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/crew/ui/src/lib/components/crew-manager/crew-manager.component.spec.ts) (5 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should prevent an administrator from accidentally suspending their own active account` | Bloquea la auto-suspensión del administrador en sesión. |
| `should prevent an administrator from demoting their own admin role` | Impide que el administrador se quite su propio rol `ADMIN`. |
| `should persist and reflect in the directory when an admin changes another crew member role` | Persiste y refleja en memoria el cambio de rol de otros usuarios. |
| `should filter the crew directory simultaneously by search text, role, and account status` | Garantiza consistencia al combinar búsqueda, filtro de rol y filtro de estado. |
| `should show a clear error without corrupting the pending queue when approving a request fails` | Mantiene la solicitud en `PENDING` y muestra error si falla Firestore. |

## 2. [crew-directory-tab.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/crew/ui/src/lib/components/crew-directory-tab/crew-directory-tab.component.spec.ts) (2 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should preload existing notes when opening inline editor and emit trimmed notes on save` | Precarga notas existentes, recorta espacios y cierra el editor al guardar. |
| `should discard unsaved draft changes when the admin cancels note editing` | Descarta cambios pendientes al cancelar la edición en línea. |

## 3. [crew-onboarding-tab.component.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/crew/ui/src/lib/components/crew-onboarding-tab/crew-onboarding-tab.component.spec.ts) (2 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should prevent issuing a direct invitation when the target email is missing or invalid` | Impide emitir invitaciones directas con correo vacío o malformado. |
| `should emit direct invitation payload and reset form defaults from app configuration after submission` | Emite el payload y restaura los valores por defecto de la app (`defaultTargetRole`, `defaultRequiresProfile`). |
