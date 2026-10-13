"use client";

import React from "react";
import { generateBarcodeSvgPath } from "@/lib/barcode";

interface BarcodeSvgProps {
  value: string;
  height?: number;
  scale?: number;
  showText?: boolean;
  className?: string;
}

export default function BarcodeSvg({
  value,
  height = 50,
  scale = 1.5,
  showText = true,
  className = "",
}: BarcodeSvgProps) {
  if (!value) {
    return <span className="text-xs text-gray-400">Barcode kosong</span>;
  }

  const { path, totalWidth, height: barHeight } = generateBarcodeSvgPath(value, height, scale);

  if (!path) {
    return <span className="text-xs text-gray-400">Barcode tidak valid</span>;
  }

  const totalSvgHeight = showText ? barHeight + 18 : barHeight;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white p-2 rounded border border-gray-200 ${className}`}>
      <svg
        width={totalWidth}
        height={totalSvgHeight}
        viewBox={`0 0 ${totalWidth} ${totalSvgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full h-auto"
      >
        <path d={path} fill="#000000" />
        {showText && (
          <text
            x={totalWidth / 2}
            y={barHeight + 14}
            textAnchor="middle"
            fill="#111827"
            fontFamily="monospace, sans-serif"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="2"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}
