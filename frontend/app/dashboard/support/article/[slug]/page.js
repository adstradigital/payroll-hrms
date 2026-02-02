import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ArticleDetail from '@/components/ClientAdmin/Support/ArticleDetail/ArticleDetail';

export default function ArticlePage({ params }) {
    return (
        <Dashboard breadcrumbs={['Support', 'Help Center', 'Article']}>
            <ArticleDetail slug={params.slug} />
        </Dashboard>
    );
}
