import { useEffect, useState, useRef } from 'react';

interface PRIndicatorProps {
  isPR: boolean;
  prType?: 'weight' | '1rm' | 'weight_and_1rm';
}

/**
 * Animated PR notification that appears when a new PR is logged
 */
export function PRIndicator({ isPR, prType = 'weight_and_1rm' }: PRIndicatorProps) {
  const [show, setShow] = useState(false);
  const prevIsPR = useRef(isPR);

  useEffect(() => {
    // Only trigger when isPR transitions from false to true
    if (isPR && !prevIsPR.current) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
    prevIsPR.current = isPR;
  }, [isPR]);

  if (!show) return null;

  const prLabel = prType === 'weight_and_1rm' ? 'PR!' :
                  prType === 'weight' ? 'Weight PR!' :
                  '1RM PR!';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-accent text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
        {prLabel}
      </div>
    </div>
  );
}
