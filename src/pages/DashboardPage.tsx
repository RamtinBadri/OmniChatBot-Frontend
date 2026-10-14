import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Empty, Pagination, Row, Skeleton, Statistic, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getModelCatalog } from '../api/models'
import type { ModelCatalogDTO } from '../api/models'
import { getUsageHistory, getUsageSummary } from '../api/usage'
import type { UsageRecordDTO, UsageSummaryDTO } from '../api/usage'
import type { PageDTO } from '../api/types'

const { Title, Text } = Typography

export function UsageDashboard() {
  const { t } = useTranslation()
  const [catalog, setCatalog] = useState<ModelCatalogDTO | null>(null)
  const [summary, setSummary] = useState<UsageSummaryDTO | null>(null)
  const [history, setHistory] = useState<PageDTO<UsageRecordDTO> | null>(null)
  const [page, setPage] = useState(0)
  const [modelPage, setModelPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) {
        setLoading(true)
        setError(false)
      }
    })
    void Promise.allSettled([getModelCatalog(modelPage, 12), getUsageSummary(), getUsageHistory(page, 10)])
      .then(([models, totals, records]) => {
        if (!active) return
        if (models.status === 'fulfilled') setCatalog(models.value)
        if (totals.status === 'fulfilled') setSummary(totals.value)
        if (records.status === 'fulfilled') setHistory(records.value)
        setError([models, totals, records].some((result) => result.status === 'rejected'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, modelPage, reload])

  const columns: TableProps<UsageRecordDTO>['columns'] = [
    { title: t('date'), dataIndex: 'timestamp', key: 'timestamp', render: (value: string) => new Date(value).toLocaleString() },
    { title: t('model'), dataIndex: 'model', key: 'model' },
    { title: t('totalTokens'), dataIndex: 'totalTokens', key: 'totalTokens', render: (value: number) => value.toLocaleString() },
    { title: t('chargedAmount'), dataIndex: 'chargedAmount', key: 'chargedAmount', render: (value: number) => Number(value).toLocaleString() },
  ]

  return <div className="dashboard-page">
    <section className="welcome-panel dashboard-welcome"><Text className="eyebrow">{t('overview')}</Text><Title level={2}>{t('dashboard')}</Title><Text type="secondary">{t('dashboardDescription')}</Text><Link to="/conversations"><Button type="primary">{t('conversations')}</Button></Link></section>
    {error && <Alert type="error" showIcon message={t('requestFailed')} action={<Button onClick={() => setReload((current) => current + 1)}>{t('retry')}</Button>} />}
    <Card className="feature-card dashboard-models"><div className="section-heading"><div><Text className="eyebrow">{t('availableModels')}</Text><Title level={3}>{t('models')}</Title></div></div>
      {loading && !catalog ? <Skeleton active /> : catalog?.models.content.length ? <><Row gutter={[12, 12]}>{catalog.models.content.map((model) => <Col xs={24} sm={12} lg={8} key={model.id}><Card size="small" className={model.defaultModel ? 'model-card model-card-default' : 'model-card'}><Text strong>{model.name}</Text>{model.defaultModel && <Text type="secondary">{t('defaultModel')}</Text>}</Card></Col>)}</Row><Pagination className="plans-pagination" current={modelPage + 1} pageSize={catalog.models.size} total={catalog.models.totalElements} onChange={(current) => setModelPage(current - 1)} /></> : <Empty description={t('noModels')} />}
    </Card>
    <Card className="feature-card dashboard-usage"><Text className="eyebrow">{t('usageHistory')}</Text><Title level={3}>{t('usageSummary')}</Title>
      {loading && !summary ? <Skeleton active /> : summary && <Row gutter={[12, 12]} className="usage-stats"><Col xs={12} md={6}><Statistic title={t('totalRequests')} value={summary.totalRequests} /></Col><Col xs={12} md={6}><Statistic title={t('totalTokens')} value={summary.totalTokens} /></Col><Col xs={12} md={6}><Statistic title={t('inputTokens')} value={summary.totalInputTokens} /></Col><Col xs={12} md={6}><Statistic title={t('outputTokens')} value={summary.totalOutputTokens} /></Col></Row>}
      <Title level={4} className="history-title">{t('usageHistory')}</Title>
      {history?.content.length ? <Table<UsageRecordDTO> rowKey="id" columns={columns} dataSource={history.content} loading={loading} pagination={false} scroll={{ x: 600 }} /> : <Empty description={t('noUsageHistory')} />}
      <Pagination className="plans-pagination" current={page + 1} pageSize={10} total={history?.totalElements ?? 0} onChange={(current) => setPage(current - 1)} />
    </Card>
  </div>
}
