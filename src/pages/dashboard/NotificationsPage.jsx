import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle, Mail, Briefcase, Scissors, Clock,
  CheckCheck, Inbox, AlertTriangle, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/api/hooks';

const filters = ['Toutes', 'Non lues', 'Offres', 'Candidatures', 'Rappels'];

const typeConfig = {
  nouvelle_offre: {
    icon: Briefcase,
    color: 'text-primary-500',
    bg: 'bg-primary-500/10'
  },
  candidature: {
    icon: CheckCircle,
    color: 'text-secondary-500',
    bg: 'bg-secondary-500/10'
  },
  email: {
    icon: Mail,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  scrapping: {
    icon: Scissors,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  rappel: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  }
};

const filterToApiType = {
  'Non lues': { unreadOnly: 'true' },
  'Offres': { type: 'nouvelle_offre' },
  'Candidatures': { type: 'candidature' },
  'Rappels': { type: 'rappel' },
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

const listItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 }
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

function NotificationSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-4 p-4 sm:p-5 border-b border-surface-100 dark:border-surface-700 last:border-0">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-3 w-64 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState('Toutes');
  const [page, setPage] = useState(1);

  const apiFilters = useMemo(() => {
    const filters = { page, limit: 20 };
    const extra = filterToApiType[activeFilter];
    if (extra) Object.assign(filters, extra);
    return filters;
  }, [activeFilter, page]);

  const { data, isLoading, error, refetch } = useNotifications(apiFilters);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markAsRead = (id) => {
    markRead.mutate(id);
  };

  const markAllAsRead = () => {
    markAllRead.mutate();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger-300 bg-danger-50 py-12 dark:border-danger-500/30 dark:bg-danger-500/5">
          <AlertTriangle className="mb-3 h-10 w-10 text-danger-400" />
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-danger-500">{error?.message || 'Une erreur est survenue.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-600">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-500 hover:bg-primary-500/10 rounded-xl transition-colors disabled:opacity-60"
          >
            {markAllRead.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Tout marquer comme lu
          </button>
        )}
      </motion.div>

      <motion.div variants={fadeIn} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => { setActiveFilter(filter); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </motion.div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <NotificationSkeleton />
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                key="empty"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex flex-col items-center justify-center py-16 px-6 text-center"
              >
                <div className="p-4 bg-surface-100 dark:bg-surface-700 rounded-2xl mb-4">
                  <Inbox size={32} className="text-surface-400 dark:text-surface-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Aucune notification</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  Vous n'avez rien dans cette catégorie pour le moment.
                </p>
              </motion.div>
            ) : (
              notifications.map((notification, index) => {
                const config = typeConfig[notification.type] || typeConfig.email;
                const Icon = config.icon;
                const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: fr
                });

                return (
                  <motion.div
                    key={notification.id}
                    variants={listItem}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ delay: index * 0.03 }}
                    onClick={() => markAsRead(notification.id)}
                    className={`flex items-start gap-4 p-4 sm:p-5 border-b border-surface-100 dark:border-surface-700 last:border-0 cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50 ${
                      !notification.read ? 'bg-primary-500/[0.03]' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${config.bg}`}>
                      <Icon size={20} className={config.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm text-surface-900 dark:text-white truncate ${
                          !notification.read ? 'font-semibold' : 'font-medium'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5">
                        {timeAgo}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
