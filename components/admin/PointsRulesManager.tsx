"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Save } from "lucide-react";

interface PointsRule {
  id: string;
  exactScore: number;
  correctWinner: number;
  correctDraw: number;
  correctGoalDifference: number;
  isActive: boolean;
}

export function PointsRulesManager() {
  const [rules, setRules] = useState<PointsRule | null>(null);
  const [exactScore, setExactScore] = useState(5);
  const [correctWinner, setCorrectWinner] = useState(3);
  const [correctDraw, setCorrectDraw] = useState(3);
  const [correctGoalDifference, setCorrectGoalDifference] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch("/api/admin/points-rules");
      const data = await response.json();
      setRules(data);
      setExactScore(data.exactScore);
      setCorrectWinner(data.correctWinner);
      setCorrectDraw(data.correctDraw);
      setCorrectGoalDifference(data.correctGoalDifference);
    } catch (error) {
      console.error("Error loading rules:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/points-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exactScore,
          correctWinner,
          correctDraw,
          correctGoalDifference,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data);
        alert("Reglas actualizadas correctamente");
      }
    } catch (error) {
      console.error("Error saving rules:", error);
      alert("Error al guardar las reglas");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Reglas de Puntuación
        </CardTitle>
        <CardDescription>
          Define cuántos puntos se otorgan por cada tipo de acierto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Marcador Exacto
            </label>
            <Input
              type="number"
              min="0"
              value={exactScore}
              onChange={(e) => setExactScore(parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <p className="text-xs text-muted-foreground">
              Puntos por acertar el marcador exacto (ej: 2-1 vs 2-1)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ganador Correcto
            </label>
            <Input
              type="number"
              min="0"
              value={correctWinner}
              onChange={(e) => setCorrectWinner(parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <p className="text-xs text-muted-foreground">
              Puntos por acertar el ganador (sin marcador exacto)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Empate Correcto
            </label>
            <Input
              type="number"
              min="0"
              value={correctDraw}
              onChange={(e) => setCorrectDraw(parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <p className="text-xs text-muted-foreground">
              Puntos por acertar que hay empate (sin marcador exacto)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Diferencia de Goles
            </label>
            <Input
              type="number"
              min="0"
              value={correctGoalDifference}
              onChange={(e) =>
                setCorrectGoalDifference(parseInt(e.target.value) || 0)
              }
              className="text-center"
            />
            <p className="text-xs text-muted-foreground">
              Puntos por acertar la diferencia de goles (sin ganador correcto)
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Ejemplos:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Real: 2-1, Predicción: 2-1</span>
              <span className="font-bold text-green-600">{exactScore} puntos</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Real: 2-1, Predicción: 3-0</span>
              <span className="font-bold text-blue-600">{correctWinner} puntos</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Real: 1-1, Predicción: 2-2</span>
              <span className="font-bold text-blue-600">{correctDraw} puntos</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Real: 3-1, Predicción: 2-0</span>
              <span className="font-bold text-yellow-600">
                {correctGoalDifference} puntos
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Guardando..." : "Guardar Reglas"}
        </Button>
      </CardContent>
    </Card>
  );
}
