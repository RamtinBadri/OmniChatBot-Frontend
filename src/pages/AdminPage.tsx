import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Col, DatePicker, Empty, Row, Skeleton, Statistic, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getKpiSummary, getKpiUsage } from '../api/kpi'
import type { KpiSummaryDTO, KpiUsageDTO } from '../api/kpi'

const { RangePicker } = DatePicker
const { Title, Text } = Typography

const summaryKeys: (keyof KpiSummaryDTO)[] = ['totalUsers', 'activeUsers', 'subscribedUsers', 'totalRequests', 'successfulRequests', 'failedRequests', 'totalTokens', 'totalRevenue']

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<KpiSummaryDTO | null>(null)
  const [usage, setUsage] = useState<KpiUsageDTO[]>([])
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, 'day'), dayjs()])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const [summaryResult, usageResult] = await Promise.all([
        getKpiSummary(), getKpiUsage(range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')),
      ])
      setSummary(summaryResult)
      setUsage(usageResult)
    } catch { setError(true) } finally { setLoading(false) }
  }, [range])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const columns: TableProps<KpiUsageDTO>['columns'] = [
    { title: t('date'), dataIndex: 'date', key: 'date' },
    { title: t('requests'), dataIndex: 'requests', key: 'requests' },
    { title: t('successfulRequests'), dataIndex: 'successfulRequests', key: 'successfulRequests' },
    { title: t('failedRequests'), dataIndex: 'failedRequests', key: 'failedRequests' },
    { title: t('totalTokens'), dataIndex: 'totalTokens', key: 'totalTokens', render: (value: number) => value.toLocaleString() },
    { title: t('chargedAmount'), dataIndex: 'chargedAmount', key: 'chargedAmount', render: (value: number) => value.toLocaleString() },
  ]

  return <Card className="feature-card">
    <Text className="eyebrow">{t('admin')}</Text><Title level={2}>{t('kpiDashboard')}</Title>
    {error ? <Alert type="error" showIcon message={t('requestFailed')} action={<Button onClick={() => void load()}>{t('retry')}</Button>} /> : loading && !summary ? <Skeleton active /> : <>
      <Row gutter={[16, 16]} className="kpi-grid">
        {summaryKeys.map((key) => <Col xs={12} md={6} key={key}><Card size="small"><Statistic title={t(key)} value={summary?.[key] ?? 0} precision={key.toLowerCase().includes('revenue') ? 2 : 0} /></Card></Col>)}
      </Row>
      <div className="section-heading usage-heading"><Title level={3}>{t('usageByDate')}</Title><RangePicker value={range} allowClear={false} onChange={(value) => { if (value?.[0] && value[1]) setRange([value[0], value[1]]) }} /></div>
      {usage.length ? <Table<KpiUsageDTO> rowKey="date" columns={columns} dataSource={usage} loading={loading} pagination={false} scroll={{ x: 700 }} /> : <Empty description={t('noUsage')} />}
      <Text type="secondary">{t('revenueBreakdown')}: {t('subscriptionRevenue')} {summary?.subscriptionRevenue.toLocaleString()} · {t('creditPurchaseRevenue')} {summary?.creditPurchaseRevenue.toLocaleString()}</Text>
    </>}
  </Card>
}
