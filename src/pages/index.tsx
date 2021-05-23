import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function getMorePosts() {
    fetch(postsPagination.next_page).then(data =>  data.json()).then(data => {
      setNextPage(data.next_page);
      let newPosts: Post[] = [...posts];
      setPosts(newPosts.concat(data.results));
    })
  }

  return(
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <div className={styles.container}>
        <div className={commonStyles.mini_container}>
          { posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <div className={commonStyles.textAndIcon}>
                    <FiCalendar/>
                    <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
                  </div>
                  <div className={commonStyles.textAndIcon}>
                    <FiUser/>
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          )) }

          { nextPage && (<button onClick={getMorePosts}>Carregar mais posts</button>) }
        </div>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 1
  });

  const postsPagination = postsResponse;

  return {
    props: {
      postsPagination
    }
  }
};
