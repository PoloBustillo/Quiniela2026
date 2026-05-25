"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface SyncLog {
  id: string;
  syncType: string;
  status: string;
  matchesUpdated: number;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
}

interface BsdStatus {
  bsdEnabled: boolean;
  recentLogs: SyncLog[];
  overrides: { groupStage: number; knockout: number };
}

export function BsdSyncPanel() {
  const [status, setStatus] = useState<BsdStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [testRaw, setTestRaw] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/admin/bsd");
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runSync = async (action: string, extraBody?: object) => {
    setLoading(true);
    setActionMsg(null);
    setTestRaw(null);
    try {
      const res = await fetch("/api/admin/bsd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });
      const data = await res.json();
      const isTest = action === "test_connection" || action === "test_live_any";
      if (isTest) {
        setTestRaw(JSON.stringify(data, null, 2));
      } else if (data.success) {
        const r = data.result;
        setActionMsg(
          `✓ Actualizados: ${r.updated} · Saltados: ${r.skipped} · Errores: ${r.errors}`,
        );
        await loadStatus();
      } else {
        setActionMsg(`✗ Error: ${data.error}`);
      }
    } catch (err) {
      setActionMsg(`✗ Error de red`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">BSD Sports — Sync Automático</h2>
        <p className="text-muted-foreground mt-1">
          Integración con BSD Sports API para actualización automática de
          marcadores. El sistema manual siempre tiene prioridad.
        </p>
      </div>

      {/* Estado del token */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estado de la integración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Token BSD:</span>
            {status?.bsdEnabled ? (
              <Badge className="bg-green-500">Configurado ✓</Badge>
            ) : (
              <Badge variant="destructive">
                No configurado — agregar BSD_API_TOKEN al .env
              </Badge>
            )}
          </div>
          {status && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Overrides manuales activos:
              </span>
              <Badge variant="outline">
                Grupos: {status.overrides.groupStage} · Eliminatoria:{" "}
                {status.overrides.knockout}
              </Badge>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Cuando editas un marcador manualmente, ese partido queda protegido
            de sobrescrituras automáticas (override activo). Para reactivar el
            sync automático en un partido, usa &quot;Reset Override&quot; en esa fila.
          </p>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acciones de sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => runSync("sync_live")}
              disabled={loading || !status?.bsdEnabled}
              className="gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Sync partidos en vivo ahora
            </Button>
            <Button
              variant="outline"
              onClick={loadStatus}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar estado
            </Button>
          </div>
          {actionMsg && (
            <div className="text-sm font-medium bg-muted rounded-md p-3">
              {actionMsg}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            El cron automático (si está configurado en Vercel) llama a este sync
            cada minuto durante horas de partidos. Este botón lo ejecuta
            manualmente para pruebas.
          </p>
        </CardContent>
      </Card>

      {/* Testing antes del Mundial */}
      <Card className="border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🧪 Pruebas pre-Mundial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            El Mundial empieza Jun 11. Usa estos botones para verificar que la
            integración funciona HOY.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSync("test_connection", { matchId: 1 })}
              disabled={loading}
              className="gap-2"
            >
              Test token + match #1 (MEX vs RSA)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSync("test_live_any")}
              disabled={loading}
              className="gap-2"
            >
              Ver partidos en vivo (cualquier liga)
            </Button>
          </div>
          {testRaw && (
            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-64 break-all whitespace-pre-wrap">
              {testRaw}
            </pre>
          )}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p>
              <strong>Qué esperar:</strong>
            </p>
            <p>
              • <code>test_connection</code> → retorna raw BSD del partido 8287
              (MEX vs RSA). Status: <code>notstarted</code>, scores:{" "}
              <code>null</code>. Si falla → problema de token.
            </p>
            <p>
              • <code>test_live_any</code> → partidos de cualquier liga
              actualmente en vivo. Confirma que la API responde y el token
              funciona.
            </p>
            <p>
              • <code>sync_match</code> sobre un partido pre-WC → resultado:{" "}
              <em>skipped</em> (sin scores → no update). Eso es correcto.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Últimos logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimos 5 syncs</CardTitle>
        </CardHeader>
        <CardContent>
          {!status?.recentLogs?.length ? (
            <p className="text-sm text-muted-foreground">
              Sin historial todavía. El primer sync aparecerá aquí.
            </p>
          ) : (
            <div className="space-y-2">
              {status.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 text-sm border rounded-md p-2"
                >
                  {log.status === "ok" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground w-32 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString("es-MX")}
                  </span>
                  <span className="flex-1">
                    {log.matchesUpdated > 0
                      ? `${log.matchesUpdated} partido(s) actualizado(s)`
                      : "Sin cambios"}
                  </span>
                  {log.durationMs && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.durationMs}ms
                    </span>
                  )}
                  {log.errorMessage && (
                    <span className="text-xs text-red-500 truncate max-w-[200px]">
                      {log.errorMessage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cómo funciona */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Cron automático:</strong> Vercel llama a{" "}
            <code>/api/cron/sync-bsd</code> cada minuto. Consulta partidos en
            vivo del Mundial en BSD y actualiza marcadores.
          </p>
          <p>
            • <strong>Override manual:</strong> Si tú editas un marcador
            manualmente, ese partido queda marcado como{" "}
            <code>manualOverride=true</code> y BSD no lo sobrescribirá.
          </p>
          <p>
            • <strong>Fallo de BSD:</strong> Si BSD falla (timeout, rate limit,
            error), el sistema ignora silenciosamente y sigue funcionando con
            los datos actuales.
          </p>
          <p>
            • <strong>Fase de grupos:</strong> Los 72 partidos tienen mapeo
            estático hacia BSD. Los partidos de eliminatoria se mapean asignando
            el <code>bsdEventId</code> al crear el partido.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
