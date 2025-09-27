// Alternative icon imports for Analytics component
// Use this if you encounter Heroicons import issues

// Safe imports that are guaranteed to exist in @heroicons/react/24/outline
export const SafeIcons = {
  ChartBar: 'ChartBarIcon',
  AcademicCap: 'AcademicCapIcon', 
  UserGroup: 'UserGroupIcon',
  Clock: 'ClockIcon',
  ArrowTrending: 'ArrowTrendingUpIcon',
  Building: 'BuildingOffice2Icon'
};

// Alternative: Use Lucide React icons (already installed)
// import { BarChart3, GraduationCap, Users, Clock, TrendingUp, Building2 } from 'lucide-react';

// If you want to switch to Lucide icons, replace the Heroicons imports with:
/*
import { 
  BarChart3 as ChartBarIcon,
  GraduationCap as AcademicCapIcon,
  Users as UserGroupIcon,
  Clock as ClockIcon,
  TrendingUp as ArrowTrendingUpIcon,
  Building2 as BuildingOffice2Icon
} from 'lucide-react';
*/

export const availableHeroicons = [
  'AcademicCapIcon',
  'AdjustmentsHorizontalIcon',
  'ArrowDownIcon', 
  'ArrowLeftIcon',
  'ArrowRightIcon',
  'ArrowTrendingUpIcon',
  'ArrowUpIcon',
  'Bars3Icon',
  'BuildingOffice2Icon',
  'CalendarIcon',
  'ChartBarIcon',
  'CheckIcon',
  'ClockIcon',
  'Cog6ToothIcon',
  'DocumentIcon',
  'EyeIcon',
  'HomeIcon',
  'InformationCircleIcon',
  'MagnifyingGlassIcon',
  'PencilIcon',
  'PlusIcon',
  'TrashIcon',
  'UserGroupIcon',
  'UserIcon',
  'XMarkIcon'
];

console.log('Available safe Heroicons for use:', availableHeroicons);