import { useEffect } from 'react';
import { useRouter } from 'next/router';

const StartViewSession = () => {
    const router = useRouter();
    const { childId } = router.query;

    useEffect(() => {
        if (childId) {
            fetch('/api/parent/get-child-view-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childId }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.viewToken) {
                    document.cookie = `view_token=${data.viewToken}; path=/; max-age=3600; SameSite=Lax`;
                    window.location.href = '/dashboard';
                }
            });
        }
    }, [childId]);

    return <div>جاري تحضير جلسة المشاهدة...</div>;
};
export default StartViewSession;
