import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, Card, Descriptions, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { TableProps } from 'antd'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { PageDTO } from '../api/types'
import { deleteUser, getUser, getUsers, updateUserRole } from '../api/users'
import type { UserDTO, UserRole, UserStatus } from '../api/users'
import { cancelAdminSubscription, getAdminSubscription, getAdminSubscriptions } from '../api/subscriptions'
import type { SubscriptionDTO, SubscriptionStatus } from '../api/subscriptions'
import { getAdminUsageHistory } from '../api/usage'
import type { UsageRecordDTO } from '../api/usage'
import { getAdminTransaction, getAdminTransactions, updateAdminTransactionStatus } from '../api/transactions'
import type { TransactionDTO, TransactionStatus, TransactionType } from '../api/transactions'
import { createAdminPlan, deactivateAdminPlan, getAdminPlan, getPlanSubscriptions, getPlans, updateAdminPlan } from '../api/plans'
import type { PlanDTO, PlanRequest } from '../api/plans'

const { Title, Text } = Typography
const pageSizes = [10, 20, 50]

function useAdminMessage() {
  const [api, contextHolder] = message.useMessage()
  const { t } = useTranslation()
  return { api, contextHolder, t }
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="feature-card"><div className="section-heading"><div><Text className="eyebrow">Administration</Text><Title level={2}>{title}</Title></div></div>{children}</Card>
}

function AdminTable<T extends object>({ data, columns, page, size, total, loading, onPage, empty }: {
  data: T[]; columns: TableProps<T>['columns']; page: number; size: number; total: number; loading: boolean
  onPage: (page: number, size: number) => void; empty: string
}) {
  return <Table<T> rowKey="id" columns={columns} dataSource={data} loading={loading} locale={{ emptyText: <Empty description={empty} /> }} pagination={{ current: page + 1, pageSize: size, total, showSizeChanger: true, pageSizeOptions: pageSizes, onChange: (current, nextSize) => onPage(nextSize === size ? current - 1 : 0, nextSize) }} scroll={{ x: 800 }} />
}

export function AdminUsersPage() {
  const { api, contextHolder, t } = useAdminMessage()
  const [page, setPage] = useState(0); const [size, setSize] = useState(10)
  const [search, setSearch] = useState(''); const debounced = useDebouncedValue(search)
  const [role, setRole] = useState<UserRole>(); const [status, setStatus] = useState<UserStatus>()
  const [rows, setRows] = useState<PageDTO<UserDTO> | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false)
  const [detail, setDetail] = useState<UserDTO | null>(null)
  const load = useCallback(async () => { setLoading(true); setError(false); try { setRows(await getUsers({ page, size, sort: 'createdAt,desc', ...(debounced.trim() ? { search: debounced.trim() } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}) })) } catch { setError(true) } finally { setLoading(false) } }, [page, size, debounced, role, status])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const columns: TableProps<UserDTO>['columns'] = [
    { title: t('email'), dataIndex: 'email', key: 'email', render: (value: string, user) => <Button type="link" onClick={async () => { try { setDetail(await getUser(user.id)) } catch { api.error(t('requestFailed')) } }}>{value}</Button> },
    { title: t('firstName'), dataIndex: 'firstName', key: 'firstName' }, { title: t('lastName'), dataIndex: 'lastName', key: 'lastName' },
    { title: t('role'), dataIndex: 'userRole', key: 'userRole', render: (value: UserRole, user) => <Select aria-label={t('role')} value={value} options={(['USER', 'ADMIN'] as UserRole[]).map((v) => ({ value: v, label: t(v === 'ADMIN' ? 'adminRole' : 'users') }))} onChange={async (next: UserRole) => { try { await updateUserRole(user.id, next); api.success(t('userUpdated')); void load() } catch { api.error(t('requestFailed')) } }} /> },
    { title: t('status'), dataIndex: 'status', key: 'status', render: (value: UserStatus) => <Tag>{t(`userStatus_${value}`)}</Tag> },
    { title: t('actions'), key: 'actions', render: (_: unknown, user) => <Popconfirm title={t('deleteUserConfirm')} onConfirm={async () => { try { await deleteUser(user.id); api.success(t('userDeleted')); if (rows?.content.length === 1 && page > 0) setPage(page - 1); else void load() } catch { api.error(t('requestFailed')) } }}><Button danger type="link">{t('delete')}</Button></Popconfirm> },
  ]
  return <>{contextHolder}<Panel title={t('userManagement')}><Space wrap className="admin-filters"><Input.Search allowClear placeholder={t('searchUsers')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} /><Select allowClear placeholder={t('role')} value={role} onChange={(v?: UserRole) => { setRole(v); setPage(0) }} options={(['USER', 'ADMIN'] as UserRole[]).map((v) => ({ value: v, label: t(v === 'ADMIN' ? 'adminRole' : 'users') }))} /><Select allowClear placeholder={t('status')} value={status} onChange={(v?: UserStatus) => { setStatus(v); setPage(0) }} options={(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as UserStatus[]).map((v) => ({ value: v, label: t(`userStatus_${v}`) }))} /></Space>{error ? <Retry onRetry={() => void load()} /> : <AdminTable data={rows?.content ?? []} columns={columns} page={page} size={size} total={rows?.totalElements ?? 0} loading={loading} onPage={(p, s) => { setPage(p); setSize(s) }} empty={t('noUsers')} />}<Modal title={t('userDetails')} open={Boolean(detail)} onCancel={() => setDetail(null)} footer={null}>{detail && <Descriptions column={1} items={[['email', detail.email], ['firstName', detail.firstName], ['lastName', detail.lastName], ['role', t(detail.userRole === 'ADMIN' ? 'adminRole' : 'users')], ['status', t(`userStatus_${detail.status}`)], ['createdAt', new Date(detail.createdAt).toLocaleString()]].map(([label, value]) => ({ key: label, label: t(label), children: value }))} />}</Modal></Panel></>
}

export function AdminSubscriptionsPage() {
  const { api, contextHolder, t } = useAdminMessage()
  const [page, setPage] = useState(0); const [size, setSize] = useState(10); const [userId, setUserId] = useState(''); const [planId, setPlanId] = useState(''); const [status, setStatus] = useState<SubscriptionStatus>()
  const [rows, setRows] = useState<PageDTO<SubscriptionDTO> | null>(null); const [detail, setDetail] = useState<SubscriptionDTO | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false)
  const load = useCallback(async () => { setLoading(true); setError(false); try { setRows(await getAdminSubscriptions({ page, size, sort: 'startDate,desc', ...(userId.trim() ? { userId: userId.trim() } : {}), ...(planId.trim() ? { planId: planId.trim() } : {}), ...(status ? { status } : {}) })) } catch { setError(true) } finally { setLoading(false) } }, [page, size, userId, planId, status])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const columns: TableProps<SubscriptionDTO>['columns'] = [
    { title: t('userId'), dataIndex: 'userId', key: 'userId' }, { title: t('planId'), dataIndex: 'planId', key: 'planId' }, { title: t('pricePaid'), dataIndex: 'pricePaid', key: 'pricePaid', render: (v: number) => v.toLocaleString() },
    { title: t('startDate'), dataIndex: 'startDate', key: 'startDate', render: (v: string) => new Date(v).toLocaleDateString() }, { title: t('endDate'), dataIndex: 'endDate', key: 'endDate', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: t('status'), dataIndex: 'status', key: 'status', render: (v: SubscriptionStatus) => <Tag>{t(`subscription_${v}`)}</Tag> },
    { title: t('remainingCredit'), dataIndex: 'remainingCredit', key: 'remainingCredit', render: (v: number) => v.toLocaleString() },
    { title: t('actions'), key: 'actions', render: (_: unknown, item) => <Space><Button type="link" onClick={async () => { try { setDetail(await getAdminSubscription(item.id)) } catch { api.error(t('requestFailed')) } }}>{t('details')}</Button>{item.status === 'ACTIVE' && <Popconfirm title={t('cancelSubscriptionConfirm')} onConfirm={async () => { try { await cancelAdminSubscription(item.id); api.success(t('subscriptionCancelled')); void load() } catch { api.error(t('requestFailed')) } }}><Button danger type="link">{t('cancel')}</Button></Popconfirm>}</Space> },
  ]
  return <>{contextHolder}<Panel title={t('subscriptionManagement')}><Space wrap className="admin-filters"><Input allowClear placeholder={t('userId')} value={userId} onChange={(e) => { setUserId(e.target.value); setPage(0) }} /><Input allowClear placeholder={t('planId')} value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(0) }} /><Select allowClear placeholder={t('status')} value={status} onChange={(v?: SubscriptionStatus) => { setStatus(v); setPage(0) }} options={(['ACTIVE', 'EXPIRED', 'CANCELLED'] as SubscriptionStatus[]).map((v) => ({ value: v, label: t(`subscription_${v}`) }))} /></Space>{error ? <Retry onRetry={() => void load()} /> : <AdminTable data={rows?.content ?? []} columns={columns} page={page} size={size} total={rows?.totalElements ?? 0} loading={loading} onPage={(p, s) => { setPage(p); setSize(s) }} empty={t('noSubscriptions')} />}<DetailModal title={t('subscriptionDetails')} value={detail} onClose={() => setDetail(null)} labels={['id', 'userId', 'planId', 'pricePaid', 'startDate', 'endDate', 'status', 'remainingCredit']} translate={t} /></Panel></>
}

export function AdminUsagePage() {
  const { t } = useTranslation(); const [page, setPage] = useState(0); const [size, setSize] = useState(10); const [userId, setUserId] = useState(''); const [model, setModel] = useState('')
  const [rows, setRows] = useState<PageDTO<UsageRecordDTO> | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false)
  const load = useCallback(async () => { setLoading(true); setError(false); try { setRows(await getAdminUsageHistory({ page, size, sort: 'timestamp,desc', ...(userId.trim() ? { userId: userId.trim() } : {}), ...(model.trim() ? { model: model.trim() } : {}) })) } catch { setError(true) } finally { setLoading(false) } }, [page, size, userId, model])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const columns: TableProps<UsageRecordDTO>['columns'] = [
    { title: t('userId'), dataIndex: 'userId', key: 'userId' }, { title: t('model'), dataIndex: 'model', key: 'model' }, { title: t('inputTokens'), dataIndex: 'inputTokens', key: 'inputTokens', render: (v: number) => v.toLocaleString() }, { title: t('outputTokens'), dataIndex: 'outputTokens', key: 'outputTokens', render: (v: number) => v.toLocaleString() }, { title: t('totalTokens'), dataIndex: 'totalTokens', key: 'totalTokens', render: (v: number) => v.toLocaleString() }, { title: t('chargedAmount'), dataIndex: 'chargedAmount', key: 'chargedAmount', render: (v: number) => v.toLocaleString() }, { title: t('timestamp'), dataIndex: 'timestamp', key: 'timestamp', render: (v: string) => new Date(v).toLocaleString() },
  ]
  return <Panel title={t('usageManagement')}><Space wrap className="admin-filters"><Input allowClear placeholder={t('userId')} value={userId} onChange={(e) => { setUserId(e.target.value); setPage(0) }} /><Input allowClear placeholder={t('model')} value={model} onChange={(e) => { setModel(e.target.value); setPage(0) }} /></Space>{error ? <Retry onRetry={() => void load()} /> : <AdminTable data={rows?.content ?? []} columns={columns} page={page} size={size} total={rows?.totalElements ?? 0} loading={loading} onPage={(p, s) => { setPage(p); setSize(s) }} empty={t('noAdminUsage')} />}</Panel>
}

export function AdminTransactionsPage() {
  const { api, contextHolder, t } = useAdminMessage(); const [page, setPage] = useState(0); const [size, setSize] = useState(10); const [userId, setUserId] = useState(''); const [type, setType] = useState<TransactionType>(); const [status, setStatus] = useState<TransactionStatus>()
  const [rows, setRows] = useState<PageDTO<TransactionDTO> | null>(null); const [detail, setDetail] = useState<TransactionDTO | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false)
  const load = useCallback(async () => { setLoading(true); setError(false); try { setRows(await getAdminTransactions({ page, size, sort: 'createdAt,desc', ...(userId.trim() ? { userId: userId.trim() } : {}), ...(type ? { type } : {}), ...(status ? { status } : {}) })) } catch { setError(true) } finally { setLoading(false) } }, [page, size, userId, type, status])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const columns: TableProps<TransactionDTO>['columns'] = [
    { title: t('userId'), dataIndex: 'userId', key: 'userId' }, { title: t('transactionType'), dataIndex: 'type', key: 'type', render: (v: TransactionType) => t(`transactionType_${v}`) }, { title: t('amount'), dataIndex: 'amount', key: 'amount', render: (v: number, row) => `${v.toLocaleString()} ${row.currency}` }, { title: t('reference'), dataIndex: 'reference', key: 'reference' }, { title: t('createdAt'), dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
    { title: t('status'), dataIndex: 'status', key: 'status', render: (v: TransactionStatus, row) => <Select aria-label={t('status')} value={v} options={(['PENDING', 'SUCCESS', 'FAILED'] as TransactionStatus[]).map((state) => ({ value: state, label: t(`transaction_${state}`) }))} onChange={async (next: TransactionStatus) => { try { await updateAdminTransactionStatus(row.id, next); api.success(t('transactionUpdated')); void load() } catch { api.error(t('requestFailed')) } }} /> },
    { title: t('actions'), key: 'actions', render: (_: unknown, row) => <Button type="link" onClick={async () => { try { setDetail(await getAdminTransaction(row.id)) } catch { api.error(t('requestFailed')) } }}>{t('details')}</Button> },
  ]
  return <>{contextHolder}<Panel title={t('transactionManagement')}><Space wrap className="admin-filters"><Input allowClear placeholder={t('userId')} value={userId} onChange={(e) => { setUserId(e.target.value); setPage(0) }} /><Select allowClear placeholder={t('transactionType')} value={type} onChange={(v?: TransactionType) => { setType(v); setPage(0) }} options={(['SUBSCRIPTION_PURCHASE', 'CREDIT_PURCHASE'] as TransactionType[]).map((v) => ({ value: v, label: t(`transactionType_${v}`) }))} /><Select allowClear placeholder={t('status')} value={status} onChange={(v?: TransactionStatus) => { setStatus(v); setPage(0) }} options={(['PENDING', 'SUCCESS', 'FAILED'] as TransactionStatus[]).map((v) => ({ value: v, label: t(`transaction_${v}`) }))} /></Space>{error ? <Retry onRetry={() => void load()} /> : <AdminTable data={rows?.content ?? []} columns={columns} page={page} size={size} total={rows?.totalElements ?? 0} loading={loading} onPage={(p, s) => { setPage(p); setSize(s) }} empty={t('noTransactions')} />}<DetailModal title={t('transactionDetails')} value={detail} onClose={() => setDetail(null)} labels={['id', 'userId', 'type', 'amount', 'currency', 'status', 'reference', 'createdAt']} translate={t} /></Panel></>
}

export function AdminPlansPage() {
  const { api, contextHolder, t } = useAdminMessage(); const [page, setPage] = useState(0); const [size, setSize] = useState(10); const [rows, setRows] = useState<PageDTO<PlanDTO> | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false)
  const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState<PlanDTO | null>(null); const [saving, setSaving] = useState(false); const [form] = Form.useForm<PlanRequest>()
  const [selectedPlan, setSelectedPlan] = useState<PlanDTO | null>(null); const [subs, setSubs] = useState<PageDTO<SubscriptionDTO> | null>(null); const [subsPage, setSubsPage] = useState(0); const [subsLoading, setSubsLoading] = useState(false)
  const load = useCallback(async () => { setLoading(true); setError(false); try { setRows(await getPlans(page, size)) } catch { setError(true) } finally { setLoading(false) } }, [page, size])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const columns: TableProps<PlanDTO>['columns'] = [
    { title: t('planName'), dataIndex: 'name', key: 'name' }, { title: t('price'), dataIndex: 'price', key: 'price', render: (v: number) => v.toLocaleString() }, { title: t('durationDays'), dataIndex: 'duration', key: 'duration' }, { title: t('creditLimit'), dataIndex: 'creditLimit', key: 'creditLimit', render: (v: number) => v.toLocaleString() }, { title: t('status'), dataIndex: 'active', key: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{t(v ? 'active' : 'inactive')}</Tag> },
    { title: t('actions'), key: 'actions', render: (_: unknown, plan) => <Space wrap><Button type="link" onClick={async () => { try { const value = await getAdminPlan(plan.id); setEditing(value); form.setFieldsValue({ name: value.name, price: value.price, duration: value.duration, creditLimit: value.creditLimit, active: value.active }); setFormOpen(true) } catch { api.error(t('requestFailed')) } }}>{t('edit')}</Button><Button type="link" onClick={async () => { setSelectedPlan(plan); setSubsPage(0); setSubsLoading(true); try { setSubs(await getPlanSubscriptions(plan.id, 0, 10)) } catch { api.error(t('requestFailed')) } finally { setSubsLoading(false) } }}>{t('viewSubscriptions')}</Button>{plan.active && <Popconfirm title={t('deactivatePlanConfirm')} onConfirm={async () => { try { await deactivateAdminPlan(plan.id); api.success(t('planDeactivated')); void load() } catch { api.error(t('requestFailed')) } }}><Button type="link" danger>{t('deactivate')}</Button></Popconfirm>}</Space> },
  ]
  async function savePlan(values: PlanRequest) { setSaving(true); try { if (editing) await updateAdminPlan(editing.id, values); else await createAdminPlan(values); api.success(t(editing ? 'planUpdated' : 'planCreated')); setFormOpen(false); setEditing(null); form.resetFields(); void load() } catch { api.error(t('requestFailed')) } finally { setSaving(false) } }
  return <>{contextHolder}<Panel title={t('planManagement')}><div className="section-heading"><span /> <Button type="primary" onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue({ active: true }); setFormOpen(true) }}>{t('createPlan')}</Button></div>{error ? <Retry onRetry={() => void load()} /> : <AdminTable data={rows?.content ?? []} columns={columns} page={page} size={size} total={rows?.totalElements ?? 0} loading={loading} onPage={(p, s) => { setPage(p); setSize(s) }} empty={t('noPlans')} />}</Panel>
    <Modal title={t(editing ? 'editPlan' : 'createPlan')} open={formOpen} onCancel={() => setFormOpen(false)} footer={null} destroyOnHidden><Form form={form} layout="vertical" onFinish={savePlan}><Form.Item name="name" label={t('planName')} rules={[{ required: true, whitespace: true }]}><Input maxLength={120} /></Form.Item><Form.Item name="price" label={t('price')} rules={[{ required: true }]}><InputNumber min={0} precision={2} className="admin-number" /></Form.Item><Form.Item name="duration" label={t('durationDays')} rules={[{ required: true }]}><InputNumber min={1} precision={0} className="admin-number" /></Form.Item><Form.Item name="creditLimit" label={t('creditLimit')} rules={[{ required: true }]}><InputNumber min={0} precision={2} className="admin-number" /></Form.Item><Form.Item name="active" label={t('status')} rules={[{ required: true }]}><Select options={[{ value: true, label: t('active') }, { value: false, label: t('inactive') }]} /></Form.Item><Button type="primary" htmlType="submit" loading={saving} block>{t('save')}</Button></Form></Modal>
    <Modal title={selectedPlan ? `${t('subscriptionsFor')} ${selectedPlan.name}` : ''} open={Boolean(selectedPlan)} onCancel={() => setSelectedPlan(null)} footer={null} width={800}><Table<SubscriptionDTO> rowKey="id" loading={subsLoading} dataSource={subs?.content ?? []} pagination={{ current: subsPage + 1, pageSize: 10, total: subs?.totalElements ?? 0, onChange: async (current) => { const next = current - 1; setSubsPage(next); if (selectedPlan) { setSubsLoading(true); try { setSubs(await getPlanSubscriptions(selectedPlan.id, next, 10)) } catch { api.error(t('requestFailed')) } finally { setSubsLoading(false) } } } }} columns={[{ title: t('userId'), dataIndex: 'userId' }, { title: t('status'), dataIndex: 'status', render: (v: SubscriptionStatus) => t(`subscription_${v}`) }, { title: t('pricePaid'), dataIndex: 'pricePaid', render: (v: number) => v.toLocaleString() }, { title: t('endDate'), dataIndex: 'endDate', render: (v: string) => new Date(v).toLocaleDateString() }]} /></Modal>
  </>
}

function Retry({ onRetry }: { onRetry: () => void }) { const { t } = useTranslation(); return <Alert type="error" showIcon message={t('requestFailed')} action={<Button size="small" onClick={onRetry}>{t('retry')}</Button>} /> }

function DetailModal<T extends object>({ title, value, onClose, labels, translate }: { title: string; value: T | null; onClose: () => void; labels: string[]; translate: (key: string) => string }) {
  if (!value) return null
  const record = value as Record<string, unknown>
  return <Modal title={title} open onCancel={onClose} footer={null}><Descriptions column={1} items={labels.filter((key) => record[key] !== undefined).map((key) => ({ key, label: translate(key), children: String(record[key]) }))} /></Modal>
}
