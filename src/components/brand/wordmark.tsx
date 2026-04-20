import Image from 'next/image';
import { cn } from '@/lib/cn';

interface WordmarkProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/** Brand mark + "airbnb.rlt.sk" wordmark. */
export function Wordmark({ size = 24, showText = true, className }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image src="/brand/logo-mark.svg" alt="" width={size} height={size} priority />
      {showText && (
        <span className="text-sm font-semibold tracking-tight text-fg">
          airbnb<span className="text-accent-500">.rlt</span>.sk
        </span>
      )}
    </span>
  );
}
