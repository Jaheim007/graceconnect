import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Plus, ArrowLeft, Send, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';

const CATEGORIES = [
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'account', label: 'Account & Login' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'content', label: 'Content & Products' },
  { value: 'payout', label: 'Payouts & KYC' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/15 text-amber-600',
  in_progress: 'bg-blue-500/15 text-blue-600',
  resolved: 'bg-emerald-500/15 text-emerald-600',
  closed: 'bg-muted text-muted-foreground',
};

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('technical');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-support-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.from('support_tickets').insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        category,
        status: 'open',
        priority: 'normal',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Ticket submitted ✅' });
      setShowForm(false);
      setSubject('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: () => toast({ title: 'Error creating ticket', variant: 'destructive' }),
  });

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <SEOHead title="Support — Siteviral" description="Get help with your Siteviral account." />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Support</h1>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><ArrowLeft className="h-4 w-4" /> Back</> : <><Plus className="h-4 w-4" /> New Ticket</>}
        </Button>
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">Submit a support request</h2>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue in detail..." rows={5} maxLength={2000} />
          </div>
          <Button onClick={() => createTicket.mutate()} disabled={!subject.trim() || !message.trim() || createTicket.isPending}
            className="w-full gap-1.5">
            <Send className="h-4 w-4" /> Submit Ticket
          </Button>
        </motion.div>
      ) : (
        <>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}</div>
          ) : tickets.length === 0 ? (
            <EmptyState variant="generic" title="No support tickets" description="Need help? Create a ticket and we'll respond promptly."
              action={{ label: 'Create Ticket', onClick: () => setShowForm(true) }} />
          ) : (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                    </p>
                  </div>
                  <Badge className={`text-[10px] border-0 capitalize ${STATUS_COLORS[t.status] || STATUS_COLORS.open}`}>
                    {t.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
