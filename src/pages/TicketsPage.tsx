import { useCallback, useEffect, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message, Timeline } from 'antd'
import type { TableProps } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createTicket, getAdminTicket, getAdminTickets, getTicket, getTicketHistory, getTickets, replyToTicket, updateTicketStatus } from '../api/tickets'
import type { TicketDTO, TicketHistoryDTO, TicketStatus } from '../api/tickets'
import { getCurrentUser } from '../api/users'
import type { PageDTO } from '../api/types'

const { Title, Text } = Typography
const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export function TicketsPage({ adminMode = false }: { adminMode?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()
  const [tickets, setTickets] = useState<PageDTO<TicketDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<TicketStatus | undefined>()
  const [sort, setSort] = useState('createdAt,desc')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const query = { page, size, sort, ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}), ...(status ? { status } : {}) }
      const result = adminMode ? await getAdminTickets(query) : await getTickets(query)
      setTickets(result)
    } catch { setError(true) } finally { setLoading(false) }
  }, [adminMode, page, debouncedSearch, size, sort, status])

  useEffect(() => { void Promise.resolve().then(loadTickets) }, [loadTickets])

  const columns: TableProps<TicketDTO>['columns'] = [
    { title: t('ticketSubject'), dataIndex: 'subject', key: 'subject', sorter: true, render: (subject: string, ticket) => <Link to={`${adminMode ? '/admin/tickets' : '/tickets'}/${encodeURIComponent(ticket.id)}`}>{subject}</Link> },
    { title: t('ticketStatus'), dataIndex: 'status', key: 'status', sorter: true, render: (value: TicketStatus) => <Tag color={value === 'OPEN' ? 'blue' : value === 'IN_PROGRESS' ? 'gold' : 'default'}>{t(`status_${value}`)}</Tag> },
    { title: t('updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', sorter: true, render: (value: string) => new Date(value).toLocaleString(i18nLocale()) },
  ]

  function onTableChange(pagination: { current?: number; pageSize?: number }, _filters: unknown, sorter: unknown) {
    if (pagination.pageSize && pagination.pageSize !== size) { setSize(pagination.pageSize); setPage(0) }
    else if (pagination.current) setPage(pagination.current - 1)
    const firstSorter = Array.isArray(sorter) ? sorter[0] : sorter
    if (firstSorter && typeof firstSorter === 'object' && 'field' in firstSorter && 'order' in firstSorter) {
      const item = firstSorter as { field?: string; order?: 'ascend' | 'descend' | null }
      if (item.field && item.order) setSort(`${String(item.field)},${item.order === 'ascend' ? 'asc' : 'desc'}`)
    }
  }

  async function submitTicket(values: { subject: string; description: string }) {
    setSaving(true)
    try {
      const created = await createTicket(values)
      messageApi.success(t('ticketCreated'))
      setCreateOpen(false); form.resetFields()
      navigate(`${adminMode ? '/admin/tickets' : '/tickets'}/${encodeURIComponent(created.id)}`)
    } catch { messageApi.error(t('requestFailed')) } finally { setSaving(false) }
  }

  return <>
    {contextHolder}
    <Card className="tickets-card">
      <div className="section-heading"><div><Text className="eyebrow">{t('support')}</Text><Title level={2}>{t('tickets')}</Title></div>{!adminMode && <Button type="primary" onClick={() => setCreateOpen(true)}>{t('newTicket')}</Button>}</div>
      <Space className="ticket-filters" wrap>
        <Input.Search allowClear placeholder={t('searchTickets')} value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} />
        <Select allowClear placeholder={t('filterStatus')} value={status} onChange={(value?: TicketStatus) => { setStatus(value); setPage(0) }} options={statuses.map((value) => ({ value, label: t(`status_${value}`) }))} />
      </Space>
      {error ? <Alert type="error" showIcon message={t('requestFailed')} action={<Button size="small" onClick={() => void loadTickets()}>{t('retry')}</Button>} /> : <Table<TicketDTO> rowKey="id" columns={columns} dataSource={tickets?.content ?? []} loading={loading} onChange={onTableChange} locale={{ emptyText: t('noTickets') }} pagination={{ current: page + 1, pageSize: size, total: tickets?.totalElements ?? 0, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => t('totalTickets', { count: total }) }} scroll={{ x: 620 }} />}
    </Card>
    {!adminMode && <Modal title={t('newTicket')} open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={submitTicket}>
        <Form.Item name="subject" label={t('ticketSubject')} rules={[{ required: true, whitespace: true, message: t('required') }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="description" label={t('ticketDescription')} rules={[{ required: true, whitespace: true, message: t('required') }]}><Input.TextArea rows={5} /></Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} block>{t('newTicket')}</Button>
      </Form>
    </Modal>}
  </>
}

function i18nLocale() { return document.documentElement.lang === 'fa' ? 'fa-IR' : 'en-US' }

export function TicketDetailPage() {
  const { t } = useTranslation()
  const { ticketId = '' } = useParams()
  const [isAdmin, setIsAdmin] = useState(false)
  const [ticket, setTicket] = useState<TicketDTO | null>(null)
  const [history, setHistory] = useState<TicketHistoryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const user = await getCurrentUser()
      const admin = user.userRole === 'ADMIN'
      setIsAdmin(admin)
      const [detail, historyPage] = await Promise.all([
        admin ? getAdminTicket(ticketId) : getTicket(ticketId),
        admin ? getTicketHistory(ticketId) : Promise.resolve(null),
      ])
      setTicket(detail)
      setHistory(historyPage?.content ?? [])
    } catch { setError(true) } finally { setLoading(false) }
  }, [ticketId])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  async function submitReply() {
    const text = reply.trim()
    if (!text) return
    setSaving(true)
    try { await replyToTicket(ticketId, text); setReply(''); messageApi.success(t('replySent')); await load() }
    catch { messageApi.error(t('requestFailed')) } finally { setSaving(false) }
  }

  async function changeStatus(status: TicketStatus) {
    setSaving(true)
    try { await updateTicketStatus(ticketId, status); messageApi.success(t('ticketUpdated')); await load() }
    catch { messageApi.error(t('requestFailed')) } finally { setSaving(false) }
  }

  if (loading) return <Card loading />
  if (error || !ticket) return <Alert type="error" showIcon message={t('requestFailed')} action={<Button onClick={() => void load()}>{t('retry')}</Button>} />

  return <>
    {contextHolder}
    <Card className="ticket-detail-card">
      <Link className="ant-btn ant-btn-link" to="/tickets">{t('backToTickets')}</Link>
      <div className="section-heading"><div><Title level={2}>{ticket.subject}</Title><Text type="secondary">{t('createdAt')}: {new Date(ticket.createdAt).toLocaleString(i18nLocale())}</Text></div>
        {isAdmin ? <Select aria-label={t('ticketStatus')} value={ticket.status} disabled={saving} onChange={(value: TicketStatus) => void changeStatus(value)} options={statuses.map((value) => ({ value, label: t(`status_${value}`) }))} /> : <Tag>{t(`status_${ticket.status}`)}</Tag>}
      </div>
      <Typography.Paragraph className="ticket-description">{ticket.description}</Typography.Paragraph>
      {isAdmin && <>
        <Title level={3}>{t('ticketHistory')}</Title>
        {history.length ? <Timeline items={history.map((entry) => ({ children: <div><Text strong>{t(entry.type === 'REPLY' ? 'adminReply' : `status_${entry.status ?? ticket.status}`)}</Text>{entry.message && <Typography.Paragraph>{entry.message}</Typography.Paragraph>}<Text type="secondary">{new Date(entry.createdAt).toLocaleString(i18nLocale())}</Text></div> }))} /> : <Typography.Paragraph type="secondary">{t('noTicketHistory')}</Typography.Paragraph>}
        <div className="reply-composer"><Input.TextArea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t('writeReply')} /><Button type="primary" loading={saving} disabled={!reply.trim()} onClick={() => void submitReply()}>{t('sendReply')}</Button></div>
      </>}
    </Card>
  </>
}
