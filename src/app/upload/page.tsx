"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

import UploadZone from "../../components/upload/UploadZone";
import UploadPreview from "../../components/upload/UploadPreview";
import SuccessAnimation from "../../components/upload/SuccessAnimation";
import { useBulkUploader } from "../../hooks/useBulkUploader";

export default function UploadPage() {
  const navigate = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [caption, setCaption] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);
  const [showLongRunning, setShowLongRunning] = useState(false);

  const { uploads, uploadFiles, isUploading } = useBulkUploader();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Auto-scroll to the selected items section when files are added
  useEffect(() => {
    if (selectedFiles.length > 0) {
      firstItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedFiles.length]);

  // Show a friendly notice if uploading takes longer than ~30s
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isUploading) {
      t = setTimeout(() => setShowLongRunning(true), 30000);
    } else {
      setShowLongRunning(false);
      if (t) clearTimeout(t);
    }
    return () => { if (t) clearTimeout(t); };
  }, [isUploading]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await uploadFiles(selectedFiles, uploaderName, caption);
  };

  useEffect(() => {
    const allUploadsSuccessful = uploads.length > 0 && uploads.every(upload => upload.status === 'success');
    const anyUploadFailed = uploads.some(upload => upload.status === 'error');

    if (allUploadsSuccessful) {
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedFiles([]);
        setUploaderName("");
        setCaption("");
        setShowSuccess(false);
        navigate.push(createPageUrl("Gallery"));
      }, 4500);
    }
    if (anyUploadFailed) {
      console.error("One or more uploads failed.", uploads.filter(upload => upload.status === 'error'));
    }
  }, [uploads, navigate]);

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-4xl mx-auto px-2 md:px-4 py-6 pb-24 md:pb-8">
        {showSuccess ? (
          <SuccessAnimation />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="glass-effect rounded-3xl p-8 pt-0 border border-gold-200">
              <UploadZone onFileSelect={handleFileSelect} fileInputRef={fileInputRef} />
            </div>

            {selectedFiles.length > 0 && (
              <motion.div ref={firstItemRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-3xl p-6 border border-gold-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  קבצים שנבחרו ({selectedFiles.length})
                </h3>
                <UploadPreview files={selectedFiles} onRemove={removeFile} />
              </motion.div>
            )}

            {selectedFiles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-3xl p-8 border border-gold-200 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">הוסיפו פרטים</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">השם שלכם (אופציונלי)</label>
                    <Input value={uploaderName} onChange={(e) => setUploaderName(e.target.value)} placeholder="בואו נדע מי משתף את הזיכרון הזה" className="border-gold-200 focus:border-emerald-400 focus:ring-emerald-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (אופציונלי)</label>
                    <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="שתפו מה הופך את הרגע הזה למיוחד..." className="border-gold-200 focus:border-emerald-400 focus:ring-emerald-200 h-24" />
                  </div>
                </div>

                <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      מעלה את הזיכרון שלכם...
                    </div>
                  ) : (
                    `שתפו ${selectedFiles.length} ${selectedFiles.length === 1 ? 'זיכרון' : 'זכרונות'}`
                  )}
                </Button>

                {isUploading && showLongRunning && (
                  <div className="text-center text-sm text-gray-600">
                    לא נתקענו! מעלים לכם את התמונות... 🍾
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}