import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';

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
}

export default function Post({ post }: PostProps) {
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

      <img className={styles.banner} src={post.data.banner.url} alt='banner'/>

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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = response;

  return {
    props: {
      post
    }
  }
};
