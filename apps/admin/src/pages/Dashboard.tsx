import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">상담 일정 관리</h1>
          <p className="text-text-secondary text-sm">슬롯을 추가하거나 예약을 관리하세요</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-2">
          <Plus size={20} />
          <span>새 슬롯 추가</span>
        </button>
      </div>

      {/* Calendar Placeholder */}
      <div className="card min-h-[600px] flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">2025년 12월</h2>
            <div className="flex items-center bg-bg-secondary rounded-lg border border-border overflow-hidden">
              <button className="p-2 hover:bg-bg-tertiary transition-colors border-r border-border">
                <ChevronLeft size={20} />
              </button>
              <button className="px-4 py-2 text-sm font-medium hover:bg-bg-tertiary transition-colors border-r border-border">
                오늘
              </button>
              <button className="p-2 hover:bg-bg-tertiary transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-lg border border-border">
            <button className="px-4 py-1.5 text-sm font-medium bg-white rounded shadow-sm text-primary">월</button>
            <button className="px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">주</button>
            <button className="px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">일</button>
          </div>
        </div>

        {/* Calendar Grid Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary space-y-4">
          <div className="w-24 h-24 rounded-full bg-bg-secondary flex items-center justify-center">
            <Calendar size={48} className="text-text-tertiary/50" />
          </div>
          <p className="text-lg font-medium">달력 기능은 곧 구현될 예정입니다.</p>
          <p className="text-sm">FullCalendar 또는 자체 구현 달력이 이곳에 위치합니다.</p>
        </div>
      </div>
    </div>
  );
};

// Simple Calendar icon for the placeholder
const Calendar = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default Dashboard;
