import Image from 'next/image'

import { cn } from '@/lib/utils'

interface LogoMarkProps {
  className?: string
  priority?: boolean
  sizes?: string
}

export function LogoMark({
  className,
  priority = false,
  sizes = '48px',
}: LogoMarkProps) {
  return (
    <span className={cn('relative block shrink-0', className)}>
      <Image
        src="/logo.png"
        alt="OpeningMaster logo"
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </span>
  )
}
