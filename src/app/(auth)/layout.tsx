export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
      {children}
    </div>
  )
}
