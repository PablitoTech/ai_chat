import { Message as MessageType } from "@/types";

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl ${
          isUser ? "bg-primary-600 text-white" : "bg-gray-800 text-gray-100"
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-2">
            {!isUser && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              {hasAttachments && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {message.attachments!.map((att) => (
                    <div
                      key={att.id}
                      className={`rounded-lg overflow-hidden ${
                        isUser ? "bg-primary-700" : "bg-gray-700"
                      } border ${isUser ? "border-primary-500" : "border-gray-600"}`}
                    >
                      {att.type === "image" && att.previewUrl && (
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="max-w-[200px] max-h-[200px] object-cover"
                        />
                      )}
                      {att.type === "pdf" && (
                        <div className="p-3 flex items-center gap-2">
                          <div className={`w-10 h-10 rounded flex items-center justify-center ${
                            isUser ? "bg-red-600" : "bg-red-900/50"
                          }`}>
                            <span className={`text-xs font-bold ${isUser ? "text-white" : "text-red-400"}`}>PDF</span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${isUser ? "text-white" : "text-gray-200"}`}>{att.name}</p>
                            <p className={`text-xs ${isUser ? "text-primary-200" : "text-gray-400"}`}>{(att.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
              <p className={`text-xs mt-2 ${isUser ? "text-primary-200" : "text-gray-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {isUser && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-bold">
                U
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
