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
    <rect width="32" height="32" rx="8" fill="#111417" stroke="#30353A" />
    <path
      d="M23.5 8.5H13.75L8.5 13.75L13.75 19H19.75L24.5 23.75L19.25 29H8.5"
      stroke="#2ED6A1"
      strokeWidth="3.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

export default StockSenseMark;
