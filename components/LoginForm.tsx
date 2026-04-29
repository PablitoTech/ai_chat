"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        await register(nombre, apellido, email, fechaNacimiento, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = isRegistering
    ? nombre && apellido && email && fechaNacimiento && password
    : email && password;

  const inputClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-100 placeholder-gray-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800 px-6 py-6 max-h-[95vh] overflow-y-auto">
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-100">
            {isRegistering ? "Crear cuenta" : "Iniciar sesion"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isRegistering ? "Accede a multiples modelos de IA" : "AI Chat - Todos los modelos, un solo lugar"}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded-lg mb-3 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nombre" className={labelClass}>Nombre</label>
                  <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="apellido" className={labelClass}>Apellido</label>
                  <input id="apellido" type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Tu apellido" required className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="fecha_nacimiento" className={labelClass}>Fecha de nacimiento</label>
                <input id="fecha_nacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required className={inputClass} />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Contrasena</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contrasena"
                required
                minLength={6}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Cargando..." : isRegistering ? "Crear cuenta" : "Iniciar sesion"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            {isRegistering ? "Ya tengo cuenta" : "No tengo cuenta - Registrarme"}
          </button>
        </div>
      </div>
    </div>
  );
}
