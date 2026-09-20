interface StockSenseMarkProps {
  className?: string;
}

const StockSenseMark = ({ className = 'h-7 w-7' }: StockSenseMarkProps) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="9" fill="currentColor" />
    <path d="M8 21.5V17.5M13.5 21.5V13.5M19 21.5V15.75M24 21.5V9.5" stroke="white" strokeWidth="2.25" strokeLinecap="round" />
    <path d="M8 13.75L13.25 10.5L18.75 12.25L24 7.75" stroke="#36D399" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default StockSenseMark;
