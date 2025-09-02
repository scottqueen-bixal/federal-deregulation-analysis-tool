'use client';

import React, { ReactNode, useRef, useEffect, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  show: boolean;
  id: string;
  className?: string;
}

type TooltipPosition = {
  position: 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
  arrowOffset?: number; // For adjusting arrow position when tooltip is shifted
};

export default React.memo(function Tooltip({ children, show, id, className = '' }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>({
    position: 'right',
    x: 32,
    y: -8,
    arrowOffset: 0
  });

  useEffect(() => {
    if (!show || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const triggerElement = tooltip.parentElement;

    if (!triggerElement) return;

    const updatePosition = () => {
      const triggerRect = triggerElement.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Calculate available space in each direction
      const spaceRight = viewport.width - triggerRect.right;
      const spaceLeft = triggerRect.left;
      const spaceTop = triggerRect.top;
      const spaceBottom = viewport.height - triggerRect.bottom;

      // Tooltip dimensions (estimated)
      const tooltipWidth = 320; // w-80 = 20rem = 320px
      const tooltipHeight = tooltip.scrollHeight || 200; // estimated height

      // Score each position based on how well it fits
      const positions = [
        {
          position: 'right' as const,
          x: 32, // left-8 = 2rem = 32px
          y: -8, // -top-2 = -0.5rem = -8px
          fitsHorizontally: spaceRight >= tooltipWidth,
          fitsVertically: spaceTop >= 8 && spaceBottom >= tooltipHeight - 8,
          priority: 1 // Default preference
        },
        {
          position: 'left' as const,
          x: -(tooltipWidth + 8),
          y: -8,
          fitsHorizontally: spaceLeft >= tooltipWidth,
          fitsVertically: spaceTop >= 8 && spaceBottom >= tooltipHeight - 8,
          priority: 2
        },
        {
          position: 'bottom' as const,
          x: -(tooltipWidth / 2) + (triggerRect.width / 2),
          y: triggerRect.height + 8,
          fitsHorizontally: spaceLeft >= tooltipWidth / 2 && spaceRight >= tooltipWidth / 2,
          fitsVertically: spaceBottom >= tooltipHeight,
          priority: 3
        },
        {
          position: 'top' as const,
          x: -(tooltipWidth / 2) + (triggerRect.width / 2),
          y: -(tooltipHeight + 8),
          fitsHorizontally: spaceLeft >= tooltipWidth / 2 && spaceRight >= tooltipWidth / 2,
          fitsVertically: spaceTop >= tooltipHeight,
          priority: 4
        }
      ];

      // Find the best position that fits completely
      let bestPosition = positions.find(pos => pos.fitsHorizontally && pos.fitsVertically);

      if (!bestPosition) {
        // No position fits perfectly, find the best compromise
        bestPosition = positions.reduce((best, current) => {
          const bestScore = (best.fitsHorizontally ? 2 : 0) + (best.fitsVertically ? 2 : 0) + (4 - best.priority);
          const currentScore = (current.fitsHorizontally ? 2 : 0) + (current.fitsVertically ? 2 : 0) + (4 - current.priority);
          return currentScore > bestScore ? current : best;
        });
      }

      // Now adjust the position to handle edge cases where it still doesn't fit
      let finalX = bestPosition.x;
      let finalY = bestPosition.y;
      let finalPosition = bestPosition.position;
      let arrowOffset = 0;

      // Horizontal adjustments
      if (bestPosition.position === 'right' || bestPosition.position === 'left') {
        // For side positions, adjust x if needed
        if (triggerRect.left + finalX < 0) {
          // Would go off left edge
          finalX = -triggerRect.left + 8;
        } else if (triggerRect.left + finalX + tooltipWidth > viewport.width) {
          // Would go off right edge
          finalX = viewport.width - triggerRect.left - tooltipWidth - 8;
        }

        // Adjust y to keep within viewport
        const tooltipTop = triggerRect.top + finalY;
        const tooltipBottom = tooltipTop + tooltipHeight;

        if (tooltipTop < 0) {
          const originalY = finalY;
          finalY = -triggerRect.top + 8;
          // Adjust arrow position for vertical shift
          arrowOffset = originalY - finalY;
        } else if (tooltipBottom > viewport.height) {
          const originalY = finalY;
          finalY = viewport.height - triggerRect.top - tooltipHeight - 8;
          // Adjust arrow position for vertical shift
          arrowOffset = originalY - finalY;
        }
      } else {
        // For top/bottom positions, adjust x to keep within viewport
        const originalX = finalX;
        const tooltipLeft = triggerRect.left + finalX;
        const tooltipRight = tooltipLeft + tooltipWidth;

        if (tooltipLeft < 0) {
          finalX = -triggerRect.left + 8;
          // Calculate arrow offset for horizontal shift
          arrowOffset = originalX - finalX;
        } else if (tooltipRight > viewport.width) {
          finalX = viewport.width - triggerRect.left - tooltipWidth - 8;
          // Calculate arrow offset for horizontal shift
          arrowOffset = originalX - finalX;
        }

        // Adjust y if needed
        if (bestPosition.position === 'top' && triggerRect.top + finalY < 0) {
          // Switch to bottom if top doesn't fit
          finalPosition = 'bottom';
          finalY = triggerRect.height + 8;
          arrowOffset = 0; // Reset arrow offset when switching positions
        } else if (bestPosition.position === 'bottom' && triggerRect.top + finalY + tooltipHeight > viewport.height) {
          // Switch to top if bottom doesn't fit
          finalPosition = 'top';
          finalY = -(tooltipHeight + 8);
          arrowOffset = 0; // Reset arrow offset when switching positions
        }
      }

      const newPosition: TooltipPosition = {
        position: finalPosition,
        x: finalX,
        y: finalY,
        arrowOffset
      };

      setPosition(newPosition);
    };

    // Update position on mount and when window resizes
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [show]);

  if (!show) return null;

  const getArrowClasses = () => {
    const baseArrowClasses = "absolute w-0 h-0";
    const arrowOffset = position.arrowOffset || 0;

    switch (position.position) {
      case 'right':
        return {
          outer: `${baseArrowClasses} -left-2 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300`,
          inner: `${baseArrowClasses} -left-1 border-t-8 border-b-8 border-r-8 border-transparent border-r-white`,
          style: { top: `${12 + arrowOffset}px` } // 12px = 3rem * 4 (top-3)
        };
      case 'left':
        return {
          outer: `${baseArrowClasses} -right-2 border-t-8 border-b-8 border-l-8 border-transparent border-l-gray-300`,
          inner: `${baseArrowClasses} -right-1 border-t-8 border-b-8 border-l-8 border-transparent border-l-white`,
          style: { top: `${12 + arrowOffset}px` }
        };
      case 'top':
        return {
          outer: `${baseArrowClasses} -bottom-2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-300`,
          inner: `${baseArrowClasses} -bottom-1 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white`,
          style: { left: `calc(50% + ${arrowOffset}px)` }
        };
      case 'bottom':
        return {
          outer: `${baseArrowClasses} -top-2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-300`,
          inner: `${baseArrowClasses} -top-1 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white`,
          style: { left: `calc(50% + ${arrowOffset}px)` }
        };
      default:
        return {
          outer: `${baseArrowClasses} top-3 -left-2 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300`,
          inner: `${baseArrowClasses} top-3 -left-1 border-t-8 border-b-8 border-r-8 border-transparent border-r-white`,
          style: {}
        };
    }
  };

  const arrowClasses = getArrowClasses();

  return (
    <div
      ref={tooltipRef}
      id={id}
      role="tooltip"
      className={`absolute z-50 w-80 p-4 bg-white border border-gray-300 rounded-lg shadow-lg animate-fade-in ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="text-sm text-gray-900">
        {children}
      </div>
      {/* Tooltip arrows */}
      <div className={arrowClasses.outer} style={arrowClasses.style}></div>
      <div className={arrowClasses.inner} style={arrowClasses.style}></div>
    </div>
  );
});
