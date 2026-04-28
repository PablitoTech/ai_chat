import { useState, KeyboardEvent, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { Attachment } from "@/types";

interface InputProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

export default function Input({ onSendMessage, isLoading }: InputProps) {
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (inputValue.trim().length > 0 || attachments.length > 0) && !isLoading && !isProcessingImages;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  const processFile = async (file: File): Promise<Attachment | null> => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert(`Tipo de archivo no soportado: ${file.type}`);
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`El archivo es muy grande. Maximo 10MB.`);
      return null;
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    if (isImage) {
      const reader = new FileReader();
      const data = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      return { id, type: "image", name: file.name, size: file.size, data, previewUrl: data };
    }

    if (isPDF) {
      const text = await extractPDFText(file);
      return { id, type: "pdf", name: file.name, size: file.size, data: text };
    }

    return null;
  };

  const extractPDFText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let text = "";
      let currentText = "";

      for (let i = 0; i < uint8Array.length; i++) {
        if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
          currentText += String.fromCharCode(uint8Array[i]);
        } else if (currentText.length > 0) {
          if (currentText.trim()) text += currentText.trim() + " ";
          currentText = "";
        }
      }

      return text.trim().substring(0, 50000);
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      return `[PDF: ${file.name}] - No se pudo extraer el texto`;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const pdfFiles = Array.from(files).filter((f) => f.type === "application/pdf");

    if (imageFiles.length > 0) setIsProcessingImages(true);

    for (const file of pdfFiles) {
      const attachment = await processFile(file);
      if (attachment) setAttachments((prev) => [...prev, attachment]);
    }

    for (const file of imageFiles) {
      const attachment = await processFile(file);
      if (attachment) setAttachments((prev) => [...prev, attachment]);
    }

    setIsProcessingImages(false);
  };

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: DragEvent) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const removeAttachment = (id: string) => { setAttachments((prev) => prev.filter((att) => att.id !== id)); };

  const handleSend = () => {
    if (canSend) {
      onSendMessage(inputValue.trim(), attachments);
      setInputValue("");
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4">
      {attachments.length > 0 && (
        <div className="max-w-4xl mx-auto mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div key={att.id} className="relative group bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                {att.type === "image" && att.previewUrl && (
                  <img src={att.previewUrl} alt={att.name} className="w-12 h-12 object-cover rounded" />
                )}
                {att.type === "pdf" && (
                  <div className="w-12 h-12 bg-red-900/50 rounded flex items-center justify-center">
                    <span className="text-red-400 text-xs font-bold">PDF</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300 truncate">{att.name}</p>
                  <p className="text-xs text-gray-500">{(att.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`max-w-4xl mx-auto rounded-xl border-2 border-dashed transition-all ${
          isDragging ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:border-gray-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex gap-3 items-end p-3">
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileSelect} className="hidden" />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-all disabled:opacity-50"
            title="Adjuntar archivo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isProcessingImages ? "Procesando imagenes..." : "Escribe tu mensaje o arrastra archivos aqui..."}
              disabled={isLoading || isProcessingImages}
              rows={1}
              className="w-full px-4 py-2 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none resize-none disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading || isProcessingImages ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{isProcessingImages ? "Procesando" : "Enviando"}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <span>Enviar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center mt-2 max-w-4xl mx-auto">
        Soporta imagenes y PDFs - Maximo 10MB por archivo
      </p>
    </div>
  );
}
