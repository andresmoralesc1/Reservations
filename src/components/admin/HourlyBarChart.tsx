import React from "react"

interface HourlyDataPoint {
  hour: number
  label: string
  count: number
  confirmed: number
  pending: number
  cancelled: number
  covers: number
}

interface HourlyBarChartProps {
  data: HourlyDataPoint[]
  maxCount: number
}

export function HourlyBarChart({ data, maxCount }: HourlyBarChartProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Reservas por Hora
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-neutral-600">Confirmadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-neutral-600">Pendientes</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-1 h-32">
        {data.map((item) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
          const confirmedHeight = item.count > 0 ? (item.confirmed / item.count) * height : 0
          const pendingHeight = item.count > 0 ? (item.pending / item.count) * height : 0

          return (
            <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-28 bg-neutral-100 rounded-sm relative overflow-hidden">
                {item.count > 0 && (
                  <>
                    {/* Confirmed portion */}
                    {confirmedHeight > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-emerald-500 transition-all duration-300"
                        style={{ height: `${confirmedHeight}px` }}
                      />
                    )}
                    {/* Pending portion */}
                    {pendingHeight > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-amber-500 transition-all duration-300"
                        style={{
                          height: `${pendingHeight}px`,
                          marginTop: `${confirmedHeight}px`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-neutral-400 px-1">
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
        <span>21:00</span>
        <span>23:00</span>
      </div>
    </div>
  )
}
