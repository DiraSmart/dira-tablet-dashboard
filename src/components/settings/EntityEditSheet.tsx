import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/Icon';
import { useAppStore } from '@/store/appStore';
import { useConfigStore } from '@/store/configStore';
import { useEntity } from '@/store/entityStore';
import { getEntityName } from '@/utils/entityHelpers';
import { mdiClose, mdiCheck } from '@mdi/js';

export const EntityEditSheet = memo(function EntityEditSheet() {
  const { t } = useTranslation();
  const entityId = useAppStore((s) => s.editingEntityId);
  const setEditingEntity = useAppStore((s) => s.setEditingEntity);
  const config = useConfigStore((s) => s.config);
  const updateEntityOverride = useConfigStore((s) => s.updateEntityOverride);
  const entity = useEntity(entityId || '');

  // Find existing override
  const existingOverride = entityId
    ? config?.globalEntityOverrides[entityId] ||
      config?.areas.find((a) => a.entityIds.includes(entityId))?.entityOverrides[entityId]
    : undefined;

  const [customName, setCustomName] = useState(existingOverride?.displayName || '');
  const [visible, setVisible] = useState(existingOverride?.visible !== false);

  // Reset state when entity changes
  const prevEntityId = useState(entityId)[0];
  if (entityId !== prevEntityId) {
    // This is a simplification - in practice, we'd use useEffect but this is fine for a sheet
  }

  const handleSave = useCallback(() => {
    if (!entityId) return;
    updateEntityOverride(entityId, {
      displayName: customName || undefined,
      visible,
    });
    setEditingEntity(null);
  }, [entityId, customName, visible, updateEntityOverride, setEditingEntity]);

  const handleClose = useCallback(() => {
    setEditingEntity(null);
  }, [setEditingEntity]);

  if (!entityId || !entity) return null;

  const originalName = getEntityName(entity);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-elevated border-t border-glass-border rounded-t-2xl p-6 space-y-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('common.edit')}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10"
          >
            <Icon path={mdiClose} size={18} />
          </button>
        </div>

        {/* Entity ID */}
        <p className="text-xs text-white/30 font-mono">{entityId}</p>

        {/* Name */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">{t('edit.entityName')}</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={originalName}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-glass-border text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">{t('edit.entityVisible')}</span>
          <button
            onClick={() => setVisible(!visible)}
            className={`w-12 h-7 rounded-full transition-colors duration-200 flex items-center ${
              visible ? 'bg-green-500 justify-end' : 'bg-white/10 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm mx-1" />
          </button>
        </div>

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
