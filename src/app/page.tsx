import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
            Sistema de Reservas
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Sistema completo de gestión de reservas con IVR de voz y confirmaciones por WhatsApp
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/admin"
              className="rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Panel de Admin
            </Link>
            <Link
              href="/api/docs"
              className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50"
            >
              API Docs <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="text-3xl">📞</div>
              <h3 className="mt-4 text-lg font-semibold">IVR Inteligente</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Sistema de respuesta de voz con reconocimiento de habla automático
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="text-3xl">💬</div>
              <h3 className="mt-4 text-lg font-semibold">WhatsApp</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Confirmaciones automáticas con botones interactivos
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="text-3xl">📊</div>
              <h3 className="mt-4 text-lg font-semibold">Dashboard</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Panel de administración con estadísticas en tiempo real
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
