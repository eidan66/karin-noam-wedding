"use client";

import { useState, useEffect, useMemo } from 'react';
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
  "מחייכים למצלמה… גם השרת 😄",
  "התמונות בדרך לחופה 🎞️💍",
  "המחשב מצלם סלפי עם הקבצים 🤳",
  "אנחנו עושים להם פן לפני הגלריה 💁‍♀️",
  "עוד שנייה וכולם אומרים צ׳יז 🧀",
  "מגהצים את השמלה של הפיקסלים 👗✨",
  "הקבצים עושים ריקוד סלואו לרשת 💃🕺",
  "מחפשים מקום טוב ליד הבופה… לעלות 🍽️",
  "השרת מסדר שולחנות לתמונות 🪑",
  "קצת ברכות, קצת ביטים - מתקרבים 📨",
  "הצלם צועק: להעלות! להעלות! 📣",
  "הפלאש מוכן, הקבצים מתאבזרים ⚡",
  "שמים בייביסיטר לבייטים 👶💾",
  "האלבום מתרחב כמו מעגל הריקוד 🌀",
  "מתקתקים כמו דיג׳יי בשיא הערב 🎧",
  "הקובץ מתבייש… נותנים לו דקה 😉",
  "טקס קצר, קבלה ארוכה - בדיוק כמו בחתונה 🕯️",
  "הזוג בדרך לרחבה, הקבצים בדרך לגלריה 💑",
  "מנפחים בלונים לפיד התמונות 🎈",
  "השרת לוגם אספרסו ומאיץ העלאה ☕🚀",
  "בין חמסה לעין - שומרים על הקבצים 🧿",
  "מריצים חופה וקידושין על הווידאו ✡️🎥",
  "שמים נצנצים על הפריימים ✨",
  "הDJ מרים, גם השרת מרים בייטים 🔊",
  "שוברים כוס - אבל לא את הרשת 🥂",
  "מפזרים עלי כותרת על הגלריה 🌹",
  "עוד סיבוב רחבה ואנחנו באוויר 🔁",
  "הקבצים בשלב הטעימות - כמעט מוגשים 🍰",
  "כמו דודה ברחבה - זה לוקח שנייה אבל שווה 💃"
];


// Fisher-Yates shuffle function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function UploadProgressIndicator({ uploads, isUploading }: UploadProgressIndicatorProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showLongRunning, setShowLongRunning] = useState(false);

  // Shuffle messages on each mount for variety
  const shuffledMessages = useMemo(() => shuffleArray(UPLOAD_MESSAGES), []);

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
      setCurrentMessageIndex(prev => (prev + 1) % shuffledMessages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isUploading, shuffledMessages.length]);

  if (!isUploading && totalFiles === 0) return null;

  return (
    <div className="glass-effect rounded-2xl p-6 border border-gold-200 dark:border-slate-600 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">מצב ההעלאה</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {completedFiles} מתוך {totalFiles} קבצים הועלו בהצלחה
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span>התקדמות כללית</span>
          <span>{Math.round((completedFiles / totalFiles) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
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
        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
          <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{completedFiles}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">הועלו</div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1 animate-spin" />
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">{inProgressFiles}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">בתהליך</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="w-5 h-5 bg-yellow-400 dark:bg-yellow-500 rounded-full mx-auto mb-1 flex items-center justify-center">
            <span className="text-xs text-white font-bold">{pendingFiles}</span>
          </div>
          <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{pendingFiles}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">ממתינים</div>
        </div>
        
        {failedFiles > 0 && (
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-red-700 dark:text-red-300">{failedFiles}</div>
            <div className="text-xs text-red-600 dark:text-red-400">נכשלו</div>
          </div>
        )}
      </div>

      {/* Random Messages */}
      {showLongRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-gradient-to-r from-gold-50 to-cream-50 dark:from-gold-900/20 dark:to-cream-900/20 rounded-xl border border-gold-200 dark:border-gold-700"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="text-gray-700 dark:text-gray-200 font-medium"
            >
              {shuffledMessages[currentMessageIndex]}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            אל דאגה, אנחנו לא נתקענו! המערכת עובדת על זה... 🚀
          </p>
        </motion.div>
      )}

      {/* Individual File Progress */}
      {totalFiles > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">סטטוס קבצים בודדים:</h4>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {uploads.map((upload, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0">
                  {upload.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  {upload.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />}
                  {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                  {upload.status === 'pending' && <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 dark:text-gray-200 truncate">
                    קובץ {index + 1}
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
