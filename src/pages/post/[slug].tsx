import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import PreviewButton from '../../components/PreviewButton';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: NeighborhoodPost;
  previousPost: NeighborhoodPost;
}

interface NeighborhoodPost {
  title: string;
  uid: string;
}

export default function Post({ post, preview, previousPost, nextPost }: PostProps) {
  const router = useRouter()

  const totalContent = post.data.content.reduce((acc, el) => {
    const textBody = PrismicDOM.RichText.asText(el.body);
    const words = textBody.split(' ');
    acc.words += words.length;
    return acc;
  }, {
    words: 0
  })

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return(
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      {post.data.banner.url && <img className={styles.banner} src={post.data.banner.url} alt='banner'/>}

      <main className={commonStyles.container}>
        <article className={`${commonStyles.mini_container} ${styles.post}`}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <div className={commonStyles.textAndIcon}>
              <FiCalendar/>
              <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
            </div>
            <div className={commonStyles.textAndIcon}>
              <FiUser/>
              <span>{post.data.author}</span>
            </div>
            <div className={commonStyles.textAndIcon}>
              <FiClock/>
              <span>{Math.ceil(totalContent.words/200)} min</span>
            </div>
          </div>

          { post.data.content.map(content => (
            <div key={Math.random()} className={styles.content}>
              <h2>{content.heading}</h2>
              { content.body.map(body => (
                <div
                  key={Math.random()}
                  dangerouslySetInnerHTML={{ __html: body.text }}
                />
              )) }
            </div>
          )) }

          <div className={styles.divider}/>
          <div className={styles.neighbors}>
            {previousPost && <div className={styles.previousPost}>
              <span>{previousPost.title}</span>
              <Link href={`/post/${previousPost.uid}`}>
                <strong>Post anterior</strong>
              </Link>
            </div>}

            {nextPost && <div className={styles.nextPost}>
              <span>{nextPost.title}</span>
              <Link href={`/post/${nextPost.uid}`}>
                <strong>Próximo post</strong>
              </Link>
            </div>}
          </div>

          <Comments/>

          { preview && <PreviewButton/> }
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);

  let paths = [];

  paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return { paths, fallback: true }
};

function verifyNeighborhoodPost(post, slug): NeighborhoodPost | null {
  return slug === post.results[0].uid
      ? null
      : {
        title: post.results[0]?.data?.title,
        uid: post.results[0]?.uid,
      };
}

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const responsePreviousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const responseNextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1, after: slug, orderings: '[document.first_publication_date]' }
  );

  const nextPost = verifyNeighborhoodPost(responseNextPost, slug);

  const previousPost = verifyNeighborhoodPost(responsePreviousPost, slug);

  const post = response;

  return {
    props: {
      post,
      preview,
      nextPost,
      previousPost
    }
  }
};
