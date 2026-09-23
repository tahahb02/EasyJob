import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, ArrowLeft, Mail, MessageSquare, ExternalLink,
  Inbox, Loader2, ChevronRight, PenSquare, X, Reply
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import {
  useMailbox,
  useMarkMailRead,
  useMail,
  useMailConversations,
  useSendMail,
  useReplyMail,
} from '@/api/hooks';

const avatarColors = [
  'bg-primary',
  'bg-accent',
  'bg-purple-500',
  'bg-orange-500'
];

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

const messageIn = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?';
}

function avatarColorFor(name) {
  const sum = String(name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
}

function truncate(text, max = 90) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

function formatConversationTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);
  if (diffHours < 24 && d.toDateString() === now.toDateString()) {
    return format(d, 'HH:mm', { locale: fr });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return format(d, 'dd MMM', { locale: fr });
  }
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

function formatEmailDate(d) {
  const date = new Date(d);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return format(date, 'HH:mm', { locale: fr });
  const thisYear = date.getFullYear() === now.getFullYear();
  return format(date, thisYear ? 'dd MMM' : 'dd MMM yyyy', { locale: fr });
}

/* ─── Chat (Messages) ─────────────────────────────────────────── */
function ConversationSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesTab() {
  const { data: convData, isLoading } = useMailConversations();
  const conversations = convData?.conversations ?? [];
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const sendMail = useSendMail();
  const markRead = useMarkMailRead();
  const markedReadRef = useRef(null);

  const selectedConversation = conversations.find(c => c.participant?.email === selectedEmail) || null;

  const uriMessages = useMemo(
    () => selectedEmail ? { conversation: selectedEmail, page: 1, limit: 100 } : undefined,
    [selectedEmail]
  );
  const { data: messagesData, isFetching: messagesLoading } = useMailbox(uriMessages || {}, { enabled: !!selectedEmail });
  const emails = messagesData?.emails ?? [];

  const messages = useMemo(() => {
    return [...emails]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(email => ({
        id: email._id,
        sender: email.direction === 'received' ? 'them' : 'me',
        text: email.body || email.subject || '',
        time: new Date(email.createdAt),
      }));
  }, [emails]);

  const filteredConversations = conversations.filter(c =>
    (c.participant?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.participant?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, selectedEmail]);

  const markConversationRead = useCallback(() => {
    if (!selectedEmail) return;
    const unread = emails.filter(e => e.direction === 'received' && !e.isRead);
    unread.slice(0, 10).forEach(email => {
      const id = email._id;
      if (markedReadRef.current !== id) {
        markedReadRef.current = id;
        markRead.mutate(id);
      }
    });
  }, [selectedEmail, emails, markRead]);

  useEffect(() => {
    markConversationRead();
  }, [markConversationRead]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedConversation) return;

    const baseSubject = (selectedConversation.lastSubject || '')
      .replace(/^\s*Re:\s*/i, '')
      .trim();
    const subject = baseSubject || 'Discussion EasyJob';

    try {
      await sendMail.mutateAsync({
        to: selectedConversation.participant.email,
        subject,
        body: text,
      });
      setInputValue('');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex h-[calc(100vh-290px)] h-[calc(100dvh-290px)] min-h-[480px]">
      <div className={`w-full sm:w-80 lg:w-96 border-r border-border flex flex-col ${
        selectedEmail ? 'hidden sm:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-auto bg-muted pl-10 pr-4 py-2.5 rounded-lg text-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ConversationSkeleton />
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="p-4 bg-muted rounded-xl mb-4">
                <MessageSquare size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {searchQuery.trim() ? 'Aucun résultat' : 'Aucune conversation'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery.trim()
                  ? `Aucun échange ne correspond à « ${searchQuery.trim()} »`
                  : 'Vos conversations avec recruteurs et candidats apparaîtront ici'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const name = conversation.participant?.name || conversation.participant?.email || 'Inconnu';
              const unread = conversation.unreadCount || 0;
              return (
                <button
                  key={conversation.key}
                  onClick={() => setSelectedEmail(conversation.participant.email)}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-border ${
                    selectedEmail === conversation.participant.email
                      ? 'bg-accent/10'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className={`flex-shrink-0 w-11 h-11 rounded-full ${avatarColorFor(name)} flex items-center justify-center text-white text-sm font-semibold`}>
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatConversationTime(conversation.time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        <span className={conversation.lastSender === 'Vous' ? '' : 'font-medium text-foreground/80'}>
                          {conversation.lastSender === 'Vous' ? 'Vous : ' : ''}
                        </span>
                        {truncate(conversation.lastMessage || conversation.lastSubject || 'Sans message')}
                      </p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 ml-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEmail(null)}
                className="sm:hidden size-9"
              >
                <ArrowLeft size={20} className="text-foreground" />
              </Button>
              <div className={`w-9 h-9 rounded-full ${avatarColorFor(selectedConversation.participant?.name)} flex items-center justify-center text-white text-sm font-semibold`}>
                {getInitials(selectedConversation.participant?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {selectedConversation.participant?.name || selectedConversation.participant?.email}
                </p>
                <p className="text-xs text-accent truncate">
                  {selectedConversation.participant?.email}
                  {selectedConversation.participant?.role === 'recruiter' ? ' · Recruteur' : selectedConversation.participant?.role === 'candidat' ? ' · Candidat' : ''}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-3">
                    <MessageSquare size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envoyez le premier message de cet échange
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={messageIn}
                      initial="hidden"
                      animate="visible"
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-xl ${
                        msg.sender === 'me'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender === 'me' ? 'text-white/60' : 'text-muted-foreground'
                        }`}>
                          {format(msg.time, 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-2">
                <Input
                  type="text"
                  placeholder="Écrire un message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-auto bg-muted px-4 py-2.5 rounded-lg text-foreground"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sendMail.isPending}
                  size="icon"
                  className="size-10 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40"
                >
                  {sendMail.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Vos messages</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Emails (mailbox) ────────────────────────────────────────── */
function EmailSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3.5">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailListItem({ email, onOpen, isActive }) {
  const isReceived = email.direction === 'received';
  const contactName = isReceived ? email.fromName || email.fromUser?.firstName : email.toName;
  const subtitle = isReceived
    ? (email.companyName || email.fromUser?.firstName || email.fromEmail || 'Expéditeur')
    : (email.toEmail || 'Destinataire');

  return (
    <button
      onClick={() => onOpen(email._id)}
      className={`w-full flex items-start gap-3 p-3.5 text-left transition-colors border-b border-border last:border-0 hover:bg-muted ${
        isActive ? 'bg-accent/10' : ''
      } ${!email.isRead && isReceived ? 'bg-primary/[0.03]' : ''}`}
    >
      <div className={`relative flex-shrink-0 w-10 h-10 rounded-full ${avatarColorFor(contactName)} text-white flex items-center justify-center text-sm font-semibold`}>
        {getInitials(contactName)}
        {!email.isRead && isReceived && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!email.isRead && isReceived ? 'font-bold' : 'font-semibold'} text-foreground`}>
            {contactName || 'Inconnu'}
          </span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">
            {formatEmailDate(email.createdAt)}
          </span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${!email.isRead && isReceived ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          {email.subject || 'Sans objet'}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {truncate(email.body, 80)}
        </p>
        <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}

function ComposeSheet({ open, onOpenChange, defaults }) {
  const sendMail = useSendMail();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open) {
      setTo(defaults?.to || '');
      setSubject(defaults?.subject || '');
      setBody(defaults?.body || '');
    }
  }, [open, defaults]);

  const canSend = to.trim() && subject.trim() && body.trim() && !sendMail.isPending;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await sendMail.mutateAsync({ to: to.trim(), subject: subject.trim(), body });
      toast.success('Email envoyé avec succès !');
      onOpenChange(false);
      setTo('');
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[440px] sm:max-w-[440px]" showCloseButton={false}>
        <SheetHeader className="border-b border-border">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle className="text-base">Nouveau email</SheetTitle>
              <SheetDescription className="mt-1 text-xs">
                Envoyez un email à un recruteur ou un candidat
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">À</label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@entreprise.ma"
              className="mt-1.5 bg-muted text-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Objet</label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
              className="mt-1.5 bg-muted text-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Votre message..."
              className="mt-1.5 bg-muted text-foreground resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <p className="text-[11px] text-muted-foreground">
            Un email sera aussi envoyé à l'adresse du destinataire
          </p>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="gap-1.5"
          >
            {sendMail.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Envoyer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReplySheet({ email, open, onOpenChange }) {
  const replyMail = useReplyMail();
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open) setBody('');
  }, [open]);

  const isReceived = email?.direction === 'received';

  const canSend = body.trim() && !!email && !replyMail.isPending;

  const handleSend = async () => {
    if (!canSend || !email) return;
    try {
      await replyMail.mutateAsync({ id: email._id, body });
      toast.success('Réponse envoyée avec succès !');
      onOpenChange(false);
      setBody('');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi de la réponse');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[440px] sm:max-w-[440px]" showCloseButton={false}>
        <SheetHeader className="border-b border-border">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle className="text-base">
                Répondre à {email ? (isReceived ? email.fromName : email.toName) : ''}
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs">
                Objet : {email?.subject || 'Sans objet'}
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail size={12} />
            <span className="truncate">{email ? (isReceived ? email.fromEmail : email.toEmail) : ''}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Votre réponse</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Écrivez votre réponse..."
              className="mt-1.5 bg-muted text-foreground resize-none"
            />
          </div>
          {email?.body && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Message original</p>
              <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                {email.body}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="gap-1.5"
          >
            {replyMail.isPending ? <Loader2 size={15} className="animate-spin" /> : <Reply size={15} />}
            Répondre
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EmailsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [box, setBox] = useState('inbox');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(searchParams.get('email') || null);
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);

  const markRead = useMarkMailRead();
  const markedReadRef = useRef(null);

  const uriSearch = useMemo(() => {
    const s = search.trim();
    return { type: box, page, limit: 30, ...(s ? { search: s } : {}) };
  }, [box, page, search]);

  const { data, isLoading } = useMailbox(uriSearch);
  const emails = data?.emails ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const pages = data?.pages ?? 1;

  const { data: selectedData } = useMail(selectedId);
  const selectedEmail = selectedData?.email;

  useEffect(() => {
    setPage(1);
  }, [box, search]);

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setSelectedId(urlEmail);
      if (searchParams.get('tab') !== 'emails') {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', 'emails');
          return next;
        }, { replace: true });
      }
    } else {
      setSelectedId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedEmail && selectedEmail.direction === 'received' && !selectedEmail.isRead) {
      const id = selectedEmail._id;
      if (markedReadRef.current !== id) {
        markedReadRef.current = id;
        markRead.mutate(id);
      }
    }
  }, [selectedEmail, markRead]);

  const handleOpen = (id) => {
    setSelectedId(id);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'emails');
      next.set('email', id);
      return next;
    }, { replace: true });
  };

  const handleClose = () => {
    setSelectedId(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('email');
      return next;
    }, { replace: true });
  };

  const isRecruiter = user?.role === 'recruiter';
  const emptyText = box === 'inbox'
    ? (isRecruiter ? 'Aucun email reçu de candidat pour le moment.' : 'Aucun email reçu de recruteur pour le moment.')
    : (isRecruiter ? 'Aucun email envoyé pour le moment.' : 'Aucun email envoyé pour le moment (vos candidatures envoyées apparaîtront ici).');

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => { setBox('inbox'); setSelectedId(null) }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                box === 'inbox'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Inbox size={15} />
              Boîte de réception
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setBox('sent'); setSelectedId(null) }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                box === 'sent'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Send size={15} />
              Envoyés
            </button>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setComposeOpen(true)}>
            <PenSquare size={15} />
            Nouveau email
          </Button>
        </div>

        <div className="relative sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 bg-muted pl-9 pr-4 rounded-lg text-foreground"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <EmailSkeleton />
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="p-4 bg-muted rounded-xl mb-4">
              <Mail size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {search.trim() ? 'Aucun résultat' : 'Aucun email'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search.trim() ? `Aucun email ne correspond à « ${search.trim()} »` : emptyText}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {emails.map(email => (
                <EmailListItem
                  key={email._id}
                  email={email}
                  onOpen={handleOpen}
                  isActive={selectedId === email._id}
                />
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Page {page} sur {pages} — {total} emails
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Préc.
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                  >
                    Suiv.
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={!!selectedEmail} onOpenChange={(open) => { if (!open) handleClose() }}>
        <SheetContent className="w-full sm:w-[440px] sm:max-w-[440px]" showCloseButton={false}>
          {selectedEmail ? (
            <>
              <SheetHeader className="border-b border-border">
                <div className="pr-10">
                  <SheetTitle className="text-base leading-snug break-words">
                    {selectedEmail.subject || 'Sans objet'}
                  </SheetTitle>
                  <SheetDescription className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className={`inline-flex items-center justify-center size-8 rounded-full ${avatarColorFor(selectedEmail.direction === 'received' ? selectedEmail.fromName : selectedEmail.toName)} text-white text-xs font-bold`}>
                        {getInitials(selectedEmail.direction === 'received' ? selectedEmail.fromName : selectedEmail.toName)}
                      </span>
                      <span className="font-semibold">
                        {selectedEmail.direction === 'received' ? selectedEmail.fromName : selectedEmail.toName}
                      </span>
                      {selectedEmail.direction === 'received' ? (
                        <Badge variant="secondary" className="ml-auto">Reçu</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-auto">Envoyé</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Mail size={12} className="text-muted-foreground" />
                      <span className="truncate">
                        {selectedEmail.direction === 'received'
                          ? (selectedEmail.fromUser?.email || selectedEmail.fromEmail || 'inconnu')
                          : (selectedEmail.toEmail || 'inconnu')}
                      </span>
                    </div>
                    {selectedEmail.companyName && (
                      <div>{selectedEmail.companyName}</div>
                    )}
                    <div>
                      {format(new Date(selectedEmail.createdAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </SheetDescription>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {selectedEmail.body || 'Aucun contenu.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 border-t border-border p-4">
                <Button
                  className="gap-1.5"
                  onClick={() => setReplyOpen(true)}
                  disabled={!selectedEmail.toEmail && !selectedEmail.fromEmail}
                >
                  <Reply size={15} />
                  Répondre
                </Button>
                {selectedEmail.direction === 'received' && selectedEmail.applicationId && (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      handleClose();
                      navigate(`/applications/${selectedEmail.applicationId}`);
                    }}
                  >
                    <ExternalLink size={15} />
                    Voir la candidature
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ComposeSheet open={composeOpen} onOpenChange={setComposeOpen} defaults={null} />
      <ReplySheet email={selectedEmail} open={replyOpen} onOpenChange={setReplyOpen} />
    </motion.div>
  );
}

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'messages');

  const openEmailId = searchParams.get('email');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'messages');
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'emails') {
        next.set('tab', 'emails');
      } else {
        next.delete('tab');
        next.delete('email');
      }
      return next;
    }, { replace: true });
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <div className="inline-flex items-center gap-1 rounded-xl bg-muted p-1 w-fit">
          <button
            onClick={() => changeTab('messages')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'messages'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare size={16} />
            Messages
          </button>
          <button
            onClick={() => changeTab('emails')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'emails'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail size={16} />
            Emails
            {openEmailId && activeTab === 'emails' && <ChevronRight size={12} />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'emails' ? <EmailsTab /> : <MessagesTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}