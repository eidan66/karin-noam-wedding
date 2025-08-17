"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadProgressIndicatorProps {
  uploads: Array<{
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  }>;
  isUploading: boolean;
}

const UPLOAD_MESSAGES = [
  "מעלים את הזיכרונות היפים שלכם... 🌸",
  "התמונות בדרך לגלריה! 📸",
  "עוד רגע קטן והכל יהיה מוכן... ⏳",
  "מעבדים את הקבצים בזהירות... 🔧",
  "הסרטונים מתעלים לאט לאט... 🎬",
  "מחכים שכל התמונות יגיעו... 🚀",
  "המערכת עובדת קשה בשבילכם... 💪",
  "עוד כמה שניות והכל יהיה מושלם... ✨",
  "הקבצים מתארגנים בגלריה... 🎨",
  "מעלים בקצב של צב אבל בטוח! 🐢",
  "גם אנחנו שתיתו קצת, ייקח לנו עוד רגע"
];

export default function UploadProgressIndicator({ uploads, isUploading }: UploadProgressIndicatorProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showLongRunning, setShowLongRunning] = useState(false);

  // Calculate progress statistics
  const totalFiles = uploads.length;
  const completedFiles = uploads.filter(u => u.status === 'success').length;
  const failedFiles = uploads.filter(u => u.status === 'error').length;
  const inProgressFiles = uploads.filter(u => u.status === 'uploading').length;
  const pendingFiles = uploads.filter(u => u.status === 'pending').length;

  // Show long running message after 30 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isUploading) {
      timer = setTimeout(() => setShowLongRunning(true), 30000);
    } else {
      setShowLongRunning(false);
    }
    return () => clearTimeout(timer);
  }, [isUploading]);

  // Rotate messages every 10 seconds
  useEffect(() => {
    if (!isUploading) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % UPLOAD_MESSAGES.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isUploading]);

  if (!isUploading && totalFiles === 0) return null;

  return (
    <div className="glass-effect rounded-2xl p-6 border border-gold-200 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">מצב ההעלאה</h3>
          <p className="text-sm text-gray-600">
            {completedFiles} מתוך {totalFiles} קבצים הועלו בהצלחה
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>התקדמות כללית</span>
          <span>{Math.round((completedFiles / totalFiles) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedFiles / totalFiles) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-emerald-700">{completedFiles}</div>
          <div className="text-xs text-emerald-600">הועלו</div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Loader2 className="w-5 h-5 text-blue-600 mx-auto mb-1 animate-spin" />
          <div className="text-sm font-medium text-blue-700">{inProgressFiles}</div>
          <div className="text-xs text-blue-600">בתהליך</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="w-5 h-5 bg-yellow-400 rounded-full mx-auto mb-1 flex items-center justify-center">
            <span className="text-xs text-white font-bold">{pendingFiles}</span>
          </div>
          <div className="text-sm font-medium text-yellow-700">{pendingFiles}</div>
          <div className="text-xs text-yellow-600">ממתינים</div>
        </div>
        
        {failedFiles > 0 && (
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-red-700">{failedFiles}</div>
            <div className="text-xs text-red-600">נכשלו</div>
          </div>
        )}
      </div>

      {/* Random Messages */}
      {showLongRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-gradient-to-r from-gold-50 to-cream-50 rounded-xl border border-gold-200"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="text-gray-700 font-medium"
            >
              {UPLOAD_MESSAGES[currentMessageIndex]}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-gray-600 mt-2">
            אל דאגה, אנחנו לא נתקענו! המערכת עובדת על זה... 🚀
          </p>
        </motion.div>
      )}

      {/* Individual File Progress */}
      {totalFiles > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">סטטוס קבצים בודדים:</h4>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {uploads.map((upload, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {upload.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  {upload.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                  {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  {upload.status === 'pending' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 truncate">
                    קובץ {index + 1}
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  {upload.status === 'success' && 'הועלה'}
                  {upload.status === 'uploading' && `${upload.progress}%`}
                  {upload.status === 'error' && 'נכשל'}
                  {upload.status === 'pending' && 'ממתין'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
