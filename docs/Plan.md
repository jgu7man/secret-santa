# 🎅 Proyecto: Secret Santa App (Angular + Firebase + Tailwind)

**Instrucciones para el Asistente (Copilot):**
Actúa como un arquitecto de software experto en Angular (Standalone Components), Firebase (Modular SDK) y Tailwind CSS. Utiliza este documento como la fuente de verdad para la lógica de negocio, estructura de datos y diseño.

## 1. Stack Tecnológico

- **Frontend:** Angular (Última versión estable). Uso obligatorio de **Standalone Components** y **Reactive Forms**.
- **Backend / DB:** Firebase Firestore.
- **Estilos:** Tailwind CSS. Diseño "Mobile-First", moderno, limpio y con toques festivos (rojos, verdes oscuros, dorados).
- **Hosting:** Firebase Hosting.

## 2. Reglas de Negocio Críticas

1. **Autenticación Host (Sin Login Real):**
    - El creador del evento (Host) no se loguea con correo.
    - Al crear el evento, se genera un `adminToken` aleatorio.
    - Este token se guarda en el documento del evento y en el `localStorage` del navegador del Host.
    - Para acceder al panel de administración, se valida: `localStorage.token === firestore.event.adminToken`.
2. **Autenticación Participantes (Login Simple):**
    - Los usuarios ingresan usando su `nombre` y una `palabraSecreta`.
    - **Unicidad:** No pueden existir dos participantes con el mismo nombre (case-insensitive) en el mismo evento.
3. **Dinámica del Evento:**
    - **Estado CREATED:** Los usuarios pueden registrarse y editar sus preferencias. El Host puede ver la lista y "Cerrar inscripciones".
    - **Estado DRAWN:** El sorteo se ha realizado. Los usuarios ven a quién le regalan. Nuevos registros están bloqueados por defecto (o requieren re-sorteo manual).
    - **Re-Sorteo:** El Host puede volver a sortear (borra asignaciones anteriores y recalcula).
    - **Toggle de Registro:** El Host puede bloquear manualmente la entrada de nuevos usuarios.
4. **Algoritmo de Emparejamiento (Random & Safe):**
    - No usar lista circular simple. Usar método "Barajar y Verificar".
    - Debe garantizar que `usuario.id !== usuario.assignedToId`.
    - Debe ser totalmente aleatorio.
5. **Privacidad:**
    - Si el Host habilita `revealToHost`, puede ver la tabla de cruces. Si no, solo ve que el sorteo está hecho.
    - Nadie puede ver la `palabraSecreta` de otro.
    - Si un usuario olvida su palabra, el Host genera un enlace de "Reset".

## 3. Modelo de Datos (Firestore)

### Colección: `events`

Documento raíz para cada sorteo.

```
interface Evento {
  id: string;              // Auto-generated ID
  adminToken: string;      // Token de seguridad del Host
  name: string;            // Ej: "Navidad Familia 2025"
  minAmount: number;       // Monto mínimo regalo
  maxAmount?: number;      // Monto máximo (opcional)
  revealToHost: boolean;   // ¿El host puede ver los resultados?
  isRegistrationOpen: boolean; // Toggle para aceptar nuevos
  status: 'CREATED' | 'DRAWN';
  createdAt: Timestamp;
}

```

### Sub-colección: `events/{eventId}/participants`

Lista de personas en el sorteo.

```
interface Participant {
  id: string;              // Auto-generated ID
  name: string;            // Guardado tal cual (Ej: "Juan")
  normalizedName: string;  // Lowercase para validación única (Ej: "juan")
  secretWord: string;      // Palabra clave para entrar
  email?: string;          // Opcional
  preferences: {
    general: string;       // "Me gusta el fútbol, anime..."
    sizes?: string;        // "Camisa M, Zapatos 7"
  };
  // Resultados del sorteo (null si status === CREATED)
  assignedToId: string | null;
  assignedToName: string | null;
}

```

## 4. Fases de Desarrollo (Prompting Guide)

### FASE 1: Configuración e Infraestructura

1. Inicializar proyecto Angular con Tailwind configurado.
2. Crear `src/app/firebase-config.ts` (exportar `firestore`).
3. Crear interfaces en `src/app/models/`.

### FASE 2: Servicios (Core Logic)

- **EventService:**
    - `createEvent(data)`: Genera token y guarda en Firestore.
    - `getEvent(id)`: Observable del evento.
    - `updateStatus(id, status)` / `toggleRegistration(id, bool)`.
    - **`runRaffle(eventId)`**: Implementar aquí la lógica:
        1. Descargar participantes.
        2. Clonar array a `receivers`.
        3. `do { shuffle(receivers) } while (existsSelfMatch(participants, receivers))`
        4. Guardar usando `Batch Writes` (actualizar todos los docs a la vez).
- **ParticipantService:**
    - `checkNameAvailability(eventId, name)`: Query para verificar duplicados.
    - `register(eventId, participantData)`.
    - `login(eventId, name, secretWord)`: Query compuesta.
    - `resetSecretWord(eventId, participantId, newWord)`.

### FASE 3: Vista del Host (Admin)

- **Componente: `CreateEvent`**: Formulario reactivo bonito. Guarda token en LocalStorage.
- **Componente: `AdminDashboard`**:
    - Ruta: `/event/:id/admin`.
    - Guard: Verificar token local contra token de DB.
    - UI: Tabla de participantes, Toggle de registro, Botón "Sortear" (con confirmación), Botón "Revelar Resultados" (si aplica).
    - Acción extra: Botón "Copiar Link de Restauración" por usuario.

### FASE 4: Vista Pública (Participantes)

- **Componente: `EventLanding`**:
    - Ruta: `/event/:id`.
    - Lógica: Si hay usuario en sesión, mostrar "Mi Resultado". Si no, mostrar Tabs: "Registro" / "Entrar".
- **Formularios:**
    - Registro: Validar nombre único. Inputs estilizados con Tailwind.
    - Login: Pedir Nombre y Palabra Secreta.
- **Pantalla de Resultado:**
    - Mostrar: "¡Te tocó regalar a: **[Nombre]**!".
    - Mostrar gustos y tallas del asignado.
    - Botón para editar mis propios gustos.

### FASE 5: Flujo de Recuperación

- **Ruta:** `/event/:id/reset/:participantId`.
- **Componente:** Formulario simple que pide "Nueva Palabra Secreta" y guarda.
- Solo accesible si el Host envía el link específico.

## 5. Guía de Estilos (Tailwind)

- **Contenedores:** `max-w-md mx-auto` para móviles, `max-w-4xl` para dashboard.
- **Botones:** `bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all`.
- **Inputs:** `border-gray-300 focus:ring-red-500 focus:border-red-500 rounded-md`.
- **Tarjetas:** `bg-white shadow-xl rounded-2xl p-6 border-t-4 border-green-600`.
- **Feedback:** Usar alertas suaves para errores (`bg-red-100 text-red-700`) y éxitos (`bg-green-100 text-green-700`).