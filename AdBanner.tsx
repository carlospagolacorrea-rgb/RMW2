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
        <div className="my-8 flex justify-center w-full min-h-[100px] min-w-[250px]" style={style}>
            <ins
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: '100%',
                    minWidth: '250px',
                    minHeight: '100px',
                    border: '1px solid rgba(245, 158, 11, 0.1)',
                    background: 'rgba(0, 0, 0, 0.2)',
                }}
                data-ad-client="ca-pub-6270405920172371"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
};
