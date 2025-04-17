interface ProgressBarProps {
  current: number;
  target: number;
  symbol: string;
  showValues?: boolean;
}

export default function ProgressBar({
  current,
  target,
  symbol,
  showValues = true,
}: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-2">
      {showValues && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {current} {symbol}
          </span>
          <span>
            {target} {symbol}
          </span>
        </div>
      )}
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center text-sm text-gray-600">
        {percentage.toFixed(1)}% Complete
      </div>
    </div>
  );
} 