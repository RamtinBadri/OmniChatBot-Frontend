import { useEffect, useState } from 'react'
import { Alert, Card, Empty, Pagination, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useTranslation } from 'react-i18next'
import { getPlans } from '../api/plans'
import type { PlanDTO } from '../api/plans'
import type { PageDTO } from '../api/types'

const { Title, Text } = Typography

export function PlansPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [plans, setPlans] = useState<PageDTO<PlanDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    getPlans(page, size)
      .then((result) => { if (active) { setPlans(result); setError(false) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, size])

  const columns: TableProps<PlanDTO>['columns'] = [
    { title: t('planName'), dataIndex: 'name', key: 'name' },
    { title: t('price'), dataIndex: 'price', key: 'price', render: (value: number) => value.toLocaleString() },
    { title: t('durationDays'), dataIndex: 'duration', key: 'duration' },
    { title: t('creditLimit'), dataIndex: 'creditLimit', key: 'creditLimit', render: (value: number) => value.toLocaleString() },
  ]

  return (
    <Card className="feature-card">
      <Text className="eyebrow">{t('catalog')}</Text>
      <Title level={2}>{t('plans')}</Title>
      {error ? <Alert type="error" showIcon message={t('requestFailed')} action={<a onClick={() => { setLoading(true); setError(false); void getPlans(page, size).then(setPlans).catch(() => setError(true)).finally(() => setLoading(false)) }}>{t('retry')}</a>} /> : (
        <>
          {loading && !plans ? <Skeleton active /> : plans?.content.length ? (
            <Table<PlanDTO>
              rowKey="id"
              columns={columns}
              dataSource={plans.content}
              loading={loading}
              pagination={false}
              scroll={{ x: 580 }}
            />
          ) : <Empty description={t('noPlans')} />}
          <Pagination
            className="plans-pagination"
            current={page + 1}
            pageSize={size}
            total={plans?.totalElements ?? 0}
            showSizeChanger
            pageSizeOptions={[10, 20, 50]}
            showTotal={(total) => t('totalPlans', { count: total })}
            onChange={(current, pageSize) => { setPage(pageSize === size ? current - 1 : 0); setSize(pageSize) }}
          />
        </>
      )}
    </Card>
  )
}
