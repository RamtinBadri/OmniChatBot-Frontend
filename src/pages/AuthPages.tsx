import { Button, Card, Form, Input, Typography, message } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, register } from '../api/auth'
import type { LoginRequest, RegisterRequest } from '../api/auth'

const { Title, Text } = Typography

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [messageApi, contextHolder] = message.useMessage()

  async function submit(values: LoginRequest) {
    try {
      await login(values)
      messageApi.success(t('loginSuccess'))
      navigate(params.get('next') || '/', { replace: true })
    } catch {
      messageApi.error(t('requestFailed'))
    }
  }

  return (
    <main className="auth-page">
      {contextHolder}
      <Card className="auth-card">
        <Title level={2}>{t('signIn')}</Title>
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="username" label={t('username')} rules={[{ required: true, message: t('required') }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label={t('password')} rules={[{ required: true, message: t('required') }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{t('signIn')}</Button>
        </Form>
        <Text>{t('noAccount')} <Link to="/register">{t('signUp')}</Link></Text>
      </Card>
    </main>
  )
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()

  async function submit(values: RegisterRequest & { confirmPassword: string }) {
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      })
      messageApi.success(t('registerSuccess'))
      navigate('/login', { replace: true })
    } catch {
      messageApi.error(t('requestFailed'))
    }
  }

  return (
    <main className="auth-page">
      {contextHolder}
      <Card className="auth-card">
        <Title level={2}>{t('signUp')}</Title>
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="username" label={t('username')} rules={[{ required: true, message: t('required') }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="email" label={t('email')} rules={[{ required: true, message: t('required') }, { type: 'email', message: t('invalidEmail') }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="firstName" label={t('firstName')} rules={[{ required: true, message: t('required') }]}>
            <Input autoComplete="given-name" />
          </Form.Item>
          <Form.Item name="lastName" label={t('lastName')} rules={[{ required: true, message: t('required') }]}>
            <Input autoComplete="family-name" />
          </Form.Item>
          <Form.Item name="password" label={t('password')} rules={[{ required: true, message: t('required') }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue('password') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('passwordMismatch')))
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{t('signUp')}</Button>
        </Form>
        <Text>{t('haveAccount')} <Link to="/login">{t('signIn')}</Link></Text>
      </Card>
    </main>
  )
}
