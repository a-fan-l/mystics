'use client';

import React, { useMemo } from 'react';

import { communities, CommunityItem } from '@constants/community';

export interface CommunityProps {
  isExclude?: boolean;
  data?: Array<CommunityItem>;
}

const Index: React.FC<CommunityProps> = ({ data = [], isExclude = true }) => {
  const list = useMemo(() => {
    if (isExclude && data.length > 0) {
      return data;
    }
    return [...communities, ...data];
  }, [data, isExclude]);

  return (
    <div className="community-root flex items-center">
      {list.map(o => {
        return (
          <a key={o.id} href={o.href} target="_blank" className="community-li" rel="noreferrer">
            <o.logo />
            {o.title && <span className="title">{o.title}</span>}
            {o.desc && <span className="desc">{o.desc}</span>}
          </a>
        );
      })}
    </div>
  );
};

export default Index;
