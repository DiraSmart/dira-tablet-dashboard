import { memo, type ReactNode } from 'react';
import { Icon } from './Icon';
import { useAppStore } from '@/store/appStore';
import { mdiPencil } from '@mdi/js';

interface EditableCardWrapperProps {
  children: ReactNode;
  entityId?: string;
  areaId?: string;
}

export const EditableCardWrapper = memo(function EditableCardWrapper({
  children,
  entityId,
  areaId,
}: EditableCardWrapperProps) {
  const editMode = useAppStore((s) => s.editMode);
  const setEditingEntity = useAppStore((s) => s.setEditingEntity);
  const setEditingArea = useAppStore((s) => s.setEditingArea);

  if (!editMode) return <>{children}</>;

  const handleClick = () => {
    if (entityId) setEditingEntity(entityId);
    else if (areaId) setEditingArea(areaId);
  };

  return (
    <div className="relative">
      {children}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 rounded-card cursor-pointer hover:bg-black/30 transition-colors duration-150"
        onClick={handleClick}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon path={mdiPencil} size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
});
