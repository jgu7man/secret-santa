# Inventario de Pruebas Unitarias — `@secret-santa/domain`

Cada spec valida de forma independiente las reglas puras del dominio de Secret Santa sin depender de Firestore ni de Angular.

## 1. [raffle.helpers.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/secret-santa/domain/src/lib/raffle.helpers.spec.ts) (4 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should refuse running a raffle with fewer than 2 participants` | Impide ejecutar sorteos inválidos con 0 o 1 participante. |
| `should guarantee a valid swap when exactly 2 participants join the raffle` | Asegura intercambio mutuo exacto en el caso mínimo de 2 participantes. |
| `should assign every participant a distinct receiver without anyone drawing themselves` | Garantiza biyección completa sin auto-asignaciones ni receptores duplicados. |
| `should fail fast if no valid derangement is produced within the maximum attempt limit` | Evita bucles infinitos si el generador no converge en el límite de intentos. |

## 2. [participant.helpers.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/secret-santa/domain/src/lib/participant.helpers.spec.ts) (4 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should normalize participant names case-insensitively and trim surrounding spaces` | Evita duplicados por mayúsculas o espacios al registrar o iniciar sesión. |
| `should build a valid unassigned participant with trimmed name and default preferences` | Garantiza que todo participante nuevo cumpla el contrato Zod y arranque sin asignación. |
| `should reject building a participant when the document ID is empty` | Falla rápido ante identificadores de documento vacíos antes de persistir. |
| `should authenticate a participant only when a non-empty secret word matches exactly` | Impide acceso con palabras secretas vacías o que no coincidan exactamente. |

## 3. [event.helpers.spec.ts](file:///Users/jgu7man/Code/jguzman/secret-santa/libs/secret-santa/domain/src/lib/event.helpers.spec.ts) (7 specs)

| Spec | Regla / Riesgo de negocio que protege |
| :--- | :--- |
| `should allow registration when the event is open and has no deadline` | Permite registro libre mientras el organizador mantenga el evento abierto sin fecha límite. |
| `should block registration when the organizer manually closed registration` | Respeta el cierre manual de registros del organizador. |
| `should block registration once the registration deadline has passed` | Impide registros tardíos cuando vence la fecha límite configurada. |
| `should allow registration while the deadline is still in the future` | Mantiene el registro habilitado antes del vencimiento del deadline. |
| `should block running the raffle with fewer than 2 participants` | Impide iniciar el sorteo sin quórum mínimo de 2 participantes. |
| `should allow running or re-running the raffle with at least 2 participants` | Habilita sorteo inicial y re-sorteo cuando hay al menos 2 participantes. |
| `should format a Date into local YYYY-MM-DDTHH:mm format for datetime-local inputs` | Preserva la hora local exacta al precargar el deadline en el modal de edición. |
