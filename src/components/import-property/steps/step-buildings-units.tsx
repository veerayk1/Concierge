'use client';

/**
 * Step 2: Buildings & Units (Required)
 * Three tabs: Import from File, Auto-Generate, Manual Entry.
 */

import { useState, useMemo, useCallback } from 'react';
import { Loader2, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StepHeader } from '../shared/step-header';
import { EntityImportSection } from '../shared/entity-import-section';

interface StepBuildingsUnitsProps {
  propertyId: string;
  onComplete: (created: number) => void;
  onNext: () => void;
}

export function StepBuildingsUnits({ propertyId, onComplete, onNext }: StepBuildingsUnitsProps) {
  const [totalUnits, setTotalUnits] = useState(0);

  return (
    <div>
      <StepHeader
        stepNumber={2}
        title="Buildings & Units"
        description="Add units to your property. You can import from a file, auto-generate, or add them manually."
        required
      />

      {totalUnits > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="success" size="lg">
              {totalUnits} units created
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={() => {
              onComplete(totalUnits);
              onNext();
            }}
          >
            Continue to Next Step
          </Button>
        </div>
      )}

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import from File</TabsTrigger>
          <TabsTrigger value="generate">Auto-Generate</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <EntityImportSection
            entityType="units"
            propertyId={propertyId}
            title="Import Units from File"
            description="Upload a CSV or Excel file with your unit data."
            onImportComplete={(result) => {
              setTotalUnits((prev) => prev + result.created);
            }}
          />
        </TabsContent>

        <TabsContent value="generate">
          <GenerateUnitsPanel
            propertyId={propertyId}
            onGenerated={(count) => setTotalUnits((prev) => prev + count)}
          />
        </TabsContent>

        <TabsContent value="manual">
          <ManualUnitEntry
            propertyId={propertyId}
            onCreated={() => setTotalUnits((prev) => prev + 1)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-Generate Panel (embedded, not dialog)
// ---------------------------------------------------------------------------

function GenerateUnitsPanel({
  propertyId,
  onGenerated,
}: {
  propertyId: string;
  onGenerated: (count: number) => void;
}) {
  const [floorStart, setFloorStart] = useState(1);
  const [floorEnd, setFloorEnd] = useState(10);
  const [unitsPerFloor, setUnitsPerFloor] = useState(8);
  const [numberingPattern, setNumberingPattern] = useState<'floor_prefix' | 'sequential'>(
    'floor_prefix',
  );
  const [unitType, setUnitType] = useState('residential');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const preview = useMemo(() => {
    const units: string[] = [];
    let seq = 1;
    for (let floor = floorStart; floor <= floorEnd; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        if (numberingPattern === 'floor_prefix') {
          units.push(`${floor}${String(unit).padStart(2, '0')}`);
        } else {
          units.push(String(seq++));
        }
      }
    }
    return units;
  }, [floorStart, floorEnd, unitsPerFloor, numberingPattern]);

  const handleGenerate = useCallback(async () => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const demoRole = localStorage.getItem('demo_role');

      const response = await fetch('/api/v1/units/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(demoRole && { 'x-demo-role': demoRole }),
        },
        body: JSON.stringify({
          propertyId,
          floorStart,
          floorEnd,
          unitsPerFloor,
          numberingPattern,
          unitType,
          skipExisting: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setServerError(err.message || 'Failed to generate units');
        return;
      }

      const res = await response.json();
      const data = res.data || res;
      setResult({ created: data.created ?? preview.length, skipped: data.skipped ?? 0 });
      onGenerated(data.created ?? preview.length);
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    propertyId,
    floorStart,
    floorEnd,
    unitsPerFloor,
    numberingPattern,
    unitType,
    preview.length,
    onGenerated,
  ]);

  return (
    <Card padding="md">
      <h4 className="mb-1 text-[14px] font-semibold text-neutral-900">Auto-Generate Units</h4>
      <p className="mb-4 text-[13px] text-neutral-500">
        Automatically create units from a range of floors.
      </p>

      {result ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-lg font-semibold text-green-800">{result.created} units created</p>
            {result.skipped > 0 && (
              <p className="text-sm text-green-600">{result.skipped} already existed (skipped)</p>
            )}
          </div>
          <Button variant="secondary" onClick={() => setResult(null)} fullWidth>
            Generate More
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Start Floor</label>
              <Input
                type="number"
                value={String(floorStart)}
                onChange={(e) => setFloorStart(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">End Floor</label>
              <Input
                type="number"
                value={String(floorEnd)}
                onChange={(e) => setFloorEnd(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Units Per Floor
            </label>
            <Input
              type="number"
              value={String(unitsPerFloor)}
              onChange={(e) => setUnitsPerFloor(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Numbering Pattern
            </label>
            <select
              value={numberingPattern}
              onChange={(e) => setNumberingPattern(e.target.value as 'floor_prefix' | 'sequential')}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="floor_prefix">Floor Prefix (101, 102... 201, 202...)</option>
              <option value="sequential">Sequential (1, 2, 3...)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Unit Type</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="studio">Studio</option>
              <option value="1br">1 Bedroom</option>
              <option value="2br">2 Bedroom</option>
              <option value="3br">3 Bedroom</option>
              <option value="penthouse">Penthouse</option>
              <option value="storage">Storage</option>
              <option value="parking">Parking</option>
            </select>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-1 text-xs font-medium text-neutral-600">
              Preview ({preview.length} units)
            </p>
            <p className="text-sm text-neutral-700">
              {preview.slice(0, 8).join(', ')}
              {preview.length > 8 && `, ... ${preview[preview.length - 1]}`}
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={isSubmitting} fullWidth>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate {preview.length} Units
          </Button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Manual Unit Entry
// ---------------------------------------------------------------------------

function ManualUnitEntry({ propertyId, onCreated }: { propertyId: string; onCreated: () => void }) {
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [building, setBuilding] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    if (!unitNumber.trim()) return;
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const demoRole = localStorage.getItem('demo_role');

      const response = await fetch('/api/v1/units/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(demoRole && { 'x-demo-role': demoRole }),
        },
        body: JSON.stringify({
          propertyId,
          units: [
            {
              number: unitNumber.trim(),
              floor: floor ? parseInt(floor, 10) : undefined,
              building: building || undefined,
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setServerError(err.message || 'Failed to create unit');
        return;
      }

      setSuccessMessage(`Unit ${unitNumber.trim()} created`);
      setUnitNumber('');
      setFloor('');
      setBuilding('');
      onCreated();
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [unitNumber, floor, building, propertyId, onCreated]);

  return (
    <Card padding="md">
      <h4 className="mb-1 text-[14px] font-semibold text-neutral-900">Add Unit Manually</h4>
      <p className="mb-4 text-[13px] text-neutral-500">Add units one at a time.</p>

      {serverError && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}
      {successMessage && (
        <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="space-y-3">
        <Input
          label="Unit Number"
          required
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          placeholder="e.g., 101"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Floor"
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="e.g., 1"
          />
          <Input
            label="Building"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="e.g., Tower A"
          />
        </div>
        <Button onClick={handleAdd} disabled={isSubmitting || !unitNumber.trim()} fullWidth>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Unit
        </Button>
      </div>
    </Card>
  );
}
