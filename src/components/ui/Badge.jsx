const colorMap = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  orange: 'bg-orange-100 text-orange-700',
}

const sizeMap = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
}

export default function Badge({ children, color = 'gray', size = 'sm' }) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colorMap[color] || colorMap.gray} ${sizeMap[size] || sizeMap.sm}`}
    >
      {children}
    </span>
  )
}
