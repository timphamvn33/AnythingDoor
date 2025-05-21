import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  className?: string;
}

export default function UserAvatar({ name, className }: UserAvatarProps) {
  const words = name.trim().split(' ').filter(Boolean);

  let initials = '';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else {
    initials = '??';
  }

  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full font-semibold flex items-center justify-center shadow-md select-none',
        'bg-white text-black transition-colors duration-200',
        className,
      )}
    >
      {initials}
    </div>
  );
}
