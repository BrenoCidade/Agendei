import React, { useState, useEffect } from "react";
import { Share, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  useEffect(() => {
    // Detects if device is on iOS 
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      // Safe checks for iOS user agent
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Detects if device is in standalone mode (already installed)
    const isInStandaloneMode = () =>
      ("standalone" in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;

    // Show prompt if on iOS and not already installed
    if (isIos() && !isInStandaloneMode()) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isTooltipOpen && (
        <div className="bg-white text-gray-900 text-sm p-4 rounded-xl shadow-xl border border-gray-100 mb-3 w-72 relative">
          <button 
            onClick={() => setIsTooltipOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
          
          <h4 className="font-semibold text-gray-900 mb-2">Instalar App Agendei ❤️</h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
            <li>Toque no botão <span className="inline-flex items-center justify-center bg-gray-100 p-1 rounded-md mx-1"><Share size={14} className="text-blue-500" /></span> abaixo (Compartilhar).</li>
            <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
          </ol>
          
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
        </div>
      )}

      {!isTooltipOpen && (
        <button
          onClick={() => setIsTooltipOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Share size={18} />
          <span>Instalar App</span>
        </button>
      )}
    </div>
  );
}
