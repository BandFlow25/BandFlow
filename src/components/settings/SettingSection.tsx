import { cn } from '@/lib/utils';

interface SettingSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function SettingSection({ title, isExpanded, onToggle, children }: SettingSectionProps) {
  return (
    <div className="settings-section">
      <button
        onClick={onToggle}
        className={cn(
          "section-header",
          !isExpanded && "collapsed"
        )}
      >
        {title}
      </button>
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}