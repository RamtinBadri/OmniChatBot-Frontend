import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, message, Skeleton, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { getCurrentUser, updateUser } from '../api/users'
import type { UserDTO } from '../api/users'

const { Title } = Typography

export function ProfilePage() {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((currentUser) => {
        if (!active) return
        setUser(currentUser)
        form.setFieldsValue(currentUser)
      })
      .catch(() => {
        if (active) messageApi.error(t('requestFailed'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [form, messageApi, t])

  async function save(values: Pick<UserDTO, 'email' | 'firstName' | 'lastName'>) {
    if (!user) return
    setSaving(true)
    try {
      const updated = await updateUser(user.id, values)
      setUser(updated)
      form.setFieldsValue(updated)
      messageApi.success(t('profileSaved'))
    } catch {
      messageApi.error(t('requestFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Card className="profile-card" loading={loading}>
        {loading ? <Skeleton active /> : <>
          <Title level={2}>{t('profile')}</Title>
          <Form form={form} layout="vertical" onFinish={save}>
            <Form.Item name="email" label={t('email')} rules={[{ required: true, message: t('required') }, { type: 'email', message: t('invalidEmail') }]}>
              <Input autoComplete="email" />
            </Form.Item>
            <Form.Item name="firstName" label={t('firstName')} rules={[{ required: true, message: t('required') }]}>
              <Input autoComplete="given-name" />
            </Form.Item>
            <Form.Item name="lastName" label={t('lastName')} rules={[{ required: true, message: t('required') }]}>
              <Input autoComplete="family-name" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>{t('save')}</Button>
          </Form>
        </>}
      </Card>
    </>
  )
}
