'use client';
import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, CheckCircle, X, ChevronDown } from 'lucide-react';
import { supportApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const MOCK = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i}`, subject: ['Booking not confirmed', 'Payment deducted but no booking', 'Worker not arrived', 'Refund pending', 'App crashing'][i % 5],
  description: 'I have an issue with my recent booking. Please help me resolve this as soon as possible.',
  status: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'][i % 4],
  createdAt: new Date(Date.now() - i * 2 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  user: i % 3 !== 0 ? { name: ['Arjun Sharma', 'Priya Patel', 'Rahul Nayak'][i % 3], phone: `98765${i}432` } : null,
  worker: i % 3 === 0 ? { name: ['Suresh Kumar', 'Ramesh Das'][i % 2], phone: `77654${i}321` } : null,
  messages: [
    { id: `m${i}1`, senderType: 'USER', message: 'I need help with my booking.', createdAt: new Date(Date.now() - i * 2 * 86400000).toISOString() },
    { id: `m${i}2`, senderType: 'ADMIN', message: 'We are looking into this, please wait.', createdAt: new Date(Date.now() - i * 86400000).toISOString() },
  ]
}));

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportApi.list(status || undefined, page);
      setTickets(res.data?.data?.tickets || []);
      setTotal(res.data?.data?.total || 0);
    } catch {
      setTickets(MOCK.filter(t => !status || t.status === status));
      setTotal(48);
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action: 'resolve' | 'close', id: string) => {
    try {
      action === 'resolve' ? await supportApi.resolve(id) : await supportApi.close(id);
      toast.success(`Ticket ${action}d`);
      load();
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: action === 'resolve' ? 'RESOLVED' : 'CLOSED' }));
    } catch { toast.error('Failed'); }
  };

  const reporter = (t: any) => t.user || t.worker;
  const reporterType = (t: any) => t.user ? 'Customer' : 'Worker';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-44">
          <Select value={status} onChange={(e: any) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
        <p className="text-sm text-slate-500 ml-auto">{total} tickets</p>
      </div>

      <Card>
        {loading ? <Spinner /> : tickets.length === 0 ? (
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No tickets found" />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Reporter</Th>
                  <Th>Type</Th>
                  <Th>Subject</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {tickets.map(t => (
                  <Tr key={t.id} onClick={() => setSelected(t)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={reporter(t)?.name} size="sm" />
                        <span className="font-medium text-slate-700">{reporter(t)?.name || 'Unknown'}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.user ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {reporterType(t)}
                      </span>
                    </Td>
                    <Td>
                      <p className="text-sm text-slate-700 max-w-xs truncate">{t.subject}</p>
                    </Td>
                    <Td><Badge label={t.status} /></Td>
                    <Td className="text-xs text-slate-500">{formatDateTime(t.createdAt)}</Td>
                    <Td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {t.status === 'OPEN' && (
                          <Button size="sm" variant="primary" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleAction('resolve', t.id)}>Resolve</Button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleAction('resolve', t.id)}>Resolve</Button>
                        )}
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(t.status) && (
                          <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5" />}
                            onClick={() => handleAction('close', t.id)}>Close</Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Ticket Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800">{selected.subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge label={selected.status} />
                  <span className="text-xs text-slate-400">{formatDateTime(selected.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar name={reporter(selected)?.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{reporter(selected)?.name}</p>
                  <p className="text-xs text-slate-400">{reporterType(selected)} · {reporter(selected)?.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">{selected.description}</p>
            </div>

            {/* Messages */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Conversation</p>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {selected.messages?.map((m: any) => (
                  <div key={m.id} className={`flex ${m.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                      m.senderType === 'ADMIN'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                    }`}>
                      <p>{m.message}</p>
                      <p className={`text-xs mt-1 ${m.senderType === 'ADMIN' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              {['OPEN', 'IN_PROGRESS'].includes(selected.status) && (
                <Button variant="success" icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => handleAction('resolve', selected.id)}>Mark Resolved</Button>
              )}
              {['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(selected.status) && (
                <Button variant="secondary" icon={<X className="w-4 h-4" />}
                  onClick={() => handleAction('close', selected.id)}>Close Ticket</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
