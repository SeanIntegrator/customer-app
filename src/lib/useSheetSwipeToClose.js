import { useDragControls } from 'framer-motion';
import { useCallback, useMemo } from 'react';

const SWIPE_CLOSE_OFFSET_PX = 20;
const SWIPE_CLOSE_VELOCITY = 100;

/**
 * Bottom sheets: drag down to dismiss. Initiate drag from the green header via
 * `onGreenHeaderPointerDown` (and `touchAction: 'none'` on that region).
 */
export function useSheetSwipeToClose(onClose, { disabled = false } = {}) {
  const dragControls = useDragControls();

  const onGreenHeaderPointerDown = useCallback(
    (event) => {
      if (disabled) return;
      dragControls.start(event);
    },
    [disabled, dragControls]
  );

  const sheetMotionProps = useMemo(() => {
    if (disabled) return {};
    return {
      drag: 'y',
      dragControls,
      dragListener: false,
      dragConstraints: { top: 0 },
      dragElastic: { top: 0, bottom: 0.32 },
      onDragEnd: (_event, info) => {
        if (info.offset.y > SWIPE_CLOSE_OFFSET_PX || info.velocity.y > SWIPE_CLOSE_VELOCITY) {
          onClose();
        }
      },
    };
  }, [disabled, dragControls, onClose]);

  return { sheetMotionProps, onGreenHeaderPointerDown };
}
