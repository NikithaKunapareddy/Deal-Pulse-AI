interface DashboardCardProps {
  title: string
  value: string | number
  icon: string
  subtitle?: string
}

export default function DashboardCard({
  title,
  value,
  icon,
  subtitle,
}: DashboardCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-xl">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Card Border Glow */}
      <div className="absolute inset-0 border border-purple-500/20 rounded-xl group-hover:border-purple-400/50 transition-all duration-300"></div>
      
      {/* Content */}
      <div className="relative bg-gradient-to-br from-[#1a0a2e]/90 to-[#16213e]/90 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 group-hover:border-purple-400/40 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 hover:shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
          <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">{icon}</span>
        </div>
        <div>
          <p className="text-3xl font-black bg-gradient-to-r from-purple-300 via-purple-200 to-pink-300 bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2 font-medium">{subtitle}</p>
          )}
        </div>
        
        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 w-0 group-hover:w-full transition-all duration-500 rounded-full"></div>
      </div>
    </div>
  )
}
