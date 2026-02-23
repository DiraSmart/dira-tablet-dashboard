import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/Icon';
import { useAppStore } from '@/store/appStore';
import { useConfigStore } from '@/store/configStore';
import { mdiClose, mdiCheck } from '@mdi/js';

export const AreaEditSheet = memo(function AreaEditSheet() {
  const { t } = useTranslation();
  const areaId = useAppStore((s) => s.editingAreaId);
  const setEditingArea = useAppStore((s) => s.setEditingArea);
  const config = useConfigStore((s) => s.config);
  const updateArea = useConfigStore((s) => s.updateArea);

  const area = areaId ? config?.areas.find((a) => a.areaId === areaId) : undefined;

  const [customName, setCustomName] = useState(area?.displayName || '');
  const [visible, setVisible] = useState(area?.visible !== false);

  const handleSave = useCallback(() => {
    if (!areaId) return;
    updateArea(areaId, {
      displayName: customName || area?.displayName || areaId,
      visible,
    });
    setEditingArea(null);
  }, [areaId, customName, visible, area?.displayName, updateArea, setEditingArea]);

  const handleClose = useCallback(() => {
    setEditingArea(null);
  }, [setEditingArea]);

  if (!areaId || !area) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-elevated border-t border-glass-border rounded-t-2xl p-6 space-y-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('common.edit')}: {area.displayName}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10"
          >
            <Icon path={mdiClose} size={18} />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">{t('edit.areaName')}</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={area.displayName}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-glass-border text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">{t('edit.areaVisible')}</span>
          <button
            onClick={() => setVisible(!visible)}
            className={`w-12 h-7 rounded-full transition-colors duration-200 flex items-center ${
              visible ? 'bg-green-500 justify-end' : 'bg-white/10 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm mx-1" />
          </button>
        </div>

        {/* Entity count */}
        <p className="text-xs text-white/40">
          {area.entityIds.length} {t('settings.entities').toLowerCase()}
        </p>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
        >
          <Icon path={mdiCheck} size={18} />
          {t('edit.done')}
        </button>
      </div>
    </div>
  );
});
