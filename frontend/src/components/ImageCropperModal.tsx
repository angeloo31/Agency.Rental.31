'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface ImageCropperModalProps {
  file: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: '4:3' | 'logo' | 'square' | 'landing';
}

export default function ImageCropperModal({ file, onCrop, onCancel, aspectRatio = '4:3' }: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [naturalDim, setNaturalDim] = useState<{w: number, h: number} | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [logoFormat, setLogoFormat] = useState<'original' | 'square' | 'wide' | 'ultra-wide' | 'standard'>('original');
  const [fitMode, setFitMode] = useState<'fit' | 'cover'>('fit');

  // Dynamic crop box dimensions
  const isLogo = aspectRatio === 'logo';
  const isSquare = aspectRatio === 'square';
  const isLanding = aspectRatio === 'landing';
  
  let cropWidth = 400;
  let cropHeight = 300;

  if (isLogo) {
    if (logoFormat === 'original' && naturalDim) {
      const scale = Math.min(400 / naturalDim.w, 300 / naturalDim.h, 1);
      cropWidth = Math.max(50, Math.round(naturalDim.w * scale));
      cropHeight = Math.max(50, Math.round(naturalDim.h * scale));
    } else if (logoFormat === 'ultra-wide') {
      cropWidth = 400; cropHeight = 100;
    } else if (logoFormat === 'wide') {
      cropWidth = 300; cropHeight = 100;
    } else if (logoFormat === 'standard') {
      cropWidth = 320; cropHeight = 240;
    } else if (logoFormat === 'square') {
      cropWidth = 200; cropHeight = 200;
    } else {
      cropWidth = 400; cropHeight = 100;
    }
  } else if (isSquare) {
    cropWidth = 360;
    cropHeight = 360;
  } else if (isLanding) {
    cropWidth = 560;
    cropHeight = 320;
  }

  // File Validation
  useEffect(() => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Unsupported format. Only image files are allowed.');
      return;
    }

    const maxSize = 8 * 1024 * 1024; // 8 MB limit
    if (file.size > maxSize) {
      setErrorMsg('File size exceeds the 8 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Reset offset and zoom when image changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNaturalDim(null);
  }, [imageSrc]);

  // Calculate base scale to display image
  const getBaseScale = () => {
    if (!imageRef.current) return 1;
    const img = imageRef.current;
    const wScale = cropWidth / img.naturalWidth;
    const hScale = cropHeight / img.naturalHeight;
    return fitMode === 'fit' ? Math.min(wScale, hScale) : Math.max(wScale, hScale);
  };

  // Helper to get constrained offset so image is easily positioned
  const getConstrainedOffset = (x: number, y: number, currentZoom: number) => {
    if (!imageRef.current) return { x, y };
    const img = imageRef.current;
    const baseScale = getBaseScale();
    const activeScale = baseScale * currentZoom;

    const imgWidth = img.naturalWidth * activeScale;
    const imgHeight = img.naturalHeight * activeScale;

    let constrainedX = x;
    let constrainedY = y;

    if (imgWidth <= cropWidth) {
      const minX = 0;
      const maxX = cropWidth - imgWidth;
      constrainedX = Math.min(maxX, Math.max(minX, x));
    } else {
      const minX = cropWidth - imgWidth;
      const maxX = 0;
      constrainedX = Math.min(maxX, Math.max(minX, x));
    }

    if (imgHeight <= cropHeight) {
      const minY = 0;
      const maxY = cropHeight - imgHeight;
      constrainedY = Math.min(maxY, Math.max(minY, y));
    } else {
      const minY = cropHeight - imgHeight;
      const maxY = 0;
      constrainedY = Math.min(maxY, Math.max(minY, y));
    }

    return { x: constrainedX, y: constrainedY };
  };

  // Center image initially
  const centerImage = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const baseScale = getBaseScale();
    const activeScale = baseScale * zoom;

    const imgWidth = img.naturalWidth * activeScale;
    const imgHeight = img.naturalHeight * activeScale;

    const x = (cropWidth - imgWidth) / 2;
    const y = (cropHeight - imgHeight) / 2;

    setOffset({ x, y });
  };

  useEffect(() => {
    centerImage();
  }, [fitMode]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
    centerImage();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (errorMsg) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || errorMsg) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setOffset(getConstrainedOffset(newX, newY, zoom));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (errorMsg || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || errorMsg || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    setOffset(getConstrainedOffset(newX, newY, zoom));
  };

  const moveImage = (dir: 'up' | 'down' | 'left' | 'right', amount = 10) => {
    let newX = offset.x;
    let newY = offset.y;
    if (dir === 'left') newX -= amount;
    if (dir === 'right') newX += amount;
    if (dir === 'up') newY -= amount;
    if (dir === 'down') newY += amount;
    setOffset(getConstrainedOffset(newX, newY, zoom));
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setOffset((prev) => getConstrainedOffset(prev.x, prev.y, newZoom));
  };

  // Handle Cropping action
  const handleSaveCrop = () => {
    if (!imageRef.current || errorMsg) return;

    const img = imageRef.current;
    const baseScale = getBaseScale();
    const activeScale = baseScale * zoom;

    const canvas = document.createElement('canvas');
    const canvasWidth = isLogo ? Math.round(cropWidth * 2) : isSquare ? 600 : isLanding ? 1200 : 800;
    const canvasHeight = isLogo ? Math.round(cropHeight * 2) : isSquare ? 600 : isLanding ? Math.round(1200 * (cropHeight / cropWidth)) : 600;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const canvasScaleFactor = canvasWidth / cropWidth;

    const drawX = offset.x * canvasScaleFactor;
    const drawY = offset.y * canvasScaleFactor;
    const drawW = img.naturalWidth * activeScale * canvasScaleFactor;
    const drawH = img.naturalHeight * activeScale * canvasScaleFactor;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const outMimeType = file.type || 'image/png';
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], file.name, {
            type: outMimeType,
            lastModified: Date.now(),
          });
          onCrop(croppedFile);
        }
      },
      outMimeType,
      outMimeType === 'image/jpeg' ? 0.92 : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="max-w-2xl sm:max-w-3xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative flex flex-col gap-5 overflow-y-auto my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-1">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Crop & Reposition</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {isLanding ? 'Adjust banner view or click "Keep Original" for full natural height' : 'Adjust your vehicle image placement'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg ? (
          /* Error Screen */
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <div className="font-extrabold text-base">{errorMsg}</div>
            <p className="text-xs font-medium text-red-400/80">Acceptable formats: PNG, JPG, WebP (Max 8MB).</p>
            <button 
              type="button" 
              onClick={onCancel}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Select Another File
            </button>
          </div>
        ) : (
          /* Editor UI */
          <>
            {/* Viewport Crop Container */}
            <div className="flex flex-col items-center gap-3">
              {/* Display mode buttons */}
              <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 self-center">
                <button
                  type="button"
                  onClick={() => setFitMode('fit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${fitMode === 'fit' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Show Full Height (Fit)
                </button>
                <button
                  type="button"
                  onClick={() => setFitMode('cover')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${fitMode === 'cover' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Fill Frame (Cover)
                </button>
              </div>

              <div 
                ref={containerRef}
                className="relative bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden cursor-move select-none shadow-inner max-w-full"
                style={{ width: `${cropWidth}px`, height: `${cropHeight}px` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
              >
                {imageSrc && (
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Source to Crop"
                    onLoad={handleImageLoad}
                    className="absolute pointer-events-none origin-top-left max-w-none transition-transform duration-75"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${getBaseScale() * zoom})`
                    }}
                  />
                )}
                
                {/* Crop Guidelines Grid Overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none rounded-xl" />
                <div className="absolute inset-x-0 top-1/3 border-b border-dashed border-white/30 pointer-events-none" />
                <div className="absolute inset-x-0 top-2/3 border-b border-dashed border-white/30 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/3 border-r border-dashed border-white/30 pointer-events-none" />
                <div className="absolute inset-y-0 left-2/3 border-r border-dashed border-white/30 pointer-events-none" />

                {/* Drag hint overlay */}
                <div className="absolute bottom-3 right-3 bg-slate-950/80 text-white/90 backdrop-blur-sm text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 pointer-events-none border border-white/10 shadow-sm">
                  <Move className="w-3 h-3 text-blue-400" /> Drag to Pan
                </div>
              </div>
            </div>

            {/* Editor controls */}
            <div className="space-y-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                <ZoomOut className="w-4 h-4 text-slate-400" />
                <input 
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black text-white min-w-[32px] text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Directional Pad */}
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400">Fine Adjust</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => moveImage('left')} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveImage('up')} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveImage('down')} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveImage('right')} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"><ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            {/* Footer Actions: Allow either Keep Original (Full Height) or Apply Crop */}
            <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
              <div className="flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => onCrop(file)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-blue-400 py-3 rounded-2xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95 shadow-md"
                  title="Upload original file taking its full height without cropping"
                >
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span>Keep Original (Full Height)</span>
                </button>
                
                <button 
                  type="button" 
                  onClick={handleSaveCrop}
                  className="flex-1 bg-white hover:bg-blue-50 text-slate-950 py-3 rounded-2xl font-black transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 text-emerald-600" /> Apply Crop
                </button>
              </div>

              <button 
                type="button" 
                onClick={onCancel}
                className="w-full text-slate-400 hover:text-white py-1.5 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
