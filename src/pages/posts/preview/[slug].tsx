import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import Link from "next/link";
import { RichText } from "prismic-dom";
import { getPrismicClient } from "../../../services/prismic";
import styles from "../post.module.scss";
import { useEffect } from "react";

interface PostPreview {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

export default function PostPreview({ post }: PostPreview) {
  // we'll verify here the user status because getStaticProps doesn't support these dynamic data (doesn't receive req)
  const [session] = useSession();
  const router = useRouter();

  useEffect(()=> {
    if(session?.activeSubscription){
      router.push(`/posts/${post.slug}`)
    }
  },[session])

  return (
    <>
      <Head>
        <title>{post.title} | Ig.news</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            className={`${styles.postContent} ${styles.previewContent}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className={styles.continueReading}>
            Want to continue reading?
            <Link href="/">
              <a>Subscribe Now 🤗️</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [], // here goes the pages you want to be created in yarn build, 
    fallback: "blocking", // true, false, or blocking --> true is not good, causes layout shift
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID("p", String(slug), {});

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString(
      "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ),
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30 // 30 minutes
  };
};
