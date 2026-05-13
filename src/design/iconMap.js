import { 
  BookOpen, 
  Award, 
  Clock, 
  BarChart, 
  Users, 
  CheckCircle, 
  Zap, 
  AlertTriangle, 
  CreditCard, 
  Layout, 
  MessageSquare, 
  Sparkles,
  Search,
  Filter,
  XCircle,
  TrendingUp,
  Download,
  UserCheck
} from 'lucide-react';

/**
 * iconMap.js
 * 
 * Centralized icon authority.
 * Replaces hardcoded emojis and inconsistent icon usage across the app.
 * Mapping logic ensures that the same concepts always use the same icons.
 */

export const ICONS = {
  // Learning
  COURSE: BookOpen,
  LESSON: Layout,
  CERTIFICATE: Award,
  PROGRESS: BarChart,
  DURATION: Clock,
  ENROLLMENT: Users,
  COMPLETED: CheckCircle,
  
  // Interaction
  DISCUSSION: MessageSquare,
  AI_TUTOR: Sparkles,
  SEARCH: Search,
  FILTER: Filter,
  CLEAR: XCircle,
  
  // Status
  ACTIVE: Zap,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  
  // Finance
  PAYMENT: CreditCard,
  REVENUE: TrendingUp,
  EXPORT: Download,
  
  // Roles
  STUDENT: Users,
  INSTRUCTOR: UserCheck,
  ADMIN: Zap
};
