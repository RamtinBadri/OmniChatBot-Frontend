import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Form, Input, List, Modal, Pagination, Popconfirm, Select, Space, Spin, Typography, message } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { archiveConversation, createConversation, deleteConversation, getConversation, getConversations, getMessages, renameConversation, sendMessage, updateConversationModel } from '../api/conversations'
import type { ConversationDTO, ConversationStatus, MessageDTO } from '../api/conversations'
import { getCompleteModelCatalog } from '../api/models'
import type { CompleteModelCatalogDTO } from '../api/models'

const { Title, Text, Paragraph } = Typography

export function ConversationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<ConversationDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<ConversationStatus | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [catalog, setCatalog] = useState<CompleteModelCatalogDTO | null>(null)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const result = await getConversations({ page, size, sort: 'updatedAt,desc', ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}), ...(status ? { status } : {}) })
      setItems(result.content)
      setTotal(result.totalElements)
    } catch { setError(true) } finally { setLoading(false) }
  }, [page, size, debouncedSearch, status])

  useEffect(() => { void Promise.resolve().then(load) }, [load])
  useEffect(() => {
    let active = true
    getCompleteModelCatalog().then((result) => { if (active) setCatalog(result) }).catch(() => { if (active) messageApi.error(t('requestFailed')) })
    return () => { active = false }
  }, [messageApi, t])

  async function submit(values: { title: string; model: string }) {
    if (!catalog) return
    setCreating(true)
    try {
      const conversation = await createConversation(values.title, values.model || catalog.defaultModel)
      setCreateOpen(false)
      form.resetFields()
      navigate(`/conversations/${encodeURIComponent(conversation.id)}`)
    } catch { messageApi.error(t('requestFailed')) } finally { setCreating(false) }
  }

  return <>
    {contextHolder}
    <Card className="feature-card">
      <div className="section-heading"><div><Text className="eyebrow">{t('workspace')}</Text><Title level={2}>{t('conversations')}</Title></div><Button type="primary" onClick={() => setCreateOpen(true)}>{t('newConversation')}</Button></div>
      <Space wrap className="conversation-filters">
        <Input.Search allowClear placeholder={t('searchConversations')} value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} />
        <Select allowClear placeholder={t('filterStatus')} value={status} onChange={(value?: ConversationStatus) => { setStatus(value); setPage(0) }} options={[{ value: 'ACTIVE', label: t('active') }, { value: 'ARCHIVED', label: t('archived') }]} />
      </Space>
      {error ? <Alert type="error" showIcon message={t('requestFailed')} action={<Button size="small" onClick={() => void load()}>{t('retry')}</Button>} /> : loading && !items.length ? <Spin /> : items.length ? <>
        <List dataSource={items} renderItem={(item) => <List.Item actions={[
          item.status === 'ACTIVE' ? <Button key="archive" type="link" onClick={async () => { try { await archiveConversation(item.id); await load() } catch { messageApi.error(t('requestFailed')) } }}>{t('archive')}</Button> : null,
          <Popconfirm key="delete" title={t('deleteConversationConfirm')} onConfirm={async () => { try { await deleteConversation(item.id); await load() } catch { messageApi.error(t('requestFailed')) } }}><Button type="link" danger>{t('delete')}</Button></Popconfirm>,
        ]}>
          <List.Item.Meta title={<a onClick={() => navigate(`/conversations/${encodeURIComponent(item.id)}`)}>{item.title}</a>} description={<>{item.model} · {t(item.status === 'ACTIVE' ? 'active' : 'archived')} · {new Date(item.updatedAt).toLocaleString()}</>} />
        </List.Item>} />
        <Pagination className="plans-pagination" current={page + 1} pageSize={size} total={total} showSizeChanger pageSizeOptions={[10, 20, 50]} onChange={(current, nextSize) => { setPage(nextSize === size ? current - 1 : 0); setSize(nextSize) }} />
      </> : <Empty description={t('noConversations')} />}
    </Card>
    <Modal title={t('newConversation')} open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ model: catalog?.defaultModel }}><Form.Item name="title" label={t('conversationTitle')} rules={[{ required: true, whitespace: true, message: t('required') }]}><Input maxLength={200} /></Form.Item><Form.Item name="model" label={t('chooseModel')} rules={[{ required: true, message: t('required') }]}><Select showSearch optionFilterProp="label" loading={!catalog} options={catalog?.models.map((model) => ({ value: model.id, label: `${model.name}${model.defaultModel ? ` (${t('defaultModel')})` : ''}` }))} /></Form.Item><Button className="form-submit" type="primary" htmlType="submit" loading={creating} disabled={!catalog} block>{t('create')}</Button></Form>
    </Modal>
  </>
}

export function ConversationDetailPage() {
  const { t } = useTranslation()
  const { conversationId = '' } = useParams()
  const [conversation, setConversation] = useState<ConversationDTO | null>(null)
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)
  const [animatedMessageIds, setAnimatedMessageIds] = useState<string[]>([])
  const [modelSaving, setModelSaving] = useState(false)
  const [catalog, setCatalog] = useState<CompleteModelCatalogDTO | null>(null)
  const [content, setContent] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const [detail, pageData] = await Promise.all([getConversation(conversationId), getMessages(conversationId, page, 30)])
      setConversation(detail)
      setMessages(pageData.content)
      setTotal(pageData.totalElements)
    } catch { setError(true) } finally { setLoading(false) }
  }, [conversationId, page])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  useEffect(() => {
    let active = true
    getCompleteModelCatalog().then((result) => { if (active) setCatalog(result) }).catch(() => { if (active) messageApi.error(t('requestFailed')) })
    return () => { active = false }
  }, [messageApi, t])

  async function send() {
    const text = content.trim()
    if (!text || !conversation || sending) return
    setSending(true)
    const optimisticId = `pending-${Date.now()}`
    if (page === 0) {
      setMessages((current) => [...current, {
        id: optimisticId,
        conversationId: conversation.id,
        role: 'USER',
        content: text,
        createdAt: new Date().toISOString(),
      }])
      setTotal((current) => current + 1)
      setAnimatedMessageIds((current) => [...current, optimisticId])
    }
    try {
      const exchange = await sendMessage(conversation.id, text)
      setContent('')
      if (page !== 0) setPage(0)
      else {
        setMessages((current) => [...current.filter((item) => item.id !== optimisticId), exchange.userMessage, exchange.assistantMessage])
        setTotal((current) => current + 1)
        setAnimatedMessageIds((current) => [...current.filter((id) => id !== optimisticId), exchange.userMessage.id, exchange.assistantMessage.id])
      }
    } catch {
      if (page === 0) {
        setMessages((current) => current.filter((item) => item.id !== optimisticId))
        setTotal((current) => Math.max(0, current - 1))
        setAnimatedMessageIds((current) => current.filter((id) => id !== optimisticId))
      }
      messageApi.error(t('requestFailed'))
    } finally { setSending(false) }
  }

  async function rename(values: { title: string }) {
    try { await renameConversation(conversationId, values.title); setRenameOpen(false); await load() } catch { messageApi.error(t('requestFailed')) }
  }

  async function changeModel(model: string) {
    if (!conversation || model === conversation.model) return
    setModelSaving(true)
    try {
      const updated = await updateConversationModel(conversationId, model)
      setConversation(updated)
      messageApi.success(t('modelUpdated'))
    } catch { messageApi.error(t('requestFailed')) } finally { setModelSaving(false) }
  }

  if (error) return <Alert type="error" showIcon message={t('requestFailed')} action={<Button onClick={() => void load()}>{t('retry')}</Button>} />
  if (loading && !conversation) return <Card loading />
  if (!conversation) return null

  return <>
    {contextHolder}
    <Card className="feature-card conversation-detail-card">
      <div className="section-heading conversation-heading"><div><Text className="eyebrow">{conversation.model}</Text><Title level={2}>{conversation.title}</Title></div><Space wrap><label htmlFor="conversation-model">{t('currentModel')}</label><Select id="conversation-model" aria-label={t('currentModel')} className="model-selector" showSearch optionFilterProp="label" value={conversation.model} loading={!catalog} disabled={modelSaving || conversation.status !== 'ACTIVE'} onChange={(value: string) => void changeModel(value)} options={catalog?.models.map((model) => ({ value: model.id, label: model.name })) ?? [{ value: conversation.model, label: conversation.model }]} /><Button onClick={() => { renameForm.setFieldValue('title', conversation.title); setRenameOpen(true) }}>{t('rename')}</Button><Button><Link to="/conversations">{t('backToConversations')}</Link></Button></Space></div>
      <div className="message-list">{loading ? <Spin /> : messages.length ? messages.map((item) => <article className={`message-bubble message-${item.role.toLowerCase()}${animatedMessageIds.includes(item.id) ? ' message-enter' : ''}`} key={item.id} onAnimationEnd={() => setAnimatedMessageIds((current) => current.filter((id) => id !== item.id))}><Text strong>{t(`role_${item.role}`)}</Text><Paragraph className="message-content" dir="auto">{item.content}</Paragraph><Text type="secondary">{new Date(item.createdAt).toLocaleString()}</Text></article>) : <Empty description={t('noMessages')} />}{sending && <div className="message-bubble message-assistant assistant-typing" role="status" aria-live="polite" aria-label={t('assistantThinking')}><span className="typing-dots" aria-hidden="true"><span /><span /><span /></span><span className="typing-label">{t('assistantThinking')}</span></div>}</div>
      <Pagination className="plans-pagination" current={page + 1} pageSize={30} total={total} disabled={sending} onChange={(current) => setPage(current - 1)} />
      {conversation.status === 'ACTIVE' ? <div className="composer"><Input.TextArea value={content} onChange={(event) => setContent(event.target.value)} rows={3} placeholder={t('messagePlaceholder')} onPressEnter={(event) => { if (!event.shiftKey) { event.preventDefault(); void send() } }} /><Button type="primary" loading={sending} disabled={!content.trim()} onClick={() => void send()}>{t('send')}</Button></div> : <Alert type="info" message={t('conversationArchived')} />}
    </Card>
    <Modal title={t('rename')} open={renameOpen} onCancel={() => setRenameOpen(false)} footer={null}><Form form={renameForm} layout="vertical" onFinish={rename}><Form.Item name="title" label={t('conversationTitle')} rules={[{ required: true, whitespace: true, message: t('required') }]}><Input maxLength={200} /></Form.Item><Button type="primary" htmlType="submit" block>{t('save')}</Button></Form></Modal>
  </>
}
