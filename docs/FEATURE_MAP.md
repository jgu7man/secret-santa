# 🎯 Feature Map - Secret Santa

**Fecha:** 25 de enero de 2026  
**Proyecto:** Secret Santa  
**Propósito:** Catálogo completo de features agrupadas por épicas

---

## 📋 Índice de Épicas

1. [Autenticación y Acceso](#1-autenticación-y-acceso)
2. [Gestión de Eventos](#2-gestión-de-eventos)
3. [Roles y Permisos](#3-roles-y-permisos)
4. [Invitaciones y Compartir](#4-invitaciones-y-compartir)
5. [Participantes](#5-participantes)
6. [Gameplay y Lógica](#6-gameplay-y-lógica)
7. [UI/UX Core](#7-uiux-core)
8. [Notificaciones y Feedback](#8-notificaciones-y-feedback)
9. [Visualización de Datos](#9-visualización-de-datos)
10. [Responsive Design](#10-responsive-design)
11. [Configuración y Personalización](#11-configuración-y-personalización)
12. [Seguridad y Validación](#12-seguridad-y-validación)

---

## 1. Autenticación y Acceso

### 🔐 Sign In con Google

**Descripción:** Autenticación mediante cuenta de Google  
**Características:**

- Popup de autenticación nativa de Google
- Obtiene automáticamente displayName y photoURL
- Persistencia de sesión
- Cierre de sesión disponible
- Reautenticación automática al recargar

### 🔑 Secret Word Access

**Descripción:** Acceso administrativo mediante palabra secreta  
**Características:**

- Sin autenticación Firebase requerida
- Validación local con secretWord del evento
- Acceso temporal almacenado en localStorage
- Perfecto para eventos casuales
- Fácil de compartir oralmente
- Permite acceso a dashboard de admin

### 🏠 Home/Landing Directo

**Descripción:** Crear evento directamente desde home  
**Características:**

- Formulario de creación inmediato
- Sin selección de rol (solo host puede crear)
- Acceso rápido para crear eventos
- Navegación directa a configuración

---

## 2. Gestión de Eventos

### ➕ Crear Evento

**Descripción:** Iniciar nuevo evento de intercambio  
**Características:**

- Requiere autenticación con Google
- Configuración personalizable completa
- Generación automática de ID único
- Almacenamiento en Firestore
- Asignación automática de creador como host

**Configuración:**

- Nombre del evento
- Fecha del evento
- Presupuesto sugerido
- Secret word para administración
- Permitir registro tardío (sí/no)

### 🔍 Buscar Evento por Código

**Descripción:** Unirse usando código único  
**Características:**

- Input para código de evento
- Validación en tiempo real
- Feedback si el código no existe
- Redirección automática al encontrar
- Case insensitive en búsqueda

### ⏹️ Finalizar Evento

**Descripción:** Terminar evento actual  
**Características:**

- Solo el host puede ejecutar
- Cambio de estado a "finished"
- Mantiene datos históricos
- Notificación a todos los participantes
- Irreversible (requiere confirmación)

---

## 3. Roles y Permisos

### 🎯 Rol: Host/Admin

**Descripción:** Creador y controlador del evento  
**Permisos:**

- Crear evento
- Configurar parámetros
- Realizar sorteo
- Ver todos los participantes
- Revelar todas las asignaciones
- Compartir invitaciones
- Acceso a dashboard completo
- Finalizar evento

**UI Específica:**

- Panel de control con botones de acción
- Vista de estado del sorteo
- Lista completa de participantes
- Acceso con secret word
- Herramientas de gestión

### 🎮 Rol: Participant

**Descripción:** Participante activo del intercambio  
**Permisos:**

- Unirse a evento
- Registrarse con sus datos
- Revelar su asignación (con password)
- Ver información básica del evento
- Abandonar evento (antes del sorteo)

**UI Específica:**

- Formulario de registro simple
- Pantalla de celebración post-sorteo
- Botón para revelar match
- Vista de su persona asignada
- Información del evento

---

## 4. Invitaciones y Compartir

### 🔗 Compartir Link

**Descripción:** Copiar URL de invitación al portapapeles  
**Características:**

- Botón visible en landing del evento
- Copia URL completa con ID de evento
- Usa Clipboard API nativa
- Feedback visual de éxito/error
- Funciona en mobile y desktop
- Link directo a página de unirse

### 📧 Compartir por Email

**Descripción:** Link directo para enviar invitación  
**Características:**

- Botón "Share via Email" visible
- Abre cliente de email predeterminado
- Asunto y cuerpo pre-llenados con mensaje festivo
- Incluye link al evento
- Mensaje personalizable
- Fácil distribución a múltiples personas

### 🎫 Código de Evento

**Descripción:** ID alfanumérico para unirse  
**Características:**

- Generado automáticamente por Firestore
- Visible en landing del evento
- Copiable con un click
- Case insensitive para búsqueda
- Longitud corta (8-10 caracteres)

### 🖼️ Landing de Evento

**Descripción:** Página pública con información del evento  
**Características:**

- Muestra nombre del evento
- Muestra fecha y presupuesto
- Botón grande "Unirse"
- Información del host
- Estado del evento (abierto/cerrado/sorteado)
- Botones de compartir integrados

---

## 5. Participantes

### ➕ Unirse como Participante

**Descripción:** Registrarse en evento activo  
**Características:**

- Requiere código de evento
- Autenticación con Google requerida
- Formulario con datos adicionales
- Creación de password personal (para revelar)
- Creación automática de documento en Firestore
- Asignación de timestamp de registro
- Notificación en tiempo real a host
- Validación de registro tardío según configuración

### 📋 Lista de Participantes

**Descripción:** Ver quién está registrado  
**Características:**

- Actualización en tiempo real
- Muestra displayName y photoURL
- Indicadores de estado (registrado/tiene match)
- Timestamp de registro
- Contador total de participantes
- Email de contacto visible para admin

### 🚪 Abandonar Evento

**Descripción:** Salir del evento voluntariamente  
**Características:**

- Disponible solo antes del sorteo
- Confirmación antes de salir
- Elimina documento de participante
- Notificación a host en tiempo real
- Redirección automática al home
- No disponible después del sorteo

### 👥 Contador de Participantes

**Descripción:** Número total visible  
**Características:**

- Actualización en tiempo real
- Visible para host
- Ubicación prominente en dashboard
- Mínimo 3 participantes para sortear

---

## 6. Gameplay y Lógica

### 🎁 Sorteo Automático

**Descripción:** Asignar cada participante a otro aleatoriamente  
**Características:**

- Algoritmo de asignación circular aleatoria
- Nadie se asigna a sí mismo
- Garantiza que todos dan y reciben exactamente uno
- Ejecutado manualmente por host
- Cambia estado del evento a "drawn"
- Irreversible una vez ejecutado
- Validación de mínimo 3 participantes
- Notificación a todos los participantes

### 🎭 Revelar Match Personal

**Descripción:** Ver a quién le toca dar regalo  
**Características:**

- Requiere password del participante
- Muestra nombre de persona asignada
- Solo visible después del sorteo
- Un participante solo ve su propio match
- No puede ver otros matches
- Información sensible protegida
- Pantalla de celebración antes de revelar

### 🔓 Revelar Todas las Asignaciones

**Descripción:** Admin puede ver todas las asignaciones  
**Características:**

- Solo accesible con secret word
- Vista completa de todas las parejas
- Útil para resolver conflictos o dudas
- Cambia estado a "revealed" (opcional)
- Lista completa de quién da regalo a quién
- Advertencia de uso responsable

---

## 7. UI/UX Core

### 🎨 Design System

**Descripción:** Paleta de colores y estilos consistentes  
**Características:**

- Theme navideño coherente
- Colores festivos: Rojo, verde, dorado
- Backgrounds suaves y acogedores
- Accent colors vibrantes
- Tailwind CSS utilities
- Hover effects en elementos interactivos
- Animaciones suaves (transitions)
- Border radius consistente

### 🎉 Pantalla de Celebración

**Descripción:** Confirmación visual de sorteo completo  
**Características:**

- Mensaje de éxito grande y festivo
- Emojis celebratorios (🎁🎄✨)
- Botón para revelar match
- Indicaciones claras del siguiente paso
- Diseño festivo acorde al tema navideño
- Animaciones de celebración

### 📝 Formularios

**Descripción:** Inputs para datos de usuario y configuración  
**Características:**

- Validación en tiempo real
- Mensajes de error claros
- Placeholders descriptivos
- Auto-focus en primer campo
- Enter para submit
- Disabled states visuales
- Loading states durante submit

**Formularios específicos:**

- Creación de evento
- Registro de participante
- Reveal con password
- Admin login con secret word

---

## 8. Notificaciones y Feedback

### ✅ Alertas de Éxito

**Descripción:** Confirmaciones de acciones completadas  
**Características:**

- Toasts o alerts simples
- Mensaje claro y conciso
- Icono de check verde
- Auto-dismiss después de 2-3 segundos
- Posición no intrusiva
- No bloquea interacción

**Ejemplos:**

- "Link copiado al portapapeles"
- "Evento creado exitosamente"
- "Te has unido al evento"
- "Sorteo completado"

### ❌ Alertas de Error

**Descripción:** Notificación de problemas o fallos  
**Características:**

- Toasts o modales de error
- Mensaje descriptivo del problema
- Icono de error rojo
- Botón "OK" o "Cerrar"
- Sugerencia de solución cuando aplique
- No auto-dismiss (requiere confirmación)

**Ejemplos:**

- "Código de evento no encontrado"
- "Password incorrecta"
- "Debes autenticarte primero"
- "Sorteo requiere mínimo 3 participantes"

### ⚠️ Confirmaciones

**Descripción:** Prevenir acciones destructivas accidentales  
**Características:**

- Modal con pregunta clara
- Botones "Confirmar" y "Cancelar"
- Advertencia del impacto
- Color distintivo (amarillo/naranja)
- Requiere acción explícita del usuario
- Botón principal en acción segura

**Ejemplos:**

- "¿Realizar sorteo ahora? (Irreversible)"
- "¿Abandonar el evento?"
- "¿Finalizar evento?"

### 🔔 Notificaciones en Tiempo Real

**Descripción:** Updates instantáneos de cambios  
**Características:**

- Vía Firestore listeners (onSnapshot)
- Sin necesidad de refresh manual
- Actualizaciones suaves sin flicker
- Bajo consumo de recursos
- Desuscripción automática al salir

**Ejemplos:**

- Nuevo participante se une
- Sorteo completado
- Estado de evento cambia

### ⏳ Estados de Loading

**Descripción:** Indicadores de procesos en curso  
**Características:**

- Spinners o skeleton screens
- Texto descriptivo de acción
- Deshabilita controles durante carga
- Timeout para error si tarda mucho
- Previene double-submit

**Contextos:**

- Autenticación en proceso
- Creando evento
- Realizando sorteo
- Cargando participantes

---

## 9. Visualización de Datos

### 📊 Información de Evento

**Descripción:** Datos clave visibles todo el tiempo  
**Características:**

- Nombre del evento
- Fecha del evento
- Presupuesto sugerido
- Estado actual (open/drawn/finished/revealed)
- Número de participantes
- Timestamp de creación
- Configuración activa (registro tardío)

### 👥 Lista de Participantes

**Descripción:** Vista completa de registrados  
**Características:**

- Nombres con photos
- Email de contacto (solo admin)
- Estado de cada participante
- Orden cronológico de registro
- Indicador de quién tiene match asignado
- Contador total actualizado

### 🎯 Vista de Matches (Admin)

**Descripción:** Ver todas las asignaciones  
**Características:**

- Tabla completa de parejas
- Formato: "Persona A → da a → Persona B"
- Ordenado alfabéticamente o por registro
- Exportable (copy/paste)
- Solo accesible con secret word
- Útil para resolver dudas

---

## 10. Responsive Design

### 📱 Mobile First

**Descripción:** Diseño optimizado para móviles  
**Características:**

- Layouts verticales en mobile
- Botones grandes (min 44x44px)
- Texto legible (min 16px)
- Touch targets espaciados
- Sin hover dependencies
- Gestures táctiles

### 💻 Desktop Optimization

**Descripción:** Aprovechar espacio en pantallas grandes  
**Características:**

- Layouts multi-columna
- Sidebars con información extra
- Hover effects enriquecidos
- Tooltips informativos
- Mayor densidad de información

### 📐 Breakpoints Consistentes

**Descripción:** Puntos de cambio de layout  
**Características:**

- sm: 640px (móvil grande)
- md: 768px (tablet)
- lg: 1024px (laptop)
- xl: 1280px (desktop)
- Transiciones suaves entre breakpoints con Tailwind

### 🔄 Grid Responsivo

**Descripción:** Grids que se adaptan al tamaño  
**Características:**

- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: 3+ columnas
- Gap consistente
- Auto-fit para contenido variable

---

## 11. Configuración y Personalización

### ⚙️ Configuración de Evento

**Descripción:** Parámetros ajustables al crear  
**Opciones:**

- **Nombre del Evento**: Texto personalizable
- **Fecha**: Selector de calendario (fecha del intercambio)
- **Presupuesto**: Número sugerido en moneda local
- **Secret Word**: Contraseña administrativa personalizada
- **Registro Tardío**: Permitir unirse después del sorteo (sí/no)

**Características:**

- Formulario completo al crear
- Validación de campos requeridos
- Preview de configuración antes de crear
- Secret word almacenada de forma segura
- Configuración visible en landing

### 🎨 Personalización de Participante

**Descripción:** Datos personales del participante  
**Características:**

- DisplayName de Google
- PhotoURL de Google
- Email de contacto
- Password personal para revelar match
- Información adicional opcional
- Actualización en tiempo real

### 🔧 Métodos de Autenticación

**Descripción:** Opciones de login habilitadas  
**Características:**

- Google Sign-In para participantes
- Secret Word para acceso admin
- Sin autenticación anónima
- Persistencia de sesión

---

## 12. Seguridad y Validación

### 🔒 Firestore Security Rules

**Descripción:** Reglas de acceso a base de datos  
**Características:**

- Autenticación requerida para writes
- Validación de ownership (hostId)
- Participantes solo pueden leer su propio match
- Read público para información básica de evento
- Prevención de escalación de privilegios
- Solo host puede realizar sorteo

### ✔️ Validación de Inputs

**Descripción:** Verificación de datos del usuario  
**Características:**

- Longitud mínima/máxima de nombres
- Validación de formato de email
- Validación de fecha (no pasada)
- Presupuesto como número positivo
- Secret word no vacía
- Password para reveal no vacía
- Sanitización de strings
- Feedback inmediato visual

### 🛡️ Guards de Rutas

**Descripción:** Protección de rutas sensibles  
**Características:**

- authGuard: Requiere usuario autenticado
- adminGuard: Valida secret word del evento
- Redirección automática si no cumple
- Previene acceso no autorizado a admin dashboard
- Verificación en cada navegación

### 🔐 Almacenamiento Seguro

**Descripción:** Manejo de datos sensibles  
**Características:**

- Environment files en .gitignore
- Firebase config en firebase-config.ts (no commiteado)
- Secret word en Firestore (no localStorage)
- Passwords individuales en Firestore
- LocalStorage solo para acceso temporal de admin
- Matches encriptados o protegidos

### ⚡ Prevención de Abuso

**Descripción:** Rate limiting y validaciones  
**Características:**

- Firestore throttling automático
- Límite de writes por segundo
- Deshabilitar botón de sorteo después de ejecutar
- Validación de mínimo participantes (3+)
- Registro tardío controlado por flag
- Sorteo irreversible

---

## 📊 Resumen

**Total Features:** 38  
**Épicas:** 12  
**Última actualización:** 25 de enero de 2026

### Distribución por Épica

| Épica                               | Features          |
| ----------------------------------- | ----------------- |
| 1. Autenticación y Acceso           | 3                 |
| 2. Gestión de Eventos               | 3                 |
| 3. Roles y Permisos                 | 2 roles completos |
| 4. Invitaciones y Compartir         | 4                 |
| 5. Participantes                    | 4                 |
| 6. Gameplay y Lógica                | 3                 |
| 7. UI/UX Core                       | 3 componentes     |
| 8. Notificaciones y Feedback        | 5 tipos           |
| 9. Visualización de Datos           | 3                 |
| 10. Responsive Design               | 4                 |
| 11. Configuración y Personalización | 3                 |
| 12. Seguridad y Validación          | 5                 |

### Features Únicas de Secret Santa

- ✅ Secret word authentication
- ✅ Sorteo automático de matches (intercambio de regalos)
- ✅ Reveal con password personal
- ✅ Configuración de presupuesto sugerido
- ✅ Configuración de fecha del evento
- ✅ Registro tardío opcional
- ✅ Vista de todos los matches (solo admin)
- ✅ Theme navideño festivo

---

| Feature                       | Secret Santa | Lotería Mexicana |
| ----------------------------- | :----------: | :--------------: |
| **AUTENTICACIÓN**             |              |                  |
| Google Sign-In                |      ✅      |        ✅        |
| Anonymous Sign-In             |      ❌      |        ✅        |
| Secret Word Access            |      ✅      |        ❌        |
| Landing con Selección de Rol  |      ❌      |        ✅        |
| **GESTIÓN**                   |              |                  |
| Crear Sesión/Evento           |      ✅      |        ✅        |
| Listar Sesiones               |      ❌      |        ✅        |
| Buscar por Código             |      ✅      |        ✅        |
| Finalizar Sesión              |      ✅      |        ✅        |
| Eliminar Sesión               |      ❌      |        ✅        |
| **ROLES**                     |              |                  |
| Manager/Host                  |      ✅      |        ✅        |
| Player/Participant            |      ✅      |        ✅        |
| Viewer/Spectator              |      ❌      |        ✅        |
| **INVITACIONES**              |              |                  |
| Compartir Link                |      ✅      |        ✅        |
| Generar QR Code               |      ❌      |        ✅        |
| Compartir por Email           |      ✅      |        ❌        |
| Código de Invitación          |      ✅      |        ✅        |
| Página de Invitación Dedicada |      ✅      |        ✅        |
| **PARTICIPANTES**             |              |                  |
| Unirse como Participante      |      ✅      |        ✅        |
| Lista de Participantes        |      ✅      |        ✅        |
| Abandonar Sesión              |      ✅      |        ✅        |
| Expulsar Participante         |      ❌      |        ✅        |
| Contador de Participantes     |      ✅      |        ✅        |
| **GAMEPLAY**                  |              |                  |
| Sistema de Cartas (54)        |      ❌      |        ✅        |
| Barajado de Mazo              |      ❌      |        ✅        |
| Generación de Tablas          |      ❌      |        ✅        |
| Avanzar Carta                 |      ❌      |        ✅        |
| Iniciar Ronda                 |      ❌      |        ✅        |
| Marcar Carta                  |      ❌      |        ✅        |
| Cantar Lotería                |      ❌      |        ✅        |
| Verificar Ganador             |      ❌      |        ✅        |
| Finalizar Ronda               |      ❌      |        ✅        |
| Sorteo Automático             |      ✅      |        ❌        |
| Revelar Match                 |      ✅      |        ❌        |
| Revelar Todos (Admin)         |      ✅      |        ❌        |
| **UI/UX**                     |              |                  |
| Design System                 |      ✅      |        ✅        |
| Selector de Marcador          |      ❌      |        ✅        |
| Selector de Tabla             |      ❌      |        ✅        |
| Card Component                |      ❌      |        ✅        |
| Header con Info               |      ❌      |        ✅        |
| Podio de Ganadores            |      ❌      |        ✅        |
| Pantalla de Celebración       |      ✅      |        ❌        |
| Formularios Validados         |      ✅      |        ✅        |
| **NOTIFICACIONES**            |              |                  |
| Alertas de Éxito              |      ✅      |        ✅        |
| Alertas de Error              |      ✅      |        ✅        |
| Confirmaciones                |      ✅      |        ✅        |
| Notificaciones Tiempo Real    |      ✅      |        ✅        |
| Estados de Loading            |      ✅      |        ✅        |
| **VISUALIZACIÓN**             |              |                  |
| Historial de Cartas           |      ❌      |        ✅        |
| Vista Limitada (Viewer)       |      ❌      |        ✅        |
| Información de Sesión         |      ✅      |        ✅        |
| Ranking/Scoreboard            |      ❌      |        ✅        |
| Historial de Rondas           |      ❌      |        ✅        |
| **RESPONSIVE**                |              |                  |
| Mobile First                  |      ✅      |        ✅        |
| Desktop Optimization          |      ✅      |        ✅        |
| Breakpoints Consistentes      |      ✅      |        ✅        |
| Grid Responsivo               |      ✅      |        ✅        |
| **CONFIGURACIÓN**             |              |                  |
| Config de Sesión/Evento       |      ✅      |        ✅        |
| Personalización de Perfil     |      ✅      |        ✅        |
| Métodos de Autenticación      |      ✅      |        ✅        |
| **SEGURIDAD**                 |              |                  |
| Firestore Security Rules      |      ✅      |        ✅        |
| Validación de Inputs          |      ✅      |        ✅        |
| Guards de Rutas               |      ✅      |        ✅        |
| Almacenamiento Seguro         |      ✅      |        ✅        |
| Prevención de Abuso           |      ✅      |        ✅        |

### Totales

- **Secret Santa:** 38 features
- **Lotería Mexicana:** 52 features
- **Features compartidas:** 30+ features
- **Features exclusivas Secret Santa:** 8 features
- **Features exclusivas Lotería:** 22 features
