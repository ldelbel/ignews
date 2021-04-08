import Prismic from '@prismicio/client';

// this method is different because we're followiwng the prismic documentation
export function getPrismicClient(req?: unknown) {
  const prismic = Prismic.client(
    process.env.PRISMIC_ENDPOINT,
    {
      req,
      accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    }
  )

  return prismic;
}