import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { allocateMovieSlugForSeed } from '../src/lib/movieSlug'
import { NETFLIX_FILM_TITLES } from './netflix-titles-data'

const prisma = new PrismaClient()

/** タイトル重複（表記ゆれ・リスト二重登録）を除く */
function dedupeTitles(titles: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of titles) {
    const t = raw.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

function uniqueSlugs(titles: readonly string[]): { title: string; slug: string }[] {
  const used = new Set<string>()
  const out: { title: string; slug: string }[] = []
  for (const title of titles) {
    out.push({ title, slug: allocateMovieSlugForSeed(title, used) })
  }
  return out
}

async function main() {
  const managerHash = await bcrypt.hash('manager1234', 10)
  await prisma.user.upsert({
    where: { email: 'manager@admin.local' },
    update: { passwordHash: managerHash, name: '管理者', role: UserRole.ADMIN },
    create: {
      email: 'manager@admin.local',
      passwordHash: managerHash,
      name: '管理者',
      role: UserRole.ADMIN,
    },
  })

  const demoHash = await bcrypt.hash('demo1234', 10)
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: { passwordHash: demoHash, role: UserRole.USER },
    create: {
      email: 'demo@example.com',
      passwordHash: demoHash,
      name: 'デモユーザー',
      role: UserRole.USER,
    },
  })

  const testHash = await bcrypt.hash('test', 10)
  await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: { passwordHash: testHash, name: 'test', role: UserRole.USER },
    create: {
      email: 'test@test.com',
      passwordHash: testHash,
      name: 'test',
      role: UserRole.USER,
    },
  })

  await prisma.movie.upsert({
    where: { slug: 'night-at-the-museum' },
    update: {},
    create: {
      title: 'Night at the Museum',
      slug: 'night-at-the-museum',
    },
  })

  const nightMuseumRemoved = await prisma.movie.deleteMany({
    where: { slug: 'night-museum' },
  })
  if (nightMuseumRemoved.count > 0) {
    console.log('Removed "Night Museum" (night-museum) and linked reviews.')
  }

  const deleted = await prisma.review.deleteMany({
    where: { user: { email: 'demo@example.com' } },
  })
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} demo user review(s).`)
  }

  const removed = await prisma.movie.deleteMany({
    where: { slug: { startsWith: 'dummy-movie-' } },
  })
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} old dummy-movie-* rows.`)
  }

  const uniqueTitles = dedupeTitles(NETFLIX_FILM_TITLES)
  const movies = uniqueSlugs(uniqueTitles)
  console.log(`Netflix 系映画タイトル: リスト ${NETFLIX_FILM_TITLES.length} 件 → 重複除去後 ${uniqueTitles.length} 件 → slug ${movies.length} 件`)

  let inserted = 0
  for (const { title, slug } of movies) {
    const before = await prisma.movie.findUnique({ where: { slug } })
    await prisma.movie.upsert({
      where: { slug },
      update: { title },
      create: { title, slug },
    })
    if (!before) inserted += 1
  }
  console.log(`Netflix-title movies: ${inserted} newly inserted, ${movies.length} ensured (slug from title).`)

  const nightMovie = await prisma.movie.findUniqueOrThrow({
    where: { slug: 'night-at-the-museum' },
  })
  const demoUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'demo@example.com' },
  })
  const testUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'test@test.com' },
  })

  await prisma.review.deleteMany({
    where: {
      movieId: nightMovie.id,
      userId: { in: [demoUser.id, testUser.id] },
    },
  })

  const sampleBodyJa =
    'この映画は博物館の夜を舞台にした作品です。主人公の成長が印象的でした。\n\n家族や仕事への向き合い方にも考えさせられます。'
  const sampleBodyEn =
    'This film is set in a museum at night. The main character’s growth really stood out.\n\nIt also made me think about family and work.'

  await prisma.review.create({
    data: {
      userId: demoUser.id,
      movieId: nightMovie.id,
      titleJa: 'デモユーザー：Night at the Museum 感想',
      bodyJa: sampleBodyJa,
      titleEn: 'Demo user: thoughts on Night at the Museum',
      bodyEn: sampleBodyEn,
    },
  })
  await prisma.review.create({
    data: {
      userId: testUser.id,
      movieId: nightMovie.id,
      titleJa: 'testユーザー：Night at the Museum 感想',
      bodyJa: sampleBodyJa,
      titleEn: 'test user: thoughts on Night at the Museum',
      bodyEn: sampleBodyEn,
    },
  })
  console.log('Sample reviews on Night at the Museum: demo@example.com, test@test.com (編集・削除の確認用).')

  const testMovie = await prisma.movie.upsert({
    where: { slug: 'test' },
    update: { title: 'test' },
    create: { title: 'test', slug: 'test' },
  })
  await prisma.review.deleteMany({
    where: { movieId: testMovie.id, userId: demoUser.id },
  })
  await prisma.review.create({
    data: {
      userId: demoUser.id,
      movieId: testMovie.id,
      titleJa: 'test',
      bodyJa: 'test',
      titleEn: 'test',
      bodyEn: 'test',
    },
  })
  console.log('Movie "test" + demo user review (title/body all "test") for 編集・削除確認.')

  console.log(
    'Seed OK: Manager / manager1234（管理者）· demo@example.com / demo1234 · test@test.com / test'
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
