import { RegisterForm } from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <>
      <h1 className="page-title">新規登録</h1>
      <p className="page-lead">ユーザーごとに、母国語と学習言語を選んで映画感想を投稿できます。</p>
      <RegisterForm />
    </>
  )
}
