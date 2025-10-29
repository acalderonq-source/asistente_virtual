# Asistente Virtual Sandro

Este proyecto es tu asistente operativo:
- Guarda recordatorios con fecha/hora y te avisa por Telegram.
- Te da la agenda del día.
- Te dice si una placa puede o no puede salir a ruta.
- Te responde tipo ChatGPT con contexto interno.

---

## 1. Requisitos

- Node.js 18+
- MySQL corriendo local
- Crear una base de datos vacía llamada `asistente_sandro`

```sql
CREATE DATABASE asistente_sandro;
```

- Copiar `.env.example` a `.env` y llenar tus credenciales.

## 2. Instalar dependencias

```bash
npm install
```

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Si sale bien: `Servidor escuchando en puerto 4000`

## 4. Endpoints principales

### Crear recordatorio
```bash
POST http://localhost:4000/api/reminders
Content-Type: application/json

{
  "mensaje": "Reunión con Gabriela sobre Proveeduría",
  "fecha": "2025-10-30 08:00",
  "prioridad": "alta"
}
```

### Ver recordatorios
```bash
GET http://localhost:4000/api/reminders
```

### Preguntarle a la IA
```bash
POST http://localhost:4000/api/ia/preguntar
Content-Type: application/json

{
  "pregunta": "que tengo hoy?"
}
```

### Estado de una unidad
```bash
GET http://localhost:4000/api/status/unidad/170900
```

## 5. Notificaciones Telegram

Cada minuto el cron revisa si hay recordatorios con `fecha <= NOW()` y `enviado = 0`.

Si encuentra uno:
- Manda mensaje a tu chat.
- Marca `enviado = 1` para que no lo repita.

Para que funcione:
- Creás un bot en @BotFather
- Guardás el token en `.env` como `TELEGRAM_BOT_TOKEN`
- Sacás tu chat id (hay bots tipo @userinfobot) y lo pones en `TELEGRAM_CHAT_ID`

## 6. Próximo paso

- Conectar esto a tu calendario corporativo o Gmail.
- Hacer un bot de Telegram bidireccional para que vos escribas:
  - "recordar viernes 7am quick pass 178439 cristian"
  - Y que llame `POST /api/reminders` automático.

Aquí ya tenés la base lista para usar en la operación diaria.
