import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { MovieCreateForm } from '@/components/MovieCreateForm'
import { MovieCsvImportForm } from '@/components/MovieCsvImportForm'
import { MovieSlugRepairForm } from '@/components/MovieSlugRepairForm'
import { isAdminRole } from '@/lib/roles'

export default async function NewMoviePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/movies/new')
  }

  if (!isAdminRole(session.user.role)) {
    redirect('/movies')
  }

  return (
    <>
      <h1 className="page-title">映画を追加（管理者）</h1>
      <p className="page-lead">
        タイトルを登録したあと、母国語・学習言語で感想を投稿する画面へ進みます。管理者は月額プランなしで映画の追加・CSV
        一括登録ができます。
      </p>
      <MovieCreateForm />

      <hr className="form-section-rule" />

      <h2 className="page-title movies-page__title movies-page__title--section">CSV から一括登録</h2>
      <p className="page-lead">
        映画タイトルだけをまとめて登録できます。登録後は各映画ページから感想を投稿してください。
      </p>
      <MovieCsvImportForm />

      <hr className="form-section-rule" />

      <MovieSlugRepairForm />
    </>
  )
}
