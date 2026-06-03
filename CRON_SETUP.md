# Configuración del Cron Job — BSD Sync

Guía de recuperación ante pérdida del Droplet (u otro servidor). Cubre **tres opciones** para ejecutar el sync automático del endpoint `/api/cron/sync-bsd`.

---

## Contexto

- La app vive en **Vercel** (plan Hobby → no permite crons frecuentes en `vercel.json`).
- El sync de marcadores en vivo lo dispara un **scheduler externo** via HTTP.
- Endpoint: `GET https://<TU_APP>.vercel.app/api/cron/sync-bsd`
- Protegido con header `Authorization: Bearer <CRON_SECRET>`.
- Frecuencia recomendada: **cada minuto** durante días de partido.

---

## Variables de entorno necesarias

| Variable | Valor | Dónde se usa |
|---|---|---|
| `APP_URL` | `https://<tu-app>.vercel.app` | Scheduler / Droplet / GitHub Actions |
| `CRON_SECRET` | String aleatorio largo | Scheduler / Droplet / GitHub Actions |
| `BSD_API_TOKEN` | `667ccb4b29ade16c6863e4ebdfa03268f3882dff` | Ya está en Vercel env vars |

> El `CRON_SECRET` puede ser cualquier string seguro. Para generar uno:
> ```bash
> openssl rand -hex 32
> ```

---

## Opción A — GitHub Actions (recomendado, sin servidor propio)

Ya existe el workflow en `.github/workflows/bsd-sync-cron.yml`. Solo necesitas configurar los secrets del repo.

### Pasos

1. Ve a tu repo en GitHub → **Settings → Secrets and variables → Actions**.
2. Agrega dos **Repository secrets**:
   - `APP_URL` = `https://<tu-app>.vercel.app`
   - `CRON_SECRET` = el mismo valor que tienes en Vercel env vars
3. Listo. El workflow corre cada 10 minutos automáticamente.

### Notas del workflow
- Solo ejecuta el sync si hoy hay partidos programados (revisa `data/matches.json`).
- Compuerta de horario: 10:00–23:00 hora CDMX.
- Compuerta de fechas: 11 Jun – 19 Jul 2026.
- Se puede lanzar manualmente desde la pestaña **Actions → BSD Sync Cron → Run workflow**.

---

## Opción B — Nuevo DigitalOcean Droplet (Ubuntu)

### 1. Crear el Droplet

- Imagen: **Ubuntu 24.04 LTS**
- Tamaño mínimo: $6/mes (1 GB RAM, 1 vCPU) es suficiente
- Región: cualquiera cercana a México (NYC o SFO)

### 2. Conectarse y preparar el entorno

```bash
ssh root@<IP_DEL_DROPLET>

# Actualizar sistema
apt update && apt upgrade -y

# Instalar curl (suele venir preinstalado)
apt install -y curl
```

### 3. Crear el archivo de variables de entorno

```bash
mkdir -p /etc/quiniela
cat > /etc/quiniela/cron.env << 'EOF'
APP_URL=https://<tu-app>.vercel.app
CRON_SECRET=<tu-cron-secret>
EOF

chmod 600 /etc/quiniela/cron.env
```

### 4. Crear el script de disparo

```bash
cat > /usr/local/bin/bsd-sync.sh << 'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

source /etc/quiniela/cron.env

endpoint="${APP_URL%/}/api/cron/sync-bsd"
http_code="$(curl -sS -o /tmp/bsd-sync-response.json -w "%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${endpoint}")"

echo "[cron:bsd-sync] $(date -u +"%Y-%m-%dT%H:%M:%SZ") HTTP ${http_code}"
cat /tmp/bsd-sync-response.json
echo ""

if [[ "${http_code}" -lt 200 || "${http_code}" -ge 300 ]]; then
  exit 1
fi
SCRIPT

chmod +x /usr/local/bin/bsd-sync.sh
```

### 5. Probar manualmente

```bash
/usr/local/bin/bsd-sync.sh
```

Deberías ver algo como:
```
[cron:bsd-sync] 2026-06-15T18:30:00Z HTTP 200
{"ok":true,"timestamp":"2026-06-15T18:30:00.123Z","result":{"updated":1,"skipped":71,...}}
```

### 6. Agregar al crontab del sistema

```bash
crontab -e
```

Agrega esta línea (cada minuto):
```
* * * * * /usr/local/bin/bsd-sync.sh >> /var/log/bsd-sync.log 2>&1
```

O solo durante horario de partidos (10:00–23:00 hora UTC-6 = 16:00–05:00 UTC):
```
* 16-23,0-5 * * * /usr/local/bin/bsd-sync.sh >> /var/log/bsd-sync.log 2>&1
```

### 7. Verificar que el cron está activo

```bash
# Ver el crontab guardado
crontab -l

# Ver el log después de ~2 minutos
tail -f /var/log/bsd-sync.log
```

### Rotar logs (opcional, para no llenar el disco)

```bash
cat > /etc/logrotate.d/bsd-sync << 'EOF'
/var/log/bsd-sync.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF
```

---

## Opción C — cron-job.org (sin servidor, gratis)

Servicio gratuito de cron externo, útil como respaldo rápido.

1. Crear cuenta en [cron-job.org](https://cron-job.org)
2. Crear un nuevo cronjob:
   - **URL**: `https://<tu-app>.vercel.app/api/cron/sync-bsd`
   - **Schedule**: cada 1 minuto (o el mínimo permitido en el plan gratuito: 15 min)
   - **Request method**: GET
   - **Headers**: agrega un header personalizado:
     - Nombre: `Authorization`
     - Valor: `Bearer <CRON_SECRET>`
3. Guardar y activar.

> Plan gratuito solo permite cada 15 minutos. Para 1 minuto necesitas plan de pago (~$5/mes).

---

## Verificar que el sync funciona

Sin importar el método elegido, puedes verificar el estado desde el panel admin:

1. Entra a la app → `/admin`
2. Ve a la pestaña **BSD Sync**
3. El panel muestra el último sync, partidos actualizados y errores.

O directamente en los logs del endpoint (Vercel dashboard → Functions → `/api/cron/sync-bsd`).

---

## Resumen de archivos relevantes

| Archivo | Descripción |
|---|---|
| `app/api/cron/sync-bsd/route.ts` | Endpoint que recibe el trigger |
| `scripts/trigger-bsd-sync-cron.sh` | Script bash para Droplet/servidor |
| `scripts/trigger-bsd-sync-cron.js` | Alternativa Node.js |
| `.github/workflows/bsd-sync-cron.yml` | Workflow de GitHub Actions |
| `lib/bsd-sync.ts` | Lógica de sincronización con BSD API |
