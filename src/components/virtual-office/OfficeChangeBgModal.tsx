'use client';

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  X,
  Check,
  Sparkles,
  Upload,
  UploadCloud,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  FileImage,
  Layers,
} from 'lucide-react';
import { BACKGROUND_PRESETS, BackgroundPreset } from '@/lib/office-buildings-config';

interface OfficeChangeBgModalProps {
  isOpen: boolean;
  currentBg: string;
  onClose: () => void;
  onApply: (newSrc: string) => void;
}

type TabType = 'upload' | 'preset' | 'url';

export const OfficeChangeBgModal: React.FC<OfficeChangeBgModalProps> = ({
  isOpen,
  currentBg,
  onClose,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  
  // Preset State
  const [selectedPreset, setSelectedPreset] = useState<string>(currentBg);

  // Custom URL State
  const [customInput, setCustomInput] = useState<string>(
    currentBg.startsWith('http') || !BACKGROUND_PRESETS.some((p) => p.imageSrc === currentBg)
      ? currentBg
      : ''
  );
  const [urlPreviewError, setUrlPreviewError] = useState<boolean>(false);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP, GIF)');
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์ใหญ่เกินกำหนด (สูงสุด 25MB)');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);

    // Detect image dimensions
    const img = new Image();
    img.onload = () => {
      setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload and Apply
  const handleUploadAndApply = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/office/upload-bg', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'การอัพโหลดรูปภาพล้มเหลว');
      }

      setUploadSuccess('อัพโหลดรูปภาพและเปลี่ยนพื้นหลังเรียบร้อย!');
      onApply(data.url);

      setTimeout(() => {
        onClose();
        // Reset state
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setFileDimensions(null);
        setUploadSuccess(null);
      }, 1000);
    } catch (err: any) {
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsUploading(false);
    }
  };

  // Apply Preset
  const handleApplyPreset = (preset: BackgroundPreset) => {
    setSelectedPreset(preset.imageSrc);
    onApply(preset.imageSrc);
    onClose();
  };

  // Apply Custom URL
  const handleApplyCustom = () => {
    if (customInput.trim()) {
      onApply(customInput.trim());
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ImageIcon className="w-4 h-4" />
              </span>
              <span>🖼️ เปลี่ยนภาพพื้นหลังสำนักงาน (Office Background)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              อัพโหลดภาพจากเครื่องของคุณ, เลือกธีมสำเร็จรูป หรือระบุ Image URL
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>อัพโหลดไฟล์จากเครื่อง (Upload File)</span>
          </button>

          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>ธีมสำเร็จรูป (Presets)</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>ลิงก์รูปภาพ (Image URL)</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD FILE */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {/* Drag & Drop Area */}
            {!filePreviewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-lg ring-2 ring-indigo-500/30'
                    : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-950/80'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white">
                    คลิกเพื่อเลือกไฟล์ หรือลากรูปภาพมาวางที่นี่
                  </p>
                  <p className="text-xs text-slate-400">
                    รองรับไฟล์ <span className="text-indigo-300 font-mono">PNG, JPG, WebP, GIF</span> (ขนาดสูงสุด 25MB)
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    💡 สัดส่วนที่แนะนำ: 16:9 หรือ 1400x788px
                  </span>
                </div>
              </div>
            ) : (
              /* Selected Image Preview */
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {selectedFile?.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{selectedFile && formatFileSize(selectedFile.size)}</span>
                        {fileDimensions && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-300 font-mono">
                              {fileDimensions.width} x {fileDimensions.height} px
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreviewUrl(null);
                      setFileDimensions(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="เลือกรูปอื่น"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Preview Box */}
                <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative group">
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[10px] text-slate-200 font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      ตัวอย่างการแสดงผล
                    </span>
                  </div>
                </div>

                {/* Upload CTA Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรูป</span>
                  </button>

                  <button
                    onClick={handleUploadAndApply}
                    disabled={isUploading}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-950/50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>กำลังอัพโหลดและนำมาใช้งาน...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>อัพโหลดและเปลี่ยนพื้นหลังทันที</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRESETS GALLERY */}
        {activeTab === 'preset' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>เลือกธีมบรรยากาศห้องทำงานมาตรฐาน:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BACKGROUND_PRESETS.map((preset) => {
                const isCurrent = currentBg === preset.imageSrc;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`group p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                        <img
                          src={preset.thumbnail}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/room/room-office.png';
                          }}
                        />
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-indigo-300 border border-indigo-500/30">
                          {preset.tag}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">1400x788</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ใช้งานอยู่
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-400 group-hover:underline">
                          เลือกใช้ธีมนี้
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM IMAGE URL */}
        {activeTab === 'url' && (
          <div className="space-y-3.5">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>ระบุ Image URL หรือ Local Path:</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    setUrlPreviewError(false);
                  }}
                  placeholder="เช่น https://images.unsplash.com/... หรือ /room/my-office.png"
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleApplyCustom}
                  disabled={!customInput.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex-shrink-0"
                >
                  นำภาพมาใช้
                </button>
              </div>

              {/* URL Image Preview if provided */}
              {customInput.trim() && (
                <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative mt-2">
                  {!urlPreviewError ? (
                    <img
                      src={customInput}
                      alt="URL Preview"
                      className="w-full h-full object-cover"
                      onError={() => setUrlPreviewError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-rose-400 gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>ไม่สามารถโหลดรูปภาพจาก URL นี้ได้</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                💡 <strong>คำแนะนำ:</strong> สามารถวางลิงก์รูปภาพออนไลน์ที่เข้าถึงได้โดยตรง หรือไฟล์ที่อยู่ในโฟลเดอร์ <code className="text-indigo-300 font-mono">public/</code>
              </p>
            </div>
          </div>
        )}

        {/* Active Background Status Bar */}
        <div className="flex items-center justify-between p-2.5 px-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">ภาพที่ใช้อยู่ปัจจุบัน:</span>
            <span className="text-indigo-300 font-mono text-[11px] truncate max-w-xs" title={currentBg}>
              {currentBg}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
