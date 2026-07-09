import { useRef, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react';
import type { ThemePreference } from '@/domain/settings/settings.types';
import { exportJson, exportProductsCsv } from '@/services/data/export.service';
import { importJson, importProductsCsv } from '@/services/data/import.service';
import { updateSettings, wipeAllData } from '@/services/settings/settings.service';
import { toast } from '@/stores/toast.store';
import { useThemeStore } from '@/stores/theme.store';
import { useSettings } from '@/hooks/useSettings';
import { useUnits } from '@/hooks/useTaxonomies';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { datedFilename, downloadText } from '@/lib/download';
import { cn } from '@/lib/cn';
import { SyncSection } from './components/SyncSection';

const THEMES: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'system', label: 'Sistema', icon: Monitor },
];

const EXPIRY_OPTIONS = [1, 2, 3, 5, 7, 14];

export function SettingsPage() {
  const settings = useSettings();
  const units = useUnits();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const fileInput = useRef<HTMLInputElement>(null);

  const setTheme = (pref: ThemePreference) => {
    setPreference(pref);
    void updateSettings({ theme: pref });
  };

  const doExportJson = async () => {
    downloadText(
      datedFilename('alimentos-vampiricos', 'json'),
      await exportJson(),
      'application/json',
    );
    toast('Copia JSON descargada', 'success');
  };
  const doExportCsv = async () => {
    downloadText(datedFilename('productos', 'csv'), await exportProductsCsv(), 'text/csv');
    toast('Productos exportados a CSV', 'success');
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const res = isCsv ? await importProductsCsv(text) : await importJson(text);
    if (res.ok) toast(`Importado: ${res.changed} registro(s)`, 'success');
    else toast(res.error ?? 'No se pudo importar', 'danger');
    e.target.value = '';
  };

  const onWipe = async () => {
    if (!window.confirm('¿Seguro? Se borrarán todos los datos de este dispositivo.')) return;
    await wipeAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mas"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl">Ajustes</h1>
      </div>

      {/* Apariencia */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-text">Apariencia</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = preference === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-text'
                    : 'border-border text-muted hover:text-text',
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Preferencias */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text">Preferencias</h2>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-text">Avisar de caducidad con</span>
          <div className="w-36">
            <Select
              aria-label="Días de antelación para caducidad"
              value={settings.expirySoonDays}
              onChange={(e) => void updateSettings({ expirySoonDays: Number(e.target.value) })}
            >
              {EXPIRY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? 'día' : 'días'}
                </option>
              ))}
            </Select>
          </div>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-text">Unidad por defecto</span>
          <div className="w-36">
            <Select
              aria-label="Unidad por defecto"
              value={settings.defaultUnitId ?? ''}
              onChange={(e) => void updateSettings({ defaultUnitId: e.target.value || null })}
            >
              <option value="">—</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </Select>
          </div>
        </label>
      </section>

      {/* Datos */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-text">Datos</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={doExportJson}>
            <Download size={18} aria-hidden="true" />
            Copia JSON
          </Button>
          <Button variant="secondary" onClick={doExportCsv}>
            <Download size={18} aria-hidden="true" />
            Productos CSV
          </Button>
        </div>
        <Button variant="secondary" className="w-full" onClick={() => fileInput.current?.click()}>
          <Upload size={18} aria-hidden="true" />
          Importar (JSON o CSV)
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={onImportFile}
        />
        <p className="text-xs text-muted">
          Los datos se guardan solo en este dispositivo. Exporta una copia para no perderlos o
          pasarlos a otro móvil.
        </p>
      </section>

      <SyncSection />

      {/* Zona de peligro */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-danger">Zona de peligro</h2>
        <Button variant="ghost" onClick={onWipe} className="w-full text-danger hover:bg-danger/10">
          <Trash2 size={18} aria-hidden="true" />
          Borrar todos los datos
        </Button>
      </section>
    </div>
  );
}
