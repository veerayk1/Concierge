'use client';

/**
 * Step 4: Amenities (Skippable)
 * Quick Add Presets or Import from File.
 */

import { useState, useCallback } from 'react';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StepHeader } from '../shared/step-header';
import { EntityImportSection } from '../shared/entity-import-section';

interface StepAmenitiesProps {
  propertyId: string;
  onImportComplete: (result: { created: number; skipped: number; errors: number }) => void;
  onSkip: () => void;
  onNext: () => void;
  onBack?: () => void;
}

interface AmenityPreset {
  id: string;
  name: string;
  group: string;
  icon: string;
}

const AMENITY_PRESETS: AmenityPreset[] = [
  { id: 'party-room', name: 'Party Room', group: 'Social', icon: '🎉' },
  { id: 'gym', name: 'Gym / Fitness Center', group: 'Fitness', icon: '🏋️' },
  { id: 'pool', name: 'Swimming Pool', group: 'Fitness', icon: '🏊' },
  { id: 'rooftop', name: 'Rooftop Terrace', group: 'Outdoor', icon: '🌇' },
  { id: 'guest-suite', name: 'Guest Suite', group: 'Hospitality', icon: '🛏️' },
  { id: 'bbq', name: 'BBQ Area', group: 'Outdoor', icon: '🔥' },
  { id: 'boardroom', name: 'Boardroom', group: 'Business', icon: '📋' },
  { id: 'library', name: 'Library / Lounge', group: 'Social', icon: '📚' },
  { id: 'sauna', name: 'Sauna / Steam Room', group: 'Fitness', icon: '🧖' },
  { id: 'theatre', name: 'Theatre Room', group: 'Social', icon: '🎬' },
  { id: 'yoga', name: 'Yoga Studio', group: 'Fitness', icon: '🧘' },
  { id: 'playground', name: 'Playground', group: 'Outdoor', icon: '🛝' },
];

export function StepAmenities({
  propertyId,
  onImportComplete,
  onSkip,
  onNext,
  onBack,
}: StepAmenitiesProps) {
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [isCreatingPresets, setIsCreatingPresets] = useState(false);
  const [presetsCreated, setPresetsCreated] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const togglePreset = useCallback((id: string) => {
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCreatePresets = useCallback(async () => {
    if (selectedPresets.size === 0) return;
    setIsCreatingPresets(true);
    setServerError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const demoRole = localStorage.getItem('demo_role');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(demoRole && { 'x-demo-role': demoRole }),
      };

      let created = 0;
      for (const presetId of selectedPresets) {
        const preset = AMENITY_PRESETS.find((p) => p.id === presetId);
        if (!preset) continue;

        try {
          const response = await fetch('/api/v1/amenities', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              propertyId,
              name: preset.name,
              group: preset.group,
              bookingStyle: 'first_come',
            }),
          });

          if (response.ok) created++;
        } catch {
          // Continue with next preset
        }
      }

      setPresetsCreated(true);
      onImportComplete({ created, skipped: 0, errors: selectedPresets.size - created });
    } catch {
      setServerError('Failed to create amenities. Please try again.');
    } finally {
      setIsCreatingPresets(false);
    }
  }, [selectedPresets, propertyId, onImportComplete]);

  return (
    <div>
      <StepHeader
        stepNumber={4}
        title="Amenities"
        description="Add amenities that residents can book. Choose from presets or import from a file."
      />

      {/* Quick Add Presets */}
      <Card padding="md" className="mb-4">
        <h4 className="mb-1 text-[14px] font-semibold text-neutral-900">Quick Add Presets</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Select common amenities to add with default settings.
        </p>

        {presetsCreated ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <Check className="mx-auto mb-2 h-6 w-6 text-green-500" />
            <p className="font-semibold text-green-800">{selectedPresets.size} amenities created</p>
          </div>
        ) : (
          <>
            {serverError && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="mb-4 grid grid-cols-3 gap-2">
              {AMENITY_PRESETS.map((preset) => {
                const isSelected = selectedPresets.has(preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => togglePreset(preset.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-[13px] font-medium">{preset.name}</span>
                    {isSelected && <Check className="text-primary-500 ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleCreatePresets}
              disabled={selectedPresets.size === 0 || isCreatingPresets}
              fullWidth
              variant="secondary"
            >
              {isCreatingPresets ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add {selectedPresets.size} Amenities
            </Button>
          </>
        )}
      </Card>

      {/* Import from File */}
      <EntityImportSection
        entityType="amenities"
        propertyId={propertyId}
        title="Import Amenities from File"
        description="Upload a CSV or Excel file with amenity details."
        onImportComplete={onImportComplete}
      />

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={onSkip}>
            Skip this step
          </Button>
        </div>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
