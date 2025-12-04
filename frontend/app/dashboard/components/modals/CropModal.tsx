"use client";
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Maximize2, ZoomIn, ZoomOut, RotateCw, Move } from "lucide-react";

interface CropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
  isLoading?: boolean;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  isLoading = false,
}: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChangeComplete = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 1));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const createCroppedImage = useCallback(
    async (pixels: CroppedAreaPixels): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const image = new Image();
        image.src = imageSrc;

        image.onload = () => {
          try {
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            canvas.width = pixels.width;
            canvas.height = pixels.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Failed to get canvas context");

            ctx.drawImage(
              image,
              pixels.x * scaleX,
              pixels.y * scaleY,
              pixels.width * scaleX,
              pixels.height * scaleY,
              0,
              0,
              pixels.width,
              pixels.height
            );

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Canvas is empty"));
                  return;
                }
                resolve(blob);
              },
              "image/jpeg",
              0.95
            );
          } catch (error) {
            reject(error);
          }
        };

        image.onerror = () => reject(new Error("Failed to load image"));
      });
    },
    [imageSrc]
  );

  const uploadToCloudinary = useCallback(
    async (blob: Blob): Promise<string> => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url;
    },
    []
  );

  const handleCropAndUpload = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedBlob = await createCroppedImage(croppedAreaPixels);
      const uploadedUrl = await uploadToCloudinary(croppedBlob);
      onCropComplete(uploadedUrl);
      onClose();
    } catch (error) {
      console.error("Crop and upload error:", error);
      // Bisa tambahkan toast notification di sini
    } finally {
      setIsCropping(false);
    }
  }, [croppedAreaPixels, createCroppedImage, uploadToCloudinary, onCropComplete, onClose]);

  if (!isOpen) return null;

  const isProcessing = isCropping || isLoading;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-bold">Sesuaikan Foto</h2>
                <p className="text-xs text-white/80 hidden sm:block">
                  Geser, zoom, dan putar foto Anda
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Crop Area */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-[280px] sm:min-h-[380px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropAreaChange={onCropChangeComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
          
          {/* Floating instruction */}
          <div className="hidden sm:flex absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium items-center gap-2 pointer-events-none">
            <Move className="w-4 h-4" />
            Geser foto untuk menyesuaikan posisi
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border-t border-gray-200 p-3 sm:p-4 space-y-3">
          {/* Quick Action Buttons */}
          <div className="flex gap-2 justify-center" role="group" aria-label="Kontrol cepat">
            <button
              onClick={handleZoomOut}
              disabled={isProcessing || zoom <= 1}
              className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
              title="Zoom Out"
              aria-label="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={isProcessing || zoom >= 3}
              className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
              title="Zoom In"
              aria-label="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              disabled={isProcessing}
              className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
              title="Putar 90°"
              aria-label="Putar"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="zoom-slider" className="text-xs font-bold text-gray-700">
                Zoom
              </label>
              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg" aria-live="polite">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <input
              id="zoom-slider"
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={isProcessing}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider-thumb"
              style={{
                background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${((zoom - 1) / 2) * 100}%, rgb(229, 231, 235) ${((zoom - 1) / 2) * 100}%, rgb(229, 231, 235) 100%)`
              }}
              aria-label="Kontrol zoom"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              Batal
            </button>
            <button
              onClick={handleCropAndUpload}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Proses...
                </span>
              ) : (
                "Sesuaikan & Gunakan"
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoom-in-95 {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in.fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-in.zoom-in-95 {
          animation: zoom-in-95 0.2s ease-out;
        }
        
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(37, 99, 235), rgb(147, 51, 234));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease;
        }
        
        @media (min-width: 640px) {
          .slider-thumb::-webkit-slider-thumb {
            width: 20px;
            height: 20px;
          }
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(37, 99, 235), rgb(147, 51, 234));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease;
        }
        
        @media (min-width: 640px) {
          .slider-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
          }
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider-thumb::-moz-range-thumb:active {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}