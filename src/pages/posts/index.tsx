import Head from "next/head";
import { GetStaticProps } from "next";
import styles from "./styles.module.scss";
import Prismic from "@prismicio/client";
import { getPrismicClient } from "../../services/prismic";
import { RichText } from 'prismic-dom';
import Link from 'next/link';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
}

interface PostsProps {
  posts: Post[]
}

export default function Posts({ posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | Ig.news</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/posts/${post.slug}`}>
              <a key={post.slug}>
                <time>{post.updatedAt}</time>
                <strong>{post.title}</strong>
                <p>
                  {post.excerpt}
                </p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  // the querying methods come from the prismic documentation
  const response = await prismic.query(
    Prismic.predicates.at("document.type", "p"),
    {
      fetch: ["p.title", "p.content"],
      pageSize: 100,
    }

  );

  // this is for formatting data before displaying on front-end
  const posts = response.results.map(post => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      excerpt: post.data.content.find(content => content.type === 'paragraph')?.text ?? '', // if doesn't find, give empty string. The question mark before .text avoids problems with undefined
      updatedAt: new Date(post.last_publication_date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
  })

  return {
    props: {
      posts
    },
  };
};
