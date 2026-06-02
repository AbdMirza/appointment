import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfDay, 
  endOfDay,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const STATUS_CONFIG = {
  PENDING: { bg: "bg-amber-50", border: "border-amber-200", stripe: "bg-amber-400", text: "text-amber-800" },
  CONFIRMED: { bg: "bg-blue-50", border: "border-blue-200", stripe: "bg-blue-500", text: "text-blue-800" },
  ASSIGNED: { bg: "bg-indigo-50", border: "border-indigo-200", stripe: "bg-indigo-500", text: "text-indigo-800" },
  COMPLETED: { bg: "bg-emerald-50", border: "border-emerald-200", stripe: "bg-emerald-500", text: "text-emerald-800" },
  CANCELLED: { bg: "bg-rose-50", border: "border-rose-200", stripe: "bg-rose-500", text: "text-rose-800" },
  DEFAULT: { bg: "bg-slate-50", border: "border-slate-200", stripe: "bg-slate-400", text: "text-slate-700" }
};

const CurrentTimeIndicator = ({ hoursStart = 8, hourHeight = 70 }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const hour = now.getHours();
  const min = now.getMinutes();
  if (hour < hoursStart || hour >= 22) return null;
  const top = (hour - hoursStart) * hourHeight + (min / 60) * hourHeight;
  return (
    <div className="absolute left-0 right-0 z-40 pointer-events-none flex items-center" style={{ top: `${top}px` }}>
      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.25"></div>
      <div className="flex-1 h-[1.5px] bg-rose-500"></div>
    </div>
  );
};

const CalendarView = ({ appointments = [], onRangeChange, onAppointmentClick, loading }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week');

  const { start, end } = useMemo(() => {
    let start, end;
    if (viewType === 'day') {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else if (viewType === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }
    return { start, end };
  }, [currentDate, viewType]);

  useEffect(() => {
    if (onRangeChange) onRangeChange(start, end);
  }, [start, end, onRangeChange]);

  const days = useMemo(() => {
    if (viewType === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 })
      });
    }
    return eachDayOfInterval({ start, end });
  }, [viewType, start, end, currentDate]);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  const getAppsForDay = (day) => {
    if (!appointments || !Array.isArray(appointments)) return [];
    const targetDateStr = format(day, 'yyyy-MM-dd');
    return appointments.filter(app => {
      try {
        const appDate = typeof app.startTime === 'string' ? parseISO(app.startTime) : new Date(app.startTime);
        return format(appDate, 'yyyy-MM-dd') === targetDateStr;
      } catch (e) { return false; }
    });
  };

  /**
   * Helper to calculate overlap lanes for appointments
   */
  const calculateLanes = (dayApps) => {
    const sorted = [...dayApps].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const lanes = [];
    
    sorted.forEach(app => {
      const start = new Date(app.startTime).getTime();
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        const lastAppInLane = lanes[i][lanes[i].length - 1];
        if (new Date(lastAppInLane.endTime).getTime() <= start) {
          lanes[i].push(app);
          app.lane = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        app.lane = lanes.length;
        lanes.push([app]);
      }
    });
    
    sorted.forEach(app => {
      app.totalLanes = lanes.length;
    });
    
    return sorted;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[750px] relative">
      {/* Header */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50 border-b border-slate-200 z-20">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-slate-800">
            {viewType === 'month' ? format(currentDate, 'MMMM yyyy') : `${format(start, 'MMM d')} — ${format(end, 'MMM d, yyyy')}`}
          </h2>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setCurrentDate(viewType === 'day' ? subDays(currentDate, 1) : viewType === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 border-r border-slate-200 transition-colors text-slate-600"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-xs font-bold hover:bg-slate-50 transition-colors text-slate-700">Today</button>
            <button onClick={() => setCurrentDate(viewType === 'day' ? addDays(currentDate, 1) : viewType === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 border-l border-slate-200 transition-colors text-slate-600"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="flex items-center bg-slate-200/50 p-1 rounded-lg">
          {['day', 'week', 'month'].map((type) => (
            <button key={type} onClick={() => setViewType(type)} className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize", viewType === type ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}>{type}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto relative custom-scrollbar bg-white">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[100] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* --- MONTH VIEW --- */}
        {viewType === 'month' && (
          <div className="grid grid-cols-7 min-h-full">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 bg-slate-50">{day}</div>
            ))}
            {days.map((day, idx) => {
              const dayApps = getAppsForDay(day);
              const isToday = isSameDay(day, new Date());
              const currentMonth = isSameMonth(day, currentDate);
              return (
                <div key={idx} className={cn("min-h-[100px] border-r border-b border-slate-200 p-1 transition-colors", !currentMonth ? "bg-slate-50/50" : "bg-white", isToday && "bg-blue-50/30")}>
                  <div className="flex justify-end mb-1">
                    <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-blue-600 text-white" : currentMonth ? "text-slate-700" : "text-slate-300")}>{format(day, 'd')}</span>
                  </div>
                  <div className="space-y-0.5">
                    {dayApps.slice(0, 4).map(app => (
                      <div key={app.id} onClick={() => onAppointmentClick(app)} className={cn("text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer font-bold", STATUS_CONFIG[app.status]?.bg || STATUS_CONFIG.DEFAULT.bg, STATUS_CONFIG[app.status]?.border || STATUS_CONFIG.DEFAULT.border, STATUS_CONFIG[app.status]?.text || STATUS_CONFIG.DEFAULT.text)}>
                        {format(parseISO(app.startTime), 'HH:mm')} {app.service?.name}
                      </div>
                    ))}
                    {dayApps.length > 4 && <div className="text-[9px] text-blue-600 font-bold px-1.5 cursor-pointer hover:underline" onClick={() => { setCurrentDate(day); setViewType('day'); }}>+{dayApps.length - 4} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- WEEK / DAY VIEW --- */}
        {(viewType === 'week' || viewType === 'day') && (
          <div className="flex h-full min-w-[800px] bg-white">
            <div className="w-16 border-r border-slate-300 bg-slate-50 sticky left-0 z-30">
              <div className="h-12 border-b border-slate-300"></div>
              {hours.map(hour => (
                <div key={hour} className="h-[70px] border-b border-slate-300 flex items-start justify-center pt-1 pr-1"><span className="text-[10px] font-bold text-slate-500 uppercase">{hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}</span></div>
              ))}
            </div>

            <div className="flex-1 flex min-w-0">
              {days.map((day, idx) => {
                const rawDayApps = getAppsForDay(day);
                const dayApps = calculateLanes(rawDayApps);
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={idx} className={cn("flex-1 border-r border-slate-300 relative group", isToday && "bg-blue-50/5")}>
                    {/* Day Header with Notification Badge */}
                    <div className={cn("h-12 border-b border-slate-300 sticky top-0 bg-slate-50 z-20 flex flex-col items-center justify-center relative", isToday && "bg-blue-50/50 shadow-[inset_0_-3px_0_#2563eb]")}>
                      <span className={cn("text-[9px] font-bold uppercase", isToday ? "text-blue-600" : "text-slate-400")}>{format(day, 'EEE d')}</span>
                      {rawDayApps.length > 0 && (
                        <div className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 bg-rose-500 rounded-full shadow-sm ring-1 ring-white">
                          <span className="text-[8px] text-white font-black">{rawDayApps.length}</span>
                        </div>
                      )}
                    </div>

                    <div className="relative h-[calc(15*70px)]">
                      {hours.map(hour => <div key={hour} className="h-[70px] border-b border-slate-300 relative"><div className="absolute top-[35px] left-0 right-0 border-t border-slate-200 border-dashed"></div></div>)}
                      {isToday && <CurrentTimeIndicator hoursStart={8} hourHeight={70} />}

                      {dayApps.map(app => {
                        const appStartTime = typeof app.startTime === 'string' ? parseISO(app.startTime) : new Date(app.startTime);
                        const appEndTime = typeof app.endTime === 'string' ? parseISO(app.endTime) : new Date(app.endTime);
                        const startHour = appStartTime.getHours();
                        const startMin = appStartTime.getMinutes();
                        const durMs = appEndTime.getTime() - appStartTime.getTime();
                        const durationMin = Math.max(20, durMs / (1000 * 60));
                        const top = (startHour - 8) * 70 + (startMin / 60) * 70;
                        const height = (durationMin / 60) * 70;
                        if (startHour < 8 || startHour >= 23) return null;

                        const style = STATUS_CONFIG[app.status] || STATUS_CONFIG.DEFAULT;
                        
                        // Calculate width and offset based on lanes
                        const width = 100 / app.totalLanes;
                        const left = app.lane * width;

                        return (
                          <div key={app.id} onClick={() => onAppointmentClick(app)} style={{ top: `${top}px`, height: `${height}px`, width: `${width}%`, left: `${left}%`, paddingRight: '2px', paddingLeft: '2px' }} className="absolute z-[10] transition-all cursor-pointer">
                            <div className={cn("w-full h-full rounded border shadow-sm overflow-hidden relative group", style.bg, style.border)}>
                              <div className={cn("absolute top-0 left-0 bottom-0 w-1", style.stripe)}></div>
                              <div className="pl-2 pr-1 py-1 flex flex-col h-full">
                                <p className={cn("text-[9px] font-black truncate leading-tight uppercase", style.text)}>{app.service?.name}</p>
                                <div className="flex items-center justify-between mt-0.5">
                                  <p className="text-[8px] font-bold text-slate-700 truncate">{app.user?.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{format(appStartTime, 'HH:mm')}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}</style>
    </div>
  );
};

export default CalendarView;
