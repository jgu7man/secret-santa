# Comparación de Traducciones / Translation Comparison

## CreateEvent Component - Formulario de Creación / Create Event Form

### English (en-US)
```
🎅 Secret Santa
Create your gift exchange event

Event Name *
e.g., Christmas Family 2025
Event name is required (minimum 3 characters)

Minimum Gift Amount ($) *
Please enter a valid amount

Maximum Gift Amount ($) (Optional)
Leave empty for no maximum

Allow me to see all gift assignments
Enable this if you need to see who got whom after the draw

🎁 Create Event
Creating...

💡 After creating the event, save the admin link to manage it later!
```

### Spanish - México (es-MX)
```
🎅 Intercambio Secreto
Crea tu evento de intercambio de regalos

Nombre del Evento *
ej., Navidad Familiar 2025
El nombre del evento es requerido (mínimo 3 caracteres)

Monto Mínimo del Regalo ($) *
Por favor ingresa un monto válido

Monto Máximo del Regalo ($) (Opcional)
Dejar vacío sin máximo

Permitirme ver todas las asignaciones de regalos
Activa esto si necesitas ver quién le tocó a quién después del sorteo

🎁 Crear Evento
Creando...

💡 Después de crear el evento, guarda el enlace de administrador para gestionarlo más tarde!
```

## Build Output Structure

```
dist/secret-santa/browser/
├── en-US/                    # English version
│   ├── index.html           # lang="en-US", base href="/"
│   ├── main-*.js
│   ├── polyfills-*.js
│   └── styles-*.css
└── es-MX/                    # Spanish version
    ├── index.html           # lang="es-MX", base href="/es/"
    ├── main-*.js
    ├── polyfills-*.js
    └── styles-*.css
```

## Key Features

✅ **Separate builds** for each language
✅ **SEO-friendly** with proper `lang` attribute
✅ **Zero runtime overhead** - translations are compiled into the bundle
✅ **Type-safe** - Angular checks all translation IDs at compile time
✅ **Easy to extend** - Add new languages by creating additional .xlf files

## Usage

### Development
```bash
# English
npm start

# Spanish
npm run start:es
```

### Production Build
```bash
# Build all languages
npm run build

# Build Spanish only
npm run build:es
```
