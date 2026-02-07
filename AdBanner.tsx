import React, { useEffect } from 'react';

interface AdBannerProps {
    slot: string;
    format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
    style?: React.CSSProperties;
}

export const AdBanner: React.FC<AdBannerProps> = ({
    slot,
    format = 'auto',
    style
}) => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            console.error('AdSense error:', error);
        }
    }, []);

    return (
        <div className="my-6 flex justify-center" style={style}>
            <ins
                className="adsbygoogle"
                style={{
                    display: 'block',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem'
                }}
                data-ad-client="ca-pub-6270405920172371"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
};
