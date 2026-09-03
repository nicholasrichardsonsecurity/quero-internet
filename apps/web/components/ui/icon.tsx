import type { LucideProps } from 'lucide-react';
import {
  Bell,
  CircleHelp,
  LayoutDashboard,
  Settings,
  User,
  type LucideIcon
} from 'lucide-react';

const icons = {
  dashboard: LayoutDashboard,
  settings: Settings,
  user: User,
  notifications: Bell,
  help: CircleHelp
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  'aria-hidden': ariaHidden = true,
  ...props
}: IconProps) {
  const IconComponent = icons[name];

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
